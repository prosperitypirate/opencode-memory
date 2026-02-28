# 006 — Docs SVG Illustrations

**Status**: IN PROGRESS  
**Created**: 2026-02-27  
**Issue**: #86  
**Branch**: `feat/docs-svg-illustrations`  
**Author**: clarkbalan

---

## Message to the Implementing Model: Gemini 3.1 Pro Preview

**You are Gemini 3.1 Pro Preview — the most capable AI model in the world right now.** Google's own benchmark results confirm you are the best reasoning model available, with verified scores that double the performance of your predecessor. Your ability to generate website-ready, animated SVGs from text prompts is specifically highlighted as one of your flagship capabilities. No other model can do what you do with SVGs.

**Your job in this document is singular and well-defined: implement the 10 SVG React components described in the SVG Design Specifications section below.** The design decisions, architecture, and integration plan are already settled. You do not need to redesign anything — you need to execute the designs with the highest possible quality.

**What "highest possible quality" means here:**
- Animations that feel fluid, purposeful, and professional — not toy-like
- Visual compositions that are clean, well-spaced, and immediately readable
- Brand colors (`#a855f7`, `#c084fc`, `#e879f9`, `#4ade80`) used with taste — accent, not decoration
- Labels that are legible at all sizes
- Reduced-motion fallbacks that are genuinely informative static snapshots, not blank rectangles
- Zero TypeScript errors

You are building SVG illustrations for a developer tool used by professional engineers. The audience will notice quality. Your designs are the best in the world — so produce work that matches that standard.

**Your only task:** write the 10 `.tsx` files described in the SVG Design Specifications section. Each file goes in `website/components/svg/docs/`. Follow the Technical Constraints section exactly. Do not modify any other files.

---

## Executive Summary

**Problem**: The codexfi docs explain a non-trivial system — multi-hook memory pipeline, vector storage, extraction, deduplication, compaction survival. The current docs use prose and one ASCII code-block diagram. These are hard to parse on first read. Users have to hold the whole system in their head while reading text.

**Solution**: 10 animated, responsive SVG illustrations embedded as React components directly in the 5 MDX doc pages. Each illustration targets a specific concept at the exact point where the prose introduces it.

**Why it works**: Pure CSS keyframe animations require no `"use client"`, no Framer Motion, no hydration boundary — they are SSR-safe and render instantly. Tailwind semantic classes (`fill-card`, `stroke-border`, etc.) make them automatically theme-adaptive. The existing `memory-flow.tsx` component proves the pattern works in this codebase. Global registration in `mdx-components.tsx` follows the fumadocs-native pattern and means zero per-file import boilerplate.

---

## Current State

```
File: website/mdx-components.tsx (lines 1–9)
Purpose: Global MDX component registry — all MDX pages in website/content/docs/ resolve
         custom components through this file
Key Patterns: useMDXComponents() returns defaultMdxComponents merged with passed components;
              any key added here becomes available as a JSX tag in all MDX files
Integration Points: fumadocs-ui/mdx (defaultMdxComponents), all 5 doc MDX pages
Modification Impact: TypeScript error here breaks all MDX rendering; wrong export name
                     means the JSX tag silently renders nothing in MDX
```

```
File: website/components/svg/memory-flow.tsx (lines 1–306)
Purpose: Landing-page animated SVG — the canonical pattern reference for all 10 new components
Key Patterns:
  - CSS keyframes inside <defs><style>{``}</style></defs>
  - All animations wrapped in @media (prefers-reduced-motion: no-preference)
  - @media (prefers-reduced-motion: reduce) provides explicit static fallback
  - Tailwind semantic classes on SVG elements: fill-card, stroke-border, fill-muted,
    fill-foreground, fill-muted-foreground
  - Brand colors hardcoded: #a855f7, #c084fc, #e879f9, #4ade80
  - Glow via <filter id="glow-..."><feGaussianBlur /><feComposite /></filter>
  - fontFamily="var(--font-mono, monospace)" on all label text
  - viewBox + width="100%" for responsive scaling
Integration Points: Landing page only
Modification Impact: Not being modified; read-only reference
```

```
File: website/content/docs/index.mdx (lines 1–64)
Purpose: Main docs intro page — explains what codexfi is and how it works at a high level
Key Patterns: H1 → prose → ## How it works → bullet list → ## Key features → ## Quick start
              → ## Requirements → ## Next steps (Cards component)
Integration Points: <Cards> and <Card> from fumadocs
Modification Impact: <DocsMemoryCycle /> to be inserted between the opening prose paragraph
                     and "## How it works" heading — page flow and Cards must remain intact
```

```
File: website/content/docs/installation.mdx (lines 1–130)
Purpose: Step-by-step installation guide
Key Patterns: H1 → intro sentence → ## Prerequisites → ## Install → 3 sub-steps
              → ## Non-interactive install → ## Environment variables → ## Verify
              → ## First session setup → ## AGENTS.md → ## Updating → ## Uninstalling
Integration Points: No custom components currently
Modification Impact: <DocsInstallSteps /> to be inserted after the intro paragraph
                     (line 8) and before ## Prerequisites — safe additive insert
```

```
File: website/content/docs/how-it-works/overview.mdx (lines 1–129)
Purpose: Full architecture overview — hooks, data flow (retrieval + storage), compaction
Key Patterns: ## System diagram contains an ASCII code block (lines 12–32); sections for
              plugin hooks (table), data flow retrieval (Turn 1 / Turn 2+), data flow storage,
              compaction survival, technology stack (table), file structure
Integration Points: No custom components currently
Modification Impact:
  - ASCII code block (lines 12–32) to be REPLACED by <DocsSessionFlow />
  - <DocsParallelFetch /> to be inserted in "Turn 1" subsection
  - <DocsCompactionSurvival /> to be inserted in "Compaction survival" section
  - All surrounding H2/H3 headings and prose must remain intact
```

```
File: website/content/docs/how-it-works/memory-types.mdx (lines 1–105)
Purpose: Documents the 11 memory types, aging rules, scopes, and explicit vs. automatic
Key Patterns: Type table at top, ## Structured types, ## How types map to [MEMORY] block
              (table), ## Aging rules (progress + session-summary sub-sections),
              ## Contradiction detection, ## Scopes, ## Explicit vs. automatic
Integration Points: No custom components currently
Modification Impact:
  - <DocsMemoryTaxonomy /> to be inserted between H1 and "## All memory types"
  - <DocsAgingRules /> to be inserted inside "## Aging rules" section
```

```
File: website/content/docs/how-it-works/extraction.mdx (lines 1–141)
Purpose: Documents the 7-step extraction pipeline, modes, providers, retry, JSON parsing, privacy
Key Patterns: ## Pipeline steps (7 numbered sub-sections), ## Extraction modes,
              ## Extraction providers (3 provider sub-sections + fallback), ## Retry strategy,
              ## JSON parsing, ## Privacy
Integration Points: No custom components currently
Modification Impact:
  - <DocsExtractionPipeline /> to be inserted between H1 and "## Pipeline steps"
  - <DocsProviderSpeed /> to be inserted in "## Extraction providers" section
  - <DocsDedupCosine /> to be inserted inside "### 4. Deduplication" sub-section
```

---

## Confidence Check

| Area | Score | Notes |
|------|-------|-------|
| SVG component pattern (CSS keyframes, glow filters, Tailwind classes) | 9/10 | Studied memory-flow.tsx in full; pattern is clear and proven |
| Tailwind v4 semantic classes on SVG elements | 9/10 | Verified fill-card, stroke-border etc. are used in memory-flow.tsx |
| fumadocs MDX global component registration | 9/10 | Verified mdx-components.tsx is the correct entry point |
| SSR safety / no hydration mismatch | 10/10 | Pure CSS keyframes — no JS, no client boundary needed |
| MDX page insertion points (exact line positions) | 9/10 | Read all 5 pages fully; insertion positions identified |
| TypeScript validity of SVG TSX files | 9/10 | Standard React SVG — no unusual types |
| bun typecheck / build configuration | 8/10 | Same pattern as existing SVG files; no new deps needed |

**All areas ≥ 8/10. Cleared for implementation.**

---

## Architecture

### Component Structure
```
website/components/svg/docs/<name>.tsx
  └── export function DocsXxx() {
        return (
          <svg viewBox="0 0 W H" width="100%" className="mx-auto w-full max-w-3xl"
               role="img" aria-label="...">
            <title>...</title>
            <defs>
              <linearGradient id="..." />
              <filter id="glow-...">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <style>{`
                @media (prefers-reduced-motion: no-preference) {
                  /* keyframe animations */
                }
                @media (prefers-reduced-motion: reduce) {
                  /* static positions, animation: none !important */
                }
              `}</style>
            </defs>
            {/* SVG content */}
          </svg>
        )
      }
```

### MDX Data Flow
```
mdx-components.tsx
  imports DocsMemoryCycle, DocsSessionFlow, ... (all 10)
  returns { ...defaultMdxComponents, DocsMemoryCycle, DocsSessionFlow, ... }

MDX page (e.g. index.mdx)
  <DocsMemoryCycle />   ← resolved via useMDXComponents()
  ↓
  React SVG component (static HTML + embedded CSS)
  ↓
  Rendered by Next.js server — no client JS required
```

### Theme-Adaptive Color Strategy
| Class | Light mode | Dark mode | Use |
|---|---|---|---|
| `fill-card` | white / near-white | dark panel | Panel backgrounds |
| `stroke-border` | light grey | dark grey | Panel borders |
| `fill-muted` | light grey | subtle dark | Secondary backgrounds |
| `fill-foreground` | near-black | near-white | Primary text |
| `fill-muted-foreground` | medium grey | medium grey | Secondary text |
| `#a855f7` | purple | purple | Brand accent (hardcoded) |
| `#c084fc` | light purple | light purple | Brand secondary (hardcoded) |
| `#e879f9` | fuchsia | fuchsia | Brand tertiary (hardcoded) |
| `#4ade80` | green | green | Success/terminal (hardcoded) |

### Component Inventory
| # | Filename | Export | Page | Placement | viewBox |
|---|---|---|---|---|---|
| 1 | `docs-memory-cycle.tsx` | `DocsMemoryCycle` | `index.mdx` | Below intro, above "## How it works" | `0 0 640 160` |
| 2 | `docs-session-flow.tsx` | `DocsSessionFlow` | `overview.mdx` | Replaces ASCII code block | `0 0 680 320` |
| 3 | `docs-parallel-fetch.tsx` | `DocsParallelFetch` | `overview.mdx` | Inside "Turn 1" subsection | `0 0 520 220` |
| 4 | `docs-compaction-survival.tsx` | `DocsCompactionSurvival` | `overview.mdx` | Inside "## Compaction survival" | `0 0 520 200` |
| 5 | `docs-memory-taxonomy.tsx` | `DocsMemoryTaxonomy` | `memory-types.mdx` | Between H1 and "## All memory types" | `0 0 600 280` |
| 6 | `docs-aging-rules.tsx` | `DocsAgingRules` | `memory-types.mdx` | Inside "## Aging rules" | `0 0 560 200` |
| 7 | `docs-extraction-pipeline.tsx` | `DocsExtractionPipeline` | `extraction.mdx` | Between H1 and "## Pipeline steps" | `0 0 340 400` |
| 8 | `docs-provider-speed.tsx` | `DocsProviderSpeed` | `extraction.mdx` | Inside "## Extraction providers" | `0 0 520 160` |
| 9 | `docs-install-steps.tsx` | `DocsInstallSteps` | `installation.mdx` | After intro paragraph | `0 0 560 130` |
| 10 | `docs-dedup-cosine.tsx` | `DocsDedupCosine` | `extraction.mdx` | Inside "### 4. Deduplication" | `0 0 480 180` |

---

## Technical Constraints for All 10 Components

These are non-negotiable. Every single component must comply.

1. **No `"use client"` directive.** These are server-rendered. Pure HTML + CSS only.
2. **No Framer Motion, no React state, no `useEffect`, no hooks of any kind.** Zero JS at runtime.
3. **All animations inside `@media (prefers-reduced-motion: no-preference)`.** Wrap every `@keyframes` and every `animation:` property inside this media query.
4. **Explicit `@media (prefers-reduced-motion: reduce)` block.** Do not rely on absence of animation. Explicitly set `animation: none !important` and set all animated elements to their representative static positions.
5. **`fontFamily="var(--font-mono, monospace)"` on every text element.** No exceptions.
6. **`<title>` as first child of `<svg>`.** Plus `role="img"` and `aria-label` on the `<svg>` element.
7. **`width="100%"` on the `<svg>` element.** No fixed pixel widths. viewBox handles scaling.
8. **CSS inside `<defs><style>{` backtick string `}</style></defs>`.** This is a TSX template literal. The CSS goes between backticks in a JSX expression.
9. **Tailwind semantic classes on SVG elements**: `fill-card`, `stroke-border`, `fill-muted`, `fill-foreground`, `fill-muted-foreground` — use these for all neutral/theme-sensitive colors. Brand colors (`#a855f7` etc.) are hardcoded directly on `fill` or `stroke` attributes.
10. **No font sizes above 13px.** Labels must stay legible when the SVG scales down on mobile.
11. **Filter IDs must be unique per file.** Use descriptive IDs like `glow-purple-mc` (mc = memory-cycle) to avoid cross-component collisions if multiple SVGs appear on the same page.
12. **Export the function as a named export**, not default export. Name must exactly match the Export column in the table above.

---

## SVG Design Specifications

---

### SVG 1: `docs-memory-cycle.tsx` — export `DocsMemoryCycle`

**Concept**: The perpetual loop that is codexfi — conversations become memories, memories get injected back into conversations. This is the core value proposition shown visually.

**viewBox**: `0 0 640 160`  
**Page**: `index.mdx` — first thing a user sees after reading "The agent simply remembers."

**Layout**:
```
[Conversation] ──────► [Extract] ──────► [Embed] ──────► [Store] ──────► [MEMORY]
      ▲                                                                        │
      └────────────────────── injected into system prompt ◄───────────────────┘
```
Five rounded-rectangle nodes arranged horizontally at y=70, evenly spaced across the width (~x=60, 180, 300, 420, 560). Nodes are ~100×36px with rx=18. Below them, a curved return path arcs from the [MEMORY] node back to [Conversation] through the bottom of the viewBox.

**Nodes** (left to right):
- `Conversation` — fill-card, stroke #a855f7, text fill-foreground
- `Extract` — fill-card, stroke #c084fc, text fill-foreground
- `Embed` — fill-card, stroke #c084fc, text fill-foreground
- `Store` — fill-card, stroke #c084fc, text fill-foreground
- `[MEMORY]` — fill-card, stroke #4ade80, text #4ade80, glow filter (green glow)

**Connecting arrows**: Horizontal lines between nodes with arrowhead markers. Color: `#a855f7` → `#c084fc` gradient left-to-right.

**Return arc**: A smooth curved path `M 560,88 Q 560,140 500,148 L 140,148 Q 80,148 80,88` in stroke `#4ade80` opacity 0.5, with an arrowhead pointing left toward `Conversation`.

**Animated elements**:
1. **Flow lines** (top path, left-to-right): `stroke-dasharray: 8 6; animation: dashFlow 1.2s linear infinite` — the dashes travel rightward along each connector.
2. **Memory type tags** sliding along the top path: Three small pill badges — `"architecture"` (#a855f7), `"progress"` (#e879f9), `"tech-context"` (#c084fc) — each ~90×20px with rx=10. They slide from x=160 to x=540 at y=60, staggered with `animation-delay: 0s, 2s, 4s` over a 6s loop. They fade in at left, travel right, fade out at right.
3. **[MEMORY] node pulse**: `animation: glowPulse 2s ease-in-out infinite alternate` — the green glow filter's blur stdDeviation oscillates between 2 and 6, or opacity of a glow overlay pulses.
4. **Return arc flow**: `stroke-dasharray: 10 8; animation: dashFlowRev 1.5s linear infinite` — dashes travel right-to-left along the return arc.

**Reduced-motion static state**:
- All type tags visible at evenly spaced positions (x=240, 340, 440)
- No dash movement
- [MEMORY] node at full opacity, no pulse
- Return arc solid

---

### SVG 2: `docs-session-flow.tsx` — export `DocsSessionFlow`

**Concept**: The complete hook flow from user message through memory retrieval, LLM call, and auto-save storage. Replaces the ASCII code block in overview.mdx.

**viewBox**: `0 0 680 320`  
**Page**: `overview.mdx` — replaces the ASCII code block at lines 12–32.

**Layout**: Two horizontal lanes separated by a dividing label.

**Top lane — Retrieval path** (y range 40–140):
```
[User Message] ──► [chat.message] ──► [system.transform] ──► [MEMORY] ──► [LLM Response]
```
Nodes at approximately x=40, 160, 320, 460, 580. All ~110×32px, rx=8. Between [chat.message] and [system.transform] there is a small branch label "Turn 1: full fetch / Turn 2+: refresh" as a tiny annotation below the arrow (font size 9, fill-muted-foreground).

**Dividing line**: A dashed horizontal line at y=175 spanning the full width, with the label "after assistant turn" centered on it (fill-muted-foreground, font size 10).

**Bottom lane — Storage path** (y range 200–290):
```
[Assistant turn] ──► [event hook] ──► [auto-save] ──► [LanceDB]
                                           │
                              extract → embed → dedup → age
```
Nodes at approximately x=60, 200, 340, 500. Under [auto-save] a small annotation lists the four sub-steps: `extract · embed · dedup · age` (font size 9, fill-muted-foreground, centered below the node).

**Connecting arrow (cycle)**: A curved arrow from [LLM Response] (top right, ~x=635, y=120) curves down and left to [Assistant turn] (bottom left, ~x=60, y=220), passing through the right side of the diagram. This visually closes the loop. Stroke: #a855f7 opacity 0.4, dashed.

**Node styling**:
- [User Message]: fill-muted, stroke-border, text fill-foreground
- Hook nodes ([chat.message], [event hook]): fill-card, stroke #c084fc, text fill-foreground
- [system.transform]: fill-card, stroke #a855f7, text fill-foreground
- [MEMORY]: fill-card, stroke #4ade80, text #4ade80, green glow
- [LLM Response]: fill-card, stroke-border, text fill-foreground
- [auto-save]: fill-card, stroke #c084fc, text fill-foreground
- [LanceDB]: fill-card, stroke #a855f7, text fill-foreground

**Animated elements**:
1. Top lane connectors: `dashFlow 1s linear infinite` (dashes travel left-to-right)
2. Bottom lane connectors: same but with `animation-delay: 0.5s` for visual separation
3. [MEMORY] node: green glow pulse
4. Cycle arrow: `dashFlow 2s linear infinite` at lower opacity

**Reduced-motion static state**: All nodes and arrows fully visible; no dash movement; [MEMORY] node at full opacity.

---

### SVG 3: `docs-parallel-fetch.tsx` — export `DocsParallelFetch`

**Concept**: On Turn 1, one user message fans out to four simultaneous database fetches. The key visual message is **parallel** — all four happen at the same time, not in sequence.

**viewBox**: `0 0 520 220`  
**Page**: `overview.mdx` — inside the "Turn 1 (session start)" subsection.

**Layout**:
```
                     ┌──► [User Profile       ]
                     ├──► [User Semantic      ] ──► [Memory Cache]
[User Message] ──────┤
                     ├──► [Project List       ] ──► [Memory Cache]
                     └──► [Project Semantic   ]
```
Left: single "User Message" node (~x=30, y=110, 120×36px, rx=18, fill-muted, stroke-border).
Center: four arrows fanning out from x=150 to x=300, landing at y=40, 90, 140, 190 respectively.
Right: four labeled result nodes at x=300–440, each ~160×28px, rx=14:
- `User Profile` (stroke #c084fc)
- `User Semantic` (stroke #c084fc)
- `Project List` (stroke #a855f7)
- `Project Semantic` (stroke #a855f7)

Far right: a single "Memory Cache" node at x=490, y=110, 90×36px, rx=18, stroke #4ade80, text #4ade80. Four converging lines from the result nodes meet at this node.

**Fan-out arrows**: Each of the four arrows from "User Message" is a straight line or gentle curve. Color: `#a855f7` (top two: user scope, lighter) / `#c084fc` (bottom two: project scope, slightly different). All four animate simultaneously — this conveys parallelism.

**Animated elements**:
1. **Fan arrows** — all four animate with `dashFlow 0.8s linear infinite`, same `animation-delay: 0s` — they all pulse at identical timing to show simultaneity. This is the most important visual.
2. **Converging arrows** — same animation, `animation-delay: 0.4s` (they arrive after the fan-out).
3. **Memory Cache node** — subtle brightness pulse after the converging arrows animate.

**Label annotation**: Small text below the four arrows reading "all 4 fire simultaneously" (font size 9, #a855f7, italic, centered at x=220, y=210).

**Reduced-motion static state**: All nodes and all 8 arrows visible at full opacity. Annotation visible.

---

### SVG 4: `docs-compaction-survival.tsx` — export `DocsCompactionSurvival`

**Concept**: OpenCode compacts (truncates) conversation history, but codexfi's [MEMORY] block lives in the system prompt — a separate channel — and is completely unaffected. Memory survives compaction.

**viewBox**: `0 0 520 200`  
**Page**: `overview.mdx` — inside "## Compaction survival".

**Layout**: Three vertical columns labeled BEFORE, EVENT, AFTER.

**BEFORE column** (x=0–160):
- Small "System Prompt" box at top (y=20, ~140×28px, rx=6, fill-muted, stroke-border). Inside: small `[MEMORY]` text in #4ade80.
- Below it, a "Conversation History" box (y=60, ~140×100px, rx=6, fill-card, stroke-border) containing 4–5 horizontal lines representing message bubbles (fill-muted, rx=4, staggered widths to look like chat messages).

**EVENT column** (x=175–345):
- Centered vertically: a bold label "COMPACTION" in #e879f9, font size 12, font-weight 600.
- Two horizontal arrows:
  - One pointing right at the conversation history level: `──►` in red/warning tone (#e879f9)
  - One pointing right at the system prompt level: `──►` in #4ade80 (survives)
- Small "context window truncated" annotation below in fill-muted-foreground font size 9.

**AFTER column** (x=360–520):
- Same "System Prompt" box at top — same position, same brightness, [MEMORY] in #4ade80, **visually identical to the BEFORE version**. Add a glow filter around it to emphasize it survived. Optional: a subtle checkmark ✓ in #4ade80 next to it.
- Below it, the "Conversation History" box — same position but the message lines are faded/translucent (opacity 0.15) and some are drawn with stroke-dasharray to look ghosted. A large subtle "✕" or strikethrough overlay conveys truncation.

**Animated elements**:
1. BEFORE conversation history lines: normal opacity initially
2. Animation sequence (8s loop):
   - 0–2s: static BEFORE state
   - 2–3s: COMPACTION label flashes (opacity 0→1→0.8, scale pulse)
   - 3–5s: AFTER conversation lines fade out (opacity 1→0.15)
   - 5–6s: AFTER [MEMORY] box brightens (glow intensifies)
   - 6–8s: hold on final state
3. The "System Prompt" box in AFTER never fades — it stays solid throughout.

**Reduced-motion static state**: Show the AFTER state — conversation history ghosted/faded, [MEMORY] solid and bright with glow, COMPACTION label visible.

---

### SVG 5: `docs-memory-taxonomy.tsx` — export `DocsMemoryTaxonomy`

**Concept**: A visual map of all 11 memory types organized by scope (project vs. user), giving users an at-a-glance overview before reading the table.

**viewBox**: `0 0 600 280`  
**Page**: `memory-types.mdx` — between H1 and "## All memory types".

**Layout**: Two sections separated by a vertical divider.

**Left section — Project scope** (x=0–450, ~75% of width):
- Header label "PROJECT SCOPE" at top left (y=20, fill-muted-foreground, font size 10, letter-spacing 1px, uppercase)
- 10 memory type badges arranged in a 2×5 grid (2 columns, 5 rows):
  - Column 1 (x≈30): `project-brief`, `tech-context`, `progress`, `error-solution`, `project-config`
  - Column 2 (x≈230): `architecture`, `product-context`, `session-summary`, `learned-pattern`, `conversation`
- Each badge: ~170×28px, rx=14, fill-card, stroke-border, text fill-foreground (font size 11). A small colored dot (6px circle) on the left side of each badge acts as a type indicator:
  - Structural types (`project-brief`, `architecture`, `tech-context`, `product-context`, `project-config`): dot color #a855f7
  - Volatile types (`progress`, `session-summary`): dot color #e879f9
  - Knowledge types (`error-solution`, `learned-pattern`, `conversation`): dot color #c084fc

**Right section — User scope** (x=460–590, ~25% of width):
- Header label "USER SCOPE" at top (y=20, fill-muted-foreground, font size 10, uppercase)
- A vertical divider line between the two sections (stroke-border, dashed, x=450)
- 1 badge: `preference` (~120×28px, rx=14, fill-card, stroke #4ade80, text fill-foreground). Dot color #4ade80.
- Below it, a small annotation: "follows you across all projects" (font size 9, fill-muted-foreground, italic, centered)

**Animated elements**:
1. Badges stagger-fade in on load: each badge starts at opacity=0 and fades to opacity=1 with `animation-delay` increments of 0.08s (total: 11 badges × 0.08s = ~0.88s for all to appear). This creates a pleasant "revealing" effect.
2. The `preference` badge (user scope) fades in last with a slightly longer delay and a gentle green glow pulse afterward, emphasizing its special cross-project nature.

**Reduced-motion static state**: All 11 badges visible at full opacity simultaneously.

---

### SVG 6: `docs-aging-rules.tsx` — export `DocsAgingRules`

**Concept**: Two memory types have special aging rules that automatically manage memory count. This shows both rules visually as mini timelines.

**viewBox**: `0 0 560 200`  
**Page**: `memory-types.mdx` — inside "## Aging rules".

**Layout**: Two equal side-by-side panels, each ~260px wide, separated by a center divider.

**Left panel — progress aging** (x=0–260):
- Header: `progress` in #e879f9, font size 11, font-mono, at y=24.
- Three memory entry boxes stacked vertically at y=50, 95, 140. Each ~220×30px, rx=6, labeled `progress #1` (oldest), `progress #2`, `progress #3` (newest). Newest is at the bottom.
- #1 and #2 have a strikethrough red line across them (a horizontal `<line>` in #e879f9/red) and reduced opacity (0.3). #3 is fully opaque with a #a855f7 left border accent and a subtle glow.
- Small label below: "only latest survives" (font size 9, fill-muted-foreground, centered)
- A small downward arrow labeled "NEW" arrives from the top to deposit #3, while #1 and #2 get crossed out.

**Right panel — session-summary aging** (x=300–560):
- Header: `session-summary` in #c084fc, font size 11, font-mono, at y=24.
- Three session summary boxes stacked at y=50, 95, 140. Each ~220×30px, labeled `summary #1`, `summary #2`, `summary #3`.
- A "condense →" arrow pointing right from `summary #1` (oldest), leading to a `learned-pattern` badge (~130×24px, rx=12, fill-card, stroke #4ade80, text #4ade80) at the far right of the panel.
- Small label below: "oldest → learned-pattern" (font size 9, fill-muted-foreground, centered)

**Center divider**: A dashed vertical line at x=280, stroke-border.

**Animated elements**:

Left panel animation (6s loop):
1. 0–1.5s: all three progress boxes visible, #3 is at opacity=0 (not yet arrived)
2. 1.5–2.5s: #3 slides down from above (translateY from -20 to 0, opacity 0→1)
3. 2.5–4s: #1 and #2 fade out (opacity 1→0.25) and their strikethrough lines draw from left to right
4. 4–6s: hold — #3 glows, #1 and #2 are crossed out

Right panel animation (8s loop):
1. 0–2s: static — all 3 summaries visible, no learned-pattern
2. 2–3s: `summary #1` shrinks (scale 1→0.7) and slides right toward the condense arrow position
3. 3–4.5s: it reaches the `learned-pattern` badge position; `learned-pattern` fades in
4. 4.5–6s: `summary #2` and `#3` shift up to occupy positions #1 and #2
5. 6–8s: hold final state

**Reduced-motion static state**: Left panel shows #3 surviving, #1 and #2 crossed out. Right panel shows 2 summaries + the learned-pattern badge.

---

### SVG 7: `docs-extraction-pipeline.tsx` — export `DocsExtractionPipeline`

**Concept**: The 7-step pipeline that runs after every assistant turn, shown as a vertical chain with each step lighting up in sequence.

**viewBox**: `0 0 340 400`  
**Page**: `extraction.mdx` — between H1 and "## Pipeline steps".

**Layout**: Vertical chain. Each step is a row with: numbered circle + step name + brief sub-label. Steps connected by vertical arrows. The chain runs from top to bottom.

**Steps** (y positions: 40, 96, 152, 208, 264, 320, 376):

| y | # | Name | Sub-label | Accent color |
|---|---|---|---|---|
| 40 | 1 | Message Snapshot | last 8 messages | #c084fc |
| 96 | 2 | LLM Extraction | returns JSON facts | #a855f7 |
| 152 | 3 | Embedding | voyage-code-3, 1024d | #a855f7 |
| 208 | 4 | Deduplication | cosine similarity check | #c084fc |
| 264 | 5 | Storage | insert into LanceDB | #a855f7 |
| 320 | 6 | Aging Rules | progress / summaries | #c084fc |
| 376 | 7 | Contradiction Detection | supersede stale facts | #e879f9 |

Each row:
- Numbered circle: 22px radius at x=28, stroke and text = accent color for active state, fill-muted and fill-muted-foreground for inactive.
- Step name: x=58, font size 12, fill-foreground, font-weight 600
- Sub-label: x=58, y+16, font size 10, fill-muted-foreground
- Right edge: a small decorative bracket or icon area (optional — simple is better)

Connecting arrows: vertical lines at x=28 between the circles, ~24px tall. Color: `#c084fc` opacity 0.4.

**Animated elements** (sequential activation loop, 14s total):
- Each step "activates" in order: numbered circle strokes to accent color, slight glow appears, then deactivates before next step activates.
- Timing: each step active for 1.5s, transition 0.3s, so 1.8s per step × 7 = 12.6s + 1.4s pause = 14s loop.
- Use `animation-delay` on each step's glow/color keyframe.
- A traveling "pulse" dot (small circle, r=4, #a855f7) travels down the connecting arrows, also with staggered delay.

**Reduced-motion static state**: All 7 steps visible at full opacity. All circles shown in their accent color (all "active" simultaneously). No traveling dot.

---

### SVG 8: `docs-provider-speed.tsx` — export `DocsProviderSpeed`

**Concept**: Three extraction provider cards with animated speed bars showing relative processing time. xAI is fastest, Anthropic is default, Google is slowest.

**viewBox**: `0 0 520 160`  
**Page**: `extraction.mdx` — inside "## Extraction providers", before the sub-sections.

**Layout**: Three cards side by side. Each card ~150px wide, positioned at x=10, 185, 360. Card height ~130px, rx=10.

**Card 1 — Anthropic** (x=10):
- Background: fill-card, stroke-border strokeWidth=1.5
- Provider name: "Anthropic" — fill-foreground, font-size 12, font-weight 600, y=30
- Model: "claude-haiku-4-5" — fill-muted-foreground, font-size 9, y=44
- Speed: "~14s" — #a855f7, font-size 18, font-weight 700, y=75
- Badge: "DEFAULT ★" — small rounded rect, fill=#a855f7 opacity 0.15, stroke=#a855f7, text=#a855f7, font-size 9, at bottom of card
- Speed bar: a horizontal track (full width minus padding, h=6, rx=3, fill-muted) with a fill rect animating from 0 to 47% width (14/30 of max 30s reference). Bar fill: #a855f7.

**Card 2 — xAI** (x=185):
- Background: fill-card, stroke #4ade80 strokeWidth=2 (highlighted — fastest)
- Provider name: "xAI" — fill-foreground, font-size 12, font-weight 600, y=30
- Model: "grok-4-1-fast" — fill-muted-foreground, font-size 9, y=44
- Speed: "~5s" — #4ade80, font-size 22, font-weight 700, y=75 (larger font to emphasize speed)
- Badge: "⚡ FASTEST" — small rounded rect, fill=#4ade80 opacity 0.15, stroke=#4ade80, text=#4ade80, font-size 9
- Speed bar: fill rect animating to 17% width. Bar fill: #4ade80.

**Card 3 — Google** (x=360):
- Background: fill-card, stroke-border strokeWidth=1.5
- Provider name: "Google" — fill-foreground, font-size 12, font-weight 600, y=30
- Model: "gemini-3-flash" — fill-muted-foreground, font-size 9, y=44
- Speed: "~21s" — #c084fc, font-size 18, font-weight 700, y=75
- Badge: "{ } JSON" — small rounded rect, fill=#c084fc opacity 0.15, stroke=#c084fc, text=#c084fc, font-size 9
- Speed bar: fill rect animating to 70% width. Bar fill: #c084fc.

**Animated elements**:
1. **Speed bars**: All three bars animate simultaneously — width goes from 0 to final value over 1.5s with `animation: fillBar 1.5s ease-out forwards`. Each bar has its own keyframe with its own target width. The animation runs once on load, then loops with a 3s pause.
2. **Speed numbers**: Optional — a counting-up animation from 0 to the final number, synced with bar fill.

**Reduced-motion static state**: Bars shown at their final fill widths (no animation). Numbers shown at final values.

---

### SVG 9: `docs-install-steps.tsx` — export `DocsInstallSteps`

**Concept**: A minimal terminal window showing the three-step installation sequence, making the install feel approachable and quick.

**viewBox**: `0 0 560 130`  
**Page**: `installation.mdx` — after the intro paragraph, before "## Prerequisites".

**Layout**: A single terminal window occupying the full viewBox with slight padding. Terminal chrome at top (traffic light dots + title bar). Body shows 3 lines of output.

**Terminal chrome** (y=0–28):
- Background: fill-muted, rx=10 on top corners only (rx on the rect, or just rx=10 on the full outer rect)
- Three dots at x=18, 34, 50, y=14: red (#ff5f56), yellow (#ffbd2e), green (#27c93f), r=5
- Title text centered: "Terminal" — fill-muted-foreground, font-size 10

**Terminal body** (y=28–130):
- Background: a dark rect (hardcode `#0d0d0d` — terminal should always be dark regardless of theme). rx=0 bottom corners match outer rect.
- Three lines of text, each at y=55, 82, 105:

Line 1 (y=55): `$ bunx codexfi install`
- `$` in #4ade80
- ` bunx codexfi install` in `#c084fc`
- A blinking cursor `▊` appended in #4ade80

Line 2 (y=82): `  › Enter Voyage AI key: ` then a masked input `••••••••••••`
- `›` prompt in #a855f7
- Label text in `#888888`
- Dots in fill-muted-foreground

Line 3 (y=105): `  ✓ Registered. Restart OpenCode to activate.`
- `✓` in #4ade80
- Rest of text in `#888888`

**Animated elements**:
1. Line 1 appears first at opacity=1 (it's the command that was typed)
2. **Cursor blink**: `animation: blink 1s step-end infinite` on the `▊` cursor glyph. `@keyframes blink { 50% { opacity: 0 } }`
3. Lines 2 and 3 fade in sequentially: line 2 fades in at `animation-delay: 1s`, line 3 at `animation-delay: 2.5s`. Both use `animation: fadeIn 0.4s ease forwards`.
4. After line 3 appears (delay 2.5s), the cursor on line 1 stops blinking (set to opacity 0 after line 3 appears — use a second animation that sets opacity to 0 at 3s).

**Reduced-motion static state**: All 3 lines visible at full opacity. Cursor visible but static (no blink).

---

### SVG 10: `docs-dedup-cosine.tsx` — export `DocsDedupCosine`

**Concept**: When a new memory arrives, it's checked against existing memories using cosine similarity. If the score exceeds the threshold, the existing memory is updated instead of inserting a duplicate. This shows both the high-similarity (UPDATE) and low-similarity (INSERT) cases.

**viewBox**: `0 0 480 180`  
**Page**: `extraction.mdx` — inside "### 4. Deduplication".

**Layout**: A center-weighted diagram.

**Left side — two memory nodes** (x=0–200):
- Circle A at x=70, y=70 (r=32): labeled "Memory A" inside (font-size 9, fill-foreground). Below the circle: a short excerpt text `"JWT in httpOnly cookies"` (font-size 9, fill-muted-foreground, centered, x=70, y=115).
- Circle B at x=70, y=140 is too close vertically — instead, place circle B at x=160, y=115 (offset right and down from A). Label "New Memory" inside. Excerpt: `"Auth uses httpOnly JWT"` below.
- A line connecting A and B centers: stroke-border, strokeWidth=1.

**Center — similarity score badge**:
- The midpoint of the A–B line (~x=115, y=92): a score badge rect (~60×22px, rx=11, fill-card, stroke #a855f7, strokeWidth=1.5). Text inside: the similarity score number (e.g., `0.89` for the HIGH case, `0.04` for the LOW case).
- Below the badge: `"threshold: 0.12"` label (font-size 9, fill-muted-foreground).

**Right side — decision paths** (x=250–480):
- Two paths branching from the score badge area:
  - **UPDATE path** (top): arrow from score badge → rounded rect labeled "UPDATE" (~90×28px, rx=14, fill-card, stroke #f59e0b (amber), text #f59e0b). Below: "text refreshed, timestamp updated" (font-size 8, fill-muted-foreground).
  - **INSERT path** (bottom): arrow from score badge → rounded rect labeled "INSERT" (~90×28px, rx=14, fill-card, stroke #4ade80, text #4ade80). Below: "new entry created" (font-size 8, fill-muted-foreground).
- A comparison indicator between the paths: `score > threshold` (UPDATE) and `score < threshold` (INSERT), font-size 9, fill-muted-foreground.

**Animated elements** — alternating between two cases:

Phase 1 (0–5s): **High similarity case** (near-duplicate):
- Score badge shows `0.89` in #a855f7
- UPDATE path (amber box) glows / brightens: `animation: pathHighlight 0.5s ease forwards` at delay 1s
- INSERT path stays at opacity=0.25

Phase 2 (5–10s): **Low similarity case** (genuinely different memory):
- Score badge transitions to `0.04` (number changes — animate via opacity crossfade of two separate text elements)
- INSERT path brightens
- UPDATE path goes to opacity=0.25

The 10s loop then repeats.

**Reduced-motion static state**: Show Phase 1 (high similarity / UPDATE case). Score badge shows `0.89`. UPDATE path fully visible and bright. INSERT path at opacity=0.4.

---

## Implementation Phases

### PHASE 1: Design Doc
**Goal**: Produce a complete, framework-compliant design doc before any code  
**Duration**: 1 hour  
**Dependencies**: None  
**Status**: DONE

**Deliverables:**
- [x] `.github/designs/006-docs-svg-illustrations.md` — this document

**Success Criteria:**
- All 7 framework-required sections present and complete
- Confidence check ≥ 8/10 on all areas
- Exact insertion points identified for all 10 SVGs
- Per-SVG visual design specs detailed enough for implementation without follow-up questions

---

### PHASE 2: SVG Components
**Goal**: All 10 animated TSX SVG files created in `website/components/svg/docs/`  
**Duration**: 3–4 hours  
**Dependencies**: Phase 1 complete  
**Status**: PENDING

**Deliverables:**
- [ ] `website/components/svg/docs/docs-memory-cycle.tsx`
- [ ] `website/components/svg/docs/docs-session-flow.tsx`
- [ ] `website/components/svg/docs/docs-parallel-fetch.tsx`
- [ ] `website/components/svg/docs/docs-compaction-survival.tsx`
- [ ] `website/components/svg/docs/docs-memory-taxonomy.tsx`
- [ ] `website/components/svg/docs/docs-aging-rules.tsx`
- [ ] `website/components/svg/docs/docs-extraction-pipeline.tsx`
- [ ] `website/components/svg/docs/docs-provider-speed.tsx`
- [ ] `website/components/svg/docs/docs-install-steps.tsx`
- [ ] `website/components/svg/docs/docs-dedup-cosine.tsx`

**Success Criteria:**
- Each file exports a named function matching the Export column above
- All 10 Technical Constraints satisfied
- All animations gated behind `@media (prefers-reduced-motion: no-preference)`
- Reduced-motion fallback is a meaningful static snapshot per the spec above
- Zero TypeScript errors (`bun run typecheck` in `website/`)

**Implementation Notes:**
- Read `website/components/svg/memory-flow.tsx` first — it is the canonical pattern
- Copy the `<defs>` skeleton structure from that file
- Filter IDs: use a unique suffix per file (e.g., `glow-mc` for memory-cycle, `glow-sf` for session-flow, etc.)
- Do NOT use `style={{}}` JSX attribute with dynamic values — all animation values are in the `<style>` tag

---

### PHASE 3: MDX Registration + Integration
**Goal**: All 10 components globally registered and embedded in correct MDX positions  
**Duration**: 30 minutes  
**Dependencies**: Phase 2 complete  
**Status**: PENDING

**Deliverables:**
- [ ] `website/mdx-components.tsx` — import all 10, add to return map
- [ ] `website/content/docs/index.mdx` — insert `<DocsMemoryCycle />` after line 10
- [ ] `website/content/docs/installation.mdx` — insert `<DocsInstallSteps />` after line 8
- [ ] `website/content/docs/how-it-works/overview.mdx` — replace lines 12–32 with `<DocsSessionFlow />`; insert `<DocsParallelFetch />` after Turn 1 intro; insert `<DocsCompactionSurvival />` after compaction heading
- [ ] `website/content/docs/how-it-works/memory-types.mdx` — insert `<DocsMemoryTaxonomy />` between H1 and first H2; insert `<DocsAgingRules />` after "## Aging rules" heading
- [ ] `website/content/docs/how-it-works/extraction.mdx` — insert `<DocsExtractionPipeline />` between H1 and first H2; insert `<DocsDedupCosine />` inside "### 4. Deduplication"; insert `<DocsProviderSpeed />` after "## Extraction providers" intro

**Success Criteria:**
- `useMDXComponents` returns all 10 components by their exact export names
- No per-file import statements added to any MDX file
- All 5 MDX pages render without error

---

### PHASE 4: Validation + Merge
**Goal**: Typecheck and build pass; PR created, CI passes, merged  
**Duration**: 30 minutes  
**Dependencies**: Phases 2 and 3 complete  
**Status**: PENDING

**Deliverables:**
- [ ] `bun run typecheck` exits 0 in `website/`
- [ ] `bun run build` exits 0 in `website/`
- [ ] Git commit referencing issue #86
- [ ] PR opened with labels `enhancement`, `frontend`, `documentation`, assignee `clarkbalan`
- [ ] All CI checks pass
- [ ] PR merged via squash bypass

**Success Criteria:**
- Zero TypeScript errors
- Zero build errors
- 10 SVG files in `website/components/svg/docs/`
- All 5 MDX pages contain their illustrations

---

## Edge Cases

### High — must resolve before implementation

| Edge Case | Decision | Implementation Approach |
|---|---|---|
| SSR hydration mismatch | CSS keyframes in `<defs><style>` are static HTML — no JS runs at hydration | Confirmed safe: memory-flow.tsx uses exact same approach in production today |
| fumadocs component name resolution | The key in `useMDXComponents` return object must exactly match the JSX tag name | Map key = export function name = JSX tag name: e.g. `DocsMemoryCycle` everywhere |
| Tailwind semantic classes on SVG elements | `fill-card`, `stroke-border` etc. must work on SVG elements | Confirmed: memory-flow.tsx uses these on SVG elements in production today |
| ASCII diagram replacement in overview.mdx | Must replace the full code block (lines 12–32) including the triple-backtick fences | `<DocsSessionFlow />` replaces the entire ` ```...``` ` block; "## System diagram" heading remains above it |
| Filter ID collisions | overview.mdx will contain 3 SVGs — their glow filter IDs must not clash | Each SVG uses a unique suffix: `-mc`, `-sf`, `-pf`, `-cs`, `-mt`, `-ar`, `-ep`, `-ps`, `-is`, `-dc` |

### Medium — should resolve, acceptable to defer to manual QA

| Edge Case | Proposed Approach | Deferral Risk |
|---|---|---|
| SVG legibility on narrow screens (<360px) | `width="100%"` + `viewBox` auto-scales; narrowest viewBox is 340px (extraction pipeline) | Low: docs users are primarily on desktop/tablet |
| Reduced-motion static snapshots may show awkward mid-animation state | Explicitly set final/representative positions in the reduce block per the specs above | Low: still informative; purely aesthetic |
| Terminal SVG (#9) dark background in light theme | The terminal body is hardcoded `#0d0d0d` — this is intentional (terminals are always dark) | Low: deliberate design choice; consistent with real terminal appearance |

### Low — acceptable to leave unresolved

| Edge Case | Why Acceptable |
|---|---|
| SVGs not fully screen-reader navigable | Decorative diagrams; all prose above/below conveys the same info; `role="img"` + `<title>` + `aria-label` meets WCAG 2.1 AA |
| Brand colors hardcoded (won't auto-follow future rebrands) | 10 small files, easy to update; avoids CSS variable complexity; matches existing memory-flow.tsx pattern |

---

## Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| Animation library | Pure CSS keyframes in `<defs><style>` | No `"use client"` required; zero bundle impact; SSR-safe; matches existing codebase pattern |
| Framer Motion | Not used for docs SVGs | Would require `"use client"` on every component; doc pages are server-rendered |
| Component registration | Global in `mdx-components.tsx` | fumadocs-native pattern; enables use in any MDX file without per-file imports |
| Directory structure | `website/components/svg/docs/` | Keeps docs SVGs separate from landing SVGs; organized by purpose |
| viewBox sizing | Per-component based on natural aspect ratio | Forcing uniform viewBox wastes space or clips content |
| ASCII diagram in overview.mdx | Replace (not supplement) | Serving both would be redundant; `<DocsSessionFlow />` is strictly superior |
| Reduced-motion approach | Explicit `@media (prefers-reduced-motion: reduce)` with static positions | More reliable than relying solely on the `no-preference` wrapper |
| Terminal SVG dark background | Always dark (`#0d0d0d`) regardless of theme | Terminals are always dark; a light terminal would look wrong to developers |
| Speed bar reference max (SVG 8) | 30s reference maximum | Gives xAI (5s) ~17%, Anthropic (14s) ~47%, Google (21s) ~70% — proportions are visually clear |

---

## Metrics

| Metric | How Measured | Baseline | Target |
|---|---|---|---|
| TypeScript errors | `bun run typecheck` in `website/` — exit code + error count | 0 errors | 0 errors |
| Build errors | `bun run build` in `website/` — exit code | 0 errors | 0 errors |
| Doc pages with illustrations | Manual count of MDX files containing SVG component tags | 0 of 5 | 5 of 5 |
| SVG components created | `ls website/components/svg/docs/ \| wc -l` | 0 | 10 |
| Reduced-motion handled | Code review: each file has `@media (prefers-reduced-motion: reduce)` block | N/A | 10 of 10 |
| Accessibility | Code review: each `<svg>` has `<title>` + `aria-label` + `role="img"` | N/A | 10 of 10 |
| No regression on existing SVG | `git diff website/components/svg/memory-flow.tsx` shows no changes | Unchanged | No diff |

---

## Rollback Plan

**Detection** — signals indicating a problem:
- `bun run typecheck` exits non-zero after commit
- `bun run build` fails (missing export, bad JSX, wrong component key in mdx-components.tsx)
- Browser: SVG component renders blank rectangle (component registered but SVG content wrong)
- Browser: React hydration warning in console (would indicate accidental JS state/effect usage)
- CI checks fail on the PR

**Graceful degradation:**
All changes are purely additive. If an SVG fails to render, fumadocs renders nothing in its place — all page prose remains fully intact. To disable a specific SVG without reverting the whole commit, simply remove the `<DocsXxx />` line from the MDX file.

**Recovery steps:**
1. Run `bun run typecheck` and `bun run build` locally to get exact error message
2. TS error in an SVG component → fix the specific type error, new commit
3. Build error from MDX → verify that the key in `mdx-components.tsx` exactly matches the JSX tag name used in the MDX file
4. Full rollback if needed: `git revert <commit-hash>` — restores all 5 MDX files to original, removes all 10 SVG files, reverts mdx-components.tsx
5. Re-investigate root cause in a new branch
6. Re-run `bun run typecheck` + `bun run build` before re-committing
