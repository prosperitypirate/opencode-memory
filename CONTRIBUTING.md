# Contributing to opencode-memory

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/opencode-memory
cd opencode-memory

# 2. Switch to the active development branch
git checkout feat/issue-53-plugin-embedded-rewrite

# 3. Install dependencies
cd plugin-v2
bun install

# 4. Build
bun run build

# 5. Type check
bun run typecheck
```

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| [Bun](https://bun.sh) | ≥1.2.19 | `curl -fsSL https://bun.sh/install \| bash` |
| [OpenCode](https://opencode.ai) | Latest | `npm i -g opencode-ai` |
| Git | ≥2.30 | System package manager |

### API Keys (for testing)

You need API keys to run the plugin end-to-end:

- **Voyage AI** (embeddings) — free tier at [voyageai.com](https://www.voyageai.com/)
- **Extraction provider** (pick one):
  - Anthropic — [console.anthropic.com](https://console.anthropic.com)
  - xAI — [console.x.ai](https://console.x.ai)
  - Google — [aistudio.google.com](https://aistudio.google.com/apikey)

Set them as environment variables:

```bash
export VOYAGE_API_KEY=pa-...
export ANTHROPIC_API_KEY=sk-ant-...  # or XAI_API_KEY / GOOGLE_API_KEY
```

## Project Structure

The active codebase lives in `plugin-v2/` (the embedded LanceDB rewrite):

```
plugin-v2/
├── src/
│   ├── index.ts          — main plugin hooks (the entry point)
│   ├── store.ts          — CRUD, dedup, aging, search (the core)
│   ├── extractor.ts      — multi-provider LLM extraction
│   ├── embedder.ts       — Voyage AI embeddings
│   ├── db.ts             — LanceDB connection management
│   ├── config.ts         — constants, thresholds, pricing
│   ├── prompts.ts        — LLM prompt templates
│   ├── telemetry.ts      — cost tracking + activity log
│   ├── plugin-config.ts  — user-facing config (~/.config/opencode/memory.jsonc)
│   ├── cli/              — terminal CLI commands
│   ├── dashboard/        — on-demand web dashboard
│   └── services/         — auto-save, compaction, context formatting, privacy
├── package.json
└── tsconfig.json

testing/                   — unit + integration test suite
benchmark/                 — DevMemBench evaluation framework
.github/designs/           — design documents for major features
```

> **Note:** `backend/`, `frontend/`, and `plugin/` are the legacy Docker-based architecture. All new work targets `plugin-v2/`.

## Development Workflow

### Branch naming

```
feat/short-description     — new features
fix/short-description      — bug fixes
docs/short-description     — documentation
chore/short-description    — maintenance, CI, tooling
```

### Making changes

1. Create a branch from `feat/issue-53-plugin-embedded-rewrite` (the active dev branch)
2. Make your changes in `plugin-v2/`
3. Run checks:
   ```bash
   cd plugin-v2
   bun run typecheck        # must pass
   bun run build            # must succeed
   ```
4. Run tests:
   ```bash
   cd testing
   bun install
   bun test src/unit/       # unit tests (no API keys needed)
   bun test src/integration/ # integration tests (needs API keys)
   ```
5. Commit with a conventional commit message
6. Open a PR against `feat/issue-53-plugin-embedded-rewrite`

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(store): add batch embedding for dedup checks
fix(extractor): handle empty JSON response from Gemini
docs(readme): add troubleshooting section
chore(ci): add npm publish workflow
test(store): add aging integration test
```

### Code style

- **TypeScript** with strict mode
- **Tabs** for indentation (match existing code)
- **No semicolons** at end of lines... just kidding, semicolons required
- **Explicit types** on function signatures
- **JSDoc comments** on exported functions
- Keep files focused — one concern per module

## Testing

### Unit tests (no external deps)

```bash
cd testing && bun test src/unit/
```

Unit tests cover: config parsing, retry logic, name registry, telemetry calculations.

### Integration tests (need API keys + LanceDB)

```bash
cd testing && bun test src/integration/
```

Integration tests cover: LanceDB operations, store CRUD, embedding generation.

### E2E smoke test

```bash
cd plugin-v2 && bun run smoke:e2e
```

Runs a full pipeline: embed → store → search → extract → verify.

## Areas Where Help Is Needed

Check [open issues](https://github.com/prosperitypirate/opencode-memory/issues) for current priorities. High-impact areas:

- **Test coverage** — more unit tests for `services/` modules (auto-save, compaction, context)
- **Documentation** — usage guides, troubleshooting, video walkthroughs
- **Dashboard** — the embedded dashboard (`src/dashboard/`) is minimal; UI improvements welcome
- **Performance** — benchmarking embedding batch sizes, LanceDB query optimization
- **New extraction providers** — adding support for additional LLM providers
- **Editor integrations** — the memory API is generic; VS Code / Cursor / Zed plugins are possible

## Design Documents

Major features start with a design document in `.github/designs/`. If you're proposing a significant change:

1. Read the [Feature Design Framework](.github/designs/FEATURE-DESIGN-FRAMEWORK.md)
2. Write a design doc following the template
3. Open a PR with just the design doc for review
4. Implementation follows after design approval

## Questions?

Open a [discussion](https://github.com/prosperitypirate/opencode-memory/issues) or comment on the relevant issue. We're friendly!

---

<div align="center">
Built by contributors like you 🏴‍☠️
</div>
