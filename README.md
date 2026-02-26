<div align="center">

# codexfi

**Persistent memory for [OpenCode](https://opencode.ai) AI agents.**

The agent learns from every session automatically — no commands, no manual saves, no cloud.

<br/>

[![npm](https://img.shields.io/npm/v/codexfi?style=flat&color=CB3837)](https://www.npmjs.com/package/codexfi)
[![License: MIT](https://img.shields.io/badge/License-MIT-F7DF1E?style=flat)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-FBF0DF?style=flat&logo=bun&logoColor=black)](https://bun.sh/)
[![LanceDB](https://img.shields.io/badge/LanceDB-Embedded-CF3CFF?style=flat)](https://lancedb.com/)
[![Voyage AI](https://img.shields.io/badge/Voyage_AI-Code_Embeddings-5B6BF5?style=flat)](https://www.voyageai.com/)
[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-FF6B35?style=flat)](https://opencode.ai)

</div>

<div align="center">

![codexfi dashboard](.github/assets/dashboard.png)

</div>

---

## What is this?

OpenCode starts every session from scratch. No memory of past decisions, established patterns, previous mistakes, or project context. Every session, you repeat yourself.

**codexfi fixes this permanently.**

After every assistant turn, the conversation is automatically analysed. Key facts are extracted and stored locally on your machine. At the start of every new session, relevant memories are silently injected into the agent's context. From the agent's perspective, it simply *remembers* — across days, weeks, and projects.

**The agent never thinks about saving memories. It just happens.**

---

## Quick Start

### Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| [Bun](https://bun.sh) | Runtime | `curl -fsSL https://bun.sh/install \| bash` |
| [OpenCode](https://opencode.ai) | AI coding agent | `npm i -g opencode-ai` |
| Extraction API key | Memory extraction (pick one) | [console.anthropic.com](https://console.anthropic.com) · [console.x.ai](https://console.x.ai) · [aistudio.google.com](https://aistudio.google.com/apikey) |
| Voyage AI API key | Code embeddings | [voyageai.com](https://www.voyageai.com) — free tier available |

### Install

```bash
bunx codexfi install
```

That's it. The installer:
- Prompts for your API keys (stored in `~/.config/opencode/codexfi.jsonc`)
- Registers the plugin in `~/.config/opencode/opencode.json`
- Creates a `/memory-init` slash command

Start any OpenCode session — you'll see a `[MEMORY]` block in context confirming the plugin is active. Memories save automatically after every turn from here on.

> **LLM-driven install:** Paste this README URL into an OpenCode chat and the agent can run `bunx codexfi install --no-tui` to set up non-interactively.

---

## Features

- **Fully automatic** — memories save after every assistant turn with zero user action
- **Multi-provider extraction** — Anthropic Haiku (default, most consistent), xAI Grok (fastest), or Google Gemini
- **100% local** — LanceDB runs embedded in-process; all data in `~/.codexfi/`
- **Always-fresh context** — the `[MEMORY]` block is rebuilt in the system prompt on every LLM call, not appended to history — zero token accumulation
- **Per-turn semantic refresh** — on every user message, semantic search refreshes the "Relevant to Current Task" section to match the current topic
- **Compaction-proof** — memory lives in the system prompt, which is never compacted
- **Code-optimised embeddings** — Voyage `voyage-code-3` is purpose-built for code and technical content
- **Typed memory system** — memories are classified (`architecture`, `error-solution`, `preference`, `progress`, etc.) and injected in structured blocks
- **Hybrid search** — semantic search for retrieval, raw source chunks for exact values (config numbers, error strings, function names)
- **Smart deduplication** — cosine similarity check prevents duplicate memories from accumulating
- **Relational versioning** — new memories automatically supersede contradicted ones
- **Memory aging** — session summaries condense into learned patterns over time; only the latest `progress` survives
- **Project + user scope** — separate namespaces for project-specific knowledge vs. cross-project preferences
- **Explicit save support** — say "remember this" and the agent stores it immediately
- **Web dashboard** — live activity feed, cost tracking, per-project memory browser at `http://localhost:9120`
- **CLI tool** — `codexfi list`, `codexfi search`, `codexfi stats`, `codexfi dashboard`, and more
- **Privacy filter** — wrap content in `<private>...</private>` tags to exclude it from extraction
- **125 KB package** — LanceDB resolved at runtime from node_modules, not bundled

---

## How it compares

| | **codexfi** | Cline memory bank | [Supermemory](https://supermemory.ai) | [mem0](https://mem0.ai) |
|---|---|---|---|---|
| **Storage** | Local (LanceDB embedded) | Markdown files in repo | Supermemory cloud | Local (Qdrant) |
| **Embeddings** | Voyage `voyage-code-3` | None | Cloud | OpenAI |
| **Extraction** | Multi-provider (Anthropic / xAI / Google) | Manual `/save` | Cloud | OpenAI |
| **User action required** | None | `/load` + `/save` each session | None | None |
| **Data privacy** | 100% local | 100% local | Cloud | Local |
| **Code-optimised embeddings** | Yes | No | No | No |
| **Fully automatic saves** | Every turn | Manual | Keyword-only | Keyword-only |
| **Semantic retrieval** | Yes | No (full file dump) | Yes | Yes |
| **Token overhead** | ~3K (system prompt, zero accumulation) | Up to 50K | Varies | Varies |
| **Survives compaction** | Yes (system prompt injection) | No | No | No |
| **Per-turn refresh** | Yes | No | No | No |

---

## How It Works

### Every LLM call — system prompt injection

The `[MEMORY]` block lives in the **system prompt**, not in message history. It is rebuilt fresh on every LLM call via the `system.transform` hook:

- **Turn 1**: Parallel API calls fetch profile, user memories, project memories, and semantic search results. All cached in a per-session `SessionMemoryCache`.
- **Turns 2+**: A single semantic search call (~300ms) refreshes the "Relevant to Current Task" section with results matching the current message topic.
- **Every LLM call**: `system.transform` reads the cache, rebuilds the `[MEMORY]` block, and pushes it into the system prompt.

This means:
- **Zero token accumulation** — the system prompt is rebuilt each call, not appended to history
- **Survives compaction** — the system prompt is never summarised away
- **Always fresh** — topic switches within a session cause different memories to surface

The agent sees this in its system prompt:

```
[MEMORY]

## Project Brief
- codexfi is a persistent memory plugin for OpenCode AI agents.
- Goal: automatic, silent memory across sessions — no user commands required.

## Tech Context
- Plugin uses LanceDB embedded, Voyage AI for embeddings, Anthropic Haiku for extraction
- Config stored in ~/.config/opencode/codexfi.jsonc

## Architecture
- All memory operations run in-process — no HTTP, no Docker, no separate server
- 4 OpenCode hooks: system.transform, messages.transform, message.updated, compaction

## Progress & Status
- 50+ memories stored, cross-session continuity validated across restarts

## Last Session
- Completed Phase 6 cutover: deleted Docker stack, rebranded to codexfi

## User Preferences
- Use pnpm for package management
- Prefers concise responses; no emojis unless explicitly requested

## Relevant to Current Task
- [94%, 2026-02-25] Default extraction model is claude-haiku-4-5 — most consistent
- [88%, 2026-02-23] Contradiction detection marks superseded memories
```

### After every turn — auto-save

Every time the assistant completes a turn, the plugin automatically:

1. Snapshots the recent conversation (last 8 real exchanges)
2. Sends them to the configured extraction LLM
3. The LLM extracts a JSON array of typed, memorable facts
4. Each fact is embedded with `voyage-code-3` and stored in LanceDB after a cosine dedup check
5. The raw source text is stored alongside each memory as a `chunk` (enables hybrid search)
6. A contradiction search finds semantically related existing memories; the LLM identifies any the new memory supersedes — those are excluded from future retrieval

A 15-second cooldown handles OpenCode's double-fire of the completion event.

### Memory types

| Type | What it captures |
|------|-----------------|
| `project-brief` | Core project definition, goals, scope |
| `architecture` | System design, patterns, component relationships |
| `tech-context` | Stack, tools, build commands, constraints |
| `product-context` | Why the project exists, problems solved |
| `progress` | Current state — only the latest entry survives |
| `session-summary` | What was worked on; oldest condense into `learned-pattern` |
| `error-solution` | Bug fixes, gotchas, approaches that failed |
| `preference` | Cross-project personal preferences, workflow habits |
| `learned-pattern` | Reusable patterns condensed from past sessions |

### Explicit saves

Say "remember this", "don't forget", or "memorize" and the agent immediately stores the current context using the `memory` tool — independently of the auto-save cycle.

### Compaction survival

When the context window approaches capacity, OpenCode summarises the conversation and removes old messages. Because the `[MEMORY]` block lives in the system prompt (not in message history), it is never affected by compaction — the agent retains full project context even after truncation.

---

## CLI

codexfi includes a terminal interface for managing memories outside of OpenCode:

```bash
codexfi install       # Register plugin + configure API keys
codexfi list          # Browse memories with type colors and relative dates
codexfi search <q>    # Semantic search with similarity bars
codexfi stats         # DB stats, type distribution, per-project breakdown, API costs
codexfi status        # 6-point health check (DB, keys, plugin, log)
codexfi export        # Export to JSON or CSV
codexfi forget <id>   # Delete by ID or prefix
codexfi dashboard     # Launch web dashboard in browser
```

---

## Extraction Providers

| Provider | Model | Speed | Cost (in/out per MTok) | Benchmark | Notes |
|---|---|---|---|---|---|
| **Anthropic** (default) | `claude-haiku-4-5` | ~14s/session | $1.00 / $5.00 | **93.5% avg** | Most consistent |
| **xAI** | `grok-4-1-fast-non-reasoning` | ~5s/session | $0.20 / $0.50 | ~86.5% avg | Fastest and cheapest |
| **Google** | `gemini-3-flash-preview` | ~21s/session | $0.50 / $3.00 | — | Native JSON mode |

**Why Haiku is the default:** Across 3 benchmark runs (200 questions each), Haiku averaged 93.5% with only 3pp variance, while Grok averaged ~86.5% with 16pp variance. A 20-turn session costs ~$0.11 with Haiku — negligible compared to the main model cost. Extraction runs in the background after each turn, so latency is invisible.

Embeddings use Voyage AI `voyage-code-3` — specifically trained on code and technical content, producing 1024-dimensional vectors. Pricing: $0.18/M tokens with a generous free tier.

---

## Benchmark

Memory quality is measured by [DevMemBench](./benchmark/README.md) — a coding-assistant-specific benchmark. It ingests 25 synthetic sessions from a realistic FastAPI/PostgreSQL/Redis/Stripe + Next.js project, then evaluates retrieval and answer quality across 200 questions in 8 categories using an LLM-as-judge pipeline.

```
tech-stack        ████████████████████ 100%  (25/25)
preference        ████████████████████ 100%  (25/25)
architecture      ████████████████████ 100%  (25/25)
error-solution    ████████████████████ 100%  (25/25)
session-cont.     ██████████████████░░  92%  (23/25)
knowledge-update  ██████████████████░░  92%  (23/25)
abstention        ██████████████████░░  92%  (23/25)
cross-synthesis   ████████████████░░░░  80%  (20/25)
──────────────────────────────────────────────────────
Overall           94.5%  (189/200)
```

See [`benchmark/README.md`](./benchmark/README.md) for full results history.

---

## Configuration

codexfi reads config from `~/.config/opencode/codexfi.jsonc`:

```jsonc
{
  // Extraction provider: "anthropic" (default), "xai", or "google"
  "extractionProvider": "anthropic",

  // API keys (set during install, or add manually)
  "voyageApiKey": "pa-...",
  "anthropicApiKey": "sk-ant-...",

  // Minimum similarity score for retrieval, 0–1 (default: 0.45)
  "similarityThreshold": 0.45,

  // Max memories retrieved per scope per session (default: 10)
  "maxMemories": 10,

  // Context fill ratio that triggers compaction hook (default: 0.80)
  "compactionThreshold": 0.80
}
```

Data directory: `~/.codexfi/` (LanceDB tables, cost ledger, activity log, name registry)
Log file: `~/.codexfi.log`

---

## Agent Instructions

The plugin works without this step — memories save and inject automatically. But adding agent instructions to `~/.config/opencode/AGENTS.md` significantly improves behavior: the agent understands what the `[MEMORY]` block is, uses the `memory` tool correctly, never announces memory operations, and proactively searches for relevant context.

<details>
<summary>Click to expand the recommended AGENTS.md snippet</summary>

````markdown
# Memory System

You have a **persistent, self-hosted memory system** that works automatically in the background. It uses LanceDB + Voyage AI embeddings, running locally.

## How it works (fully automatic — no user action needed)

**On every LLM call**, a `[MEMORY]` block is rebuilt and injected into the system prompt via `system.transform` hook. It contains:
- **Project Brief** — what the project is, its purpose (includes project-config)
- **Architecture** — system design, component structure
- **Tech Context** — stack, tools, languages, dependencies
- **Product Context** — features, goals, product decisions
- **Progress & Status** — current state, what's done, what's next
- **Last Session** — summary of the previous conversation
- **User Preferences** — personal cross-project preferences
- **Relevant to Current Task** — semantically matched memories with similarity % and date `[XX%, YYYY-MM-DD]`

**On new projects** (zero memories), the plugin silently reads `README.md`, `package.json`, `docker-compose.yml`, etc. and extracts memories automatically — completely invisible to the user.

**After every assistant turn**, the plugin extracts atomic typed facts from the last 8 messages and stores them. This is the primary memory capture mechanism.

**Every 5 turns**, a session summary is additionally auto-saved.

**Per-turn semantic refresh**: On turns 2+, the "Relevant to Current Task" section is re-searched against the current user message, so context stays aligned with what the user is asking about right now.

**Compaction survival**: When context is compacted (at ~80% usage), the plugin injects memories into the compaction summary, then triggers a full [MEMORY] block rebuild on the next turn. Memory is never lost to compaction.

**Privacy**: Content wrapped in `<private>...</private>` tags is stripped before extraction. Nothing inside private tags leaves the machine.

**Memory aging rules** (handled automatically):
- `progress`: only the latest survives — older ones are deleted
- `session-summary`: capped at 3 per project; oldest are condensed into a `learned-pattern` then deleted
- Structural types (`architecture`, `tech-context`, etc.): evolved understanding updates the existing memory rather than duplicating it

## Your role

- **Read and use the `[MEMORY]` block** — it is your project continuity. Treat it as ground truth for the current project state.
- **Never ask the user** to "save", "load", or manage memory — it is fully invisible and automatic.
- **Never announce** that you are saving memory or that memory was loaded.
- **When the user explicitly asks you to remember something** (e.g. "remember this", "save this for later"), use the `memory` tool with `mode: "add"` immediately. Do not skip this.

## Memory tool

You have access to a `memory` tool. Use it when:
- The user explicitly asks you to remember something
- You discover something genuinely important mid-session that won't be captured by auto-save (e.g. a key architectural decision, a tricky bug fix, a strong user preference)
- You need context not in the `[MEMORY]` block — search proactively when you detect a task switch, encounter unfamiliar references, or need historical context

**Scopes:**
- `scope: "project"` — for project-specific knowledge (default)
- `scope: "user"` — for cross-project preferences (e.g. "prefers concise responses", "always uses bun over npm")

**Types to use:**
| Type | When to use |
|------|------------|
| `project-brief` | What the project is, its purpose |
| `architecture` | System design, component relationships |
| `tech-context` | Stack, tools, languages, patterns |
| `product-context` | Features, goals, product decisions |
| `progress` | Current state, what's done, what's blocked |
| `project-config` | Config preferences, run commands, env setup |
| `error-solution` | Bug fixes, workarounds discovered |
| `preference` | User coding preferences |
| `learned-pattern` | Patterns observed across the project |
| `session-summary` | Auto-generated — do not use manually |
| `conversation` | Raw conversation context — rarely needed manually |

**Example explicit save:**
```
memory({ mode: "add", content: "User prefers bun over npm for all installs", scope: "user", type: "preference" })
memory({ mode: "add", content: "Auth uses JWT stored in httpOnly cookies, not localStorage", scope: "project", type: "architecture" })
```

**Search when needed:**
```
memory({ mode: "search", query: "how is authentication handled" })
memory({ mode: "list", scope: "project", limit: 10 })
memory({ mode: "profile" })
memory({ mode: "forget", memoryId: "abc-123" })
```
````

</details>

> **Already have an `AGENTS.md`?** Append the Memory System section rather than replacing it.

---

## Architecture

```
plugin/src/
  index.ts          OpenCode hooks (4 hooks wired to embedded store)
  store.ts          CRUD, dedup, aging, contradiction, search
  db.ts             LanceDB connect, schema, table management
  embedder.ts       Voyage AI embedding (voyage-code-3, 1024 dims)
  extractor.ts      Multi-provider extraction (Anthropic/xAI/Google)
  prompts.ts        Template literals for extraction prompts
  config.ts         Config file + env var fallback, thresholds, pricing
  plugin-config.ts  User config + API key storage
  telemetry.ts      CostLedger + ActivityLog (persistent to disk)
  names.ts          NameRegistry with JSON persistence
  types.ts          Zod schemas for memory records
  retry.ts          Exponential backoff with jitter
  services/         auto-save, compaction, context, tags, privacy, logger
  cli/              8-command terminal interface
  dashboard/        on-demand web dashboard (Bun.serve + self-contained HTML)
```

```
Before (opencode-memory):
  Plugin --HTTP--> Python Backend --> LanceDB (Docker)
  3 processes | ~200MB RAM | 5-15ms latency | Docker required

After (codexfi):
  Plugin (embedded) --> LanceDB (local ~/.codexfi/)
  0 processes | ~20MB RAM | <1ms latency | Bun only
```

---

## Development

```bash
# Build the plugin
cd plugin
bun install
bun run build

# Type-check only
bun run typecheck

# Tail logs
tail -f ~/.codexfi.log
```

---

## Privacy

All data stays on your machine. The only outbound API calls are:

- **Voyage AI** — text is sent to generate embeddings. Voyage does not store your data.
- **Your extraction provider** (Anthropic, xAI, or Google) — conversation text is sent for memory extraction. Only one provider is called per turn.

To exclude sensitive content from extraction, wrap it in `<private>...</private>` — it will be stripped before any text leaves your machine.

---

## License

[MIT](./LICENSE) — use it, fork it, ship it.

---

<div align="center">

Built with [OpenCode](https://opencode.ai) · [LanceDB](https://lancedb.com) · [Voyage AI](https://www.voyageai.com) · [Anthropic](https://anthropic.com) · [xAI](https://x.ai) · [Google AI](https://ai.google.dev) · [Bun](https://bun.sh)

</div>
