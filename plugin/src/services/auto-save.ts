import type { Message, Part } from "@opencode-ai/sdk";
import type { PluginInput } from "@opencode-ai/plugin";
import { memoryClient } from "./client.js";
import { log } from "./logger.js";
import { CONFIG } from "../config.js";

const MIN_EXCHANGE_CHARS = 100;
const MAX_MESSAGES = 8;
const COOLDOWN_MS = 15_000;

export interface CachedMessage {
  info: Message;
  parts: Part[];
}

// Module-level cache updated by experimental.chat.messages.transform before every LLM call.
// Shared across all plugin instances (module scope = singleton).
// NOTE: this cache only includes messages UP TO (not including) the latest LLM response,
// because the transform fires BEFORE the LLM call. In single-turn sessions (opencode run),
// this means the cache will only ever contain the user message, causing auto-save to skip
// (recentCount < 2). We work around this by fetching fresh messages from the SDK client
// when available, falling back to the cache for older code paths.
let cachedMessages: CachedMessage[] = [];

export function updateMessageCache(messages: CachedMessage[]): void {
  cachedMessages = messages;
  log("auto-save: message cache updated", { count: messages.length });
}

const lastExtracted = new Map<string, number>();

// Track turn counts per session for periodic session summaries.
const turnCountPerSession = new Map<string, number>();

export function createAutoSaveHook(
  tags: { user: string; project: string },
  client?: PluginInput["client"]
) {
  return {
    async onSessionIdle(sessionID: string): Promise<void> {
      const now = Date.now();
      const last = lastExtracted.get(sessionID) ?? 0;

      if (now - last < COOLDOWN_MS) {
        log("auto-save: skipped (cooldown)", { sessionID, msSinceLast: now - last });
        return;
      }

      lastExtracted.set(sessionID, now);
      if (lastExtracted.size > 500) {
        const oldest = lastExtracted.keys().next().value;
        if (oldest) lastExtracted.delete(oldest);
      }

      const snapshot = [...cachedMessages];
      log("auto-save: triggered", { sessionID, snapshotSize: snapshot.length });

      // Increment turn counter
      const prevCount = turnCountPerSession.get(sessionID) ?? 0;
      const newCount = prevCount + 1;
      turnCountPerSession.set(sessionID, newCount);
      if (turnCountPerSession.size > 500) {
        const oldest = turnCountPerSession.keys().next().value;
        if (oldest) turnCountPerSession.delete(oldest);
      }

      // Await fact extraction so it completes before the process exits
      // (critical for opencode run single-turn sessions that exit immediately after)
      const promises: Promise<void>[] = [
        extractAndSave(snapshot, tags, sessionID, client).catch(
          (err) => log("auto-save: unhandled error", { error: String(err) })
        ),
      ];

      // Every N turns, also generate a session-summary
      const interval = CONFIG.turnSummaryInterval ?? 5;
      if (newCount % interval === 0) {
        log("auto-save: generating session summary", { sessionID, turn: newCount });
        promises.push(
          generateSessionSummary(snapshot, tags, sessionID, client).catch(
            (err) => log("auto-save: session summary error", { error: String(err) })
          )
        );
      }

      await Promise.all(promises);
    },
  };
}

/**
 * Fetch the current session messages via the SDK client.
 * Falls back to the provided snapshot if the fetch fails or the client is unavailable.
 * This is needed for single-turn sessions (opencode run) where the transform cache
 * only has the user message at the time auto-save fires.
 */
async function fetchMessages(
  sessionID: string,
  snapshot: CachedMessage[],
  client?: PluginInput["client"]
): Promise<CachedMessage[]> {
  if (!client) return snapshot;
  try {
    // v1 plugin SDK uses path.id format: { path: { id: sessionID } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (client.session as any).messages({ path: { id: sessionID } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (res as any).data as Array<{ info: Message; parts: Part[] }> | undefined;
    if (data && data.length > 0) {
      log("auto-save: fetched fresh messages from SDK", { sessionID, count: data.length });
      return data;
    }
  } catch (err) {
    log("auto-save: SDK message fetch failed, using cache", { sessionID, error: String(err) });
  }
  return snapshot;
}

async function extractAndSave(
  snapshot: CachedMessage[],
  tags: { user: string; project: string },
  sessionID: string,
  client?: PluginInput["client"]
): Promise<void> {
  try {
    const allMessages = await fetchMessages(sessionID, snapshot, client);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Filter to user/assistant messages that have real (non-synthetic) text content.
    // NOTE: We intentionally do NOT filter out messages where info.summary === true.
    // In opencode run (single-turn) mode, the first user message is marked summary:true
    // by OpenCode (it bundles context), but it still contains the real user text.
    // Excluding summary messages caused realCount to always be 1, breaking auto-save.
    const real = allMessages.filter((m: any) => {
      const role = m.info?.role as string;
      return (role === "user" || role === "assistant") &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        m.parts?.some((p: any) => p.type === "text" && !p.synthetic && p.text?.trim());
    });

    const recent = real.slice(-MAX_MESSAGES);

    log("auto-save: filtered", { sessionID, realCount: real.length, recentCount: recent.length });

    if (recent.length < 2) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = recent.map((m: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = (m.parts ?? []).filter((p: any) => p.type === "text" && !p.synthetic && p.text?.trim())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => p.text as string)
        .join("\n").trim();
      return { role: m.info.role as string, content: text };
    }).filter((m: { role: string; content: string }) => m.content.length > 0);

    const totalChars = messages.reduce((sum: number, m: { content: string }) => sum + m.content.length, 0);

    if (totalChars < MIN_EXCHANGE_CHARS) {
      log("auto-save: skipped (too short)", { totalChars, sessionID });
      return;
    }

    log("auto-save: extracting", { sessionID, messages: messages.length, chars: totalChars });

    const result = await memoryClient.addMemoryFromMessages(messages, tags.project);

    log("auto-save: done", { sessionID, success: result.success, count: result.count });
  } catch (err) {
    log("auto-save: failed", { sessionID, error: String(err) });
  }
}

async function generateSessionSummary(
  snapshot: CachedMessage[],
  tags: { user: string; project: string },
  sessionID: string,
  client?: PluginInput["client"]
): Promise<void> {
  try {
    const allMessages = await fetchMessages(sessionID, snapshot, client);
    // Same filter as extractAndSave — do NOT exclude summary:true messages.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const real = allMessages.filter((m: any) => {
      const role = m.info?.role as string;
      return (role === "user" || role === "assistant") &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        m.parts?.some((p: any) => p.type === "text" && !p.synthetic && p.text?.trim());
    });

    // Use more messages for session summary — we want broader context
    const recent = real.slice(-20);

    if (recent.length < 4) {
      log("auto-save: session summary skipped (not enough messages)", { sessionID });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = recent.map((m: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = (m.parts ?? []).filter((p: any) => p.type === "text" && !p.synthetic && p.text?.trim())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => p.text as string)
        .join("\n").trim();
      return { role: m.info.role as string, content: text };
    }).filter((m: { role: string; content: string }) => m.content.length > 0);

    const totalChars = messages.reduce((sum: number, m: { content: string }) => sum + m.content.length, 0);
    if (totalChars < MIN_EXCHANGE_CHARS) return;

    log("auto-save: sending session summary request", { sessionID, messages: messages.length });

    const result = await memoryClient.addMemoryFromMessagesAsSummary(messages, tags.project);

    log("auto-save: session summary done", { sessionID, success: result.success, count: result.count });
  } catch (err) {
    log("auto-save: session summary failed", { sessionID, error: String(err) });
  }
}
