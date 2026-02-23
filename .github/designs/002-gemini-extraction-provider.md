# Gemini 3 Flash Extraction Provider — Design Document

**Feature**: Configurable multi-provider extraction with Gemini 3 Flash support  
**Issue**: #45 (extraction quality: add Gemini 3 Flash as configurable extraction model)  
**Branch**: `feat/gemini-extraction-provider`  
**Status**: IN PROGRESS  
**Created**: February 22, 2026  
**Estimated Duration**: 2-3 hours across 3 phases  

---

## EXECUTIVE SUMMARY

### The Problem

The benchmark shows 16pp score variance (78.5%–94.5%) across runs with identical code. The root cause is extraction nondeterminism — Grok 4.1 Fast produces completely different memory sets each run (~2% text overlap between runs). The extraction model is the single highest-leverage component for memory quality, and the current architecture is hardwired to a single provider (xAI).

### The Solution

Add Gemini 3 Flash as a second extraction provider behind a simple `EXTRACTION_PROVIDER` env var toggle. All LLM calls route through a new `call_llm()` dispatcher that delegates to provider-specific functions. Gemini uses the OpenAI-compatible chat completions endpoint, so the request format is nearly identical to xAI — different base URL, API key, and model name.

### Why This Works

| Property | Grok 4.1 Fast (current) | Gemini 3 Flash (new) |
|----------|------------------------|---------------------|
| Structured output | No native JSON mode | Native JSON mode (`response_format`) |
| Input pricing | $0.20/MTok | $0.50/MTok |
| Output pricing | $0.50/MTok | $3.00/MTok |
| Est. cost/session | ~$0.008 | ~$0.03 |
| API format | OpenAI chat completions | OpenAI-compat chat completions |

**Key advantages of Gemini 3 Flash:**
- **Native JSON mode** — `response_format: {"type": "json_object"}` forces valid JSON output, eliminating `parse_json_array()` fence-stripping and markdown recovery. Reduces extraction parse failures to near-zero.
- **Better code comprehension** — more accurate extraction of technical details, error-solution causal chains, and architecture patterns.
- **Cost is negligible** — $0.03/session vs $0.008/session is immaterial for the quality gain.

---

## CURRENT STATE — CODE REFERENCES

### How Extraction Works Today

**`backend/app/extractor.py:49-93` — `call_xai()`**

Single function handles all LLM calls. Uses raw `httpx` to POST to xAI's chat completions endpoint.

```python
def call_xai(system: str, user: str) -> str:
    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{XAI_BASE_URL}/chat/completions",    # https://api.x.ai/v1/chat/completions
            headers={
                "Authorization": f"Bearer {XAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": EXTRACTION_MODEL,          # grok-4-1-fast-non-reasoning
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
                "max_tokens": 2000,
                "temperature": 0,
            },
        )
```

Called by three functions:
- `extract_memories()` (line 180) — conversation → typed memory facts
- `detect_contradictions()` (line 205) — supersession detection
- `condense_to_learned_pattern()` (line 234) — aging summaries

**`backend/app/config.py:31-38` — Provider configuration**

```python
XAI_API_KEY: str = os.environ.get("XAI_API_KEY", "")
XAI_BASE_URL = "https://api.x.ai/v1"
EXTRACTION_MODEL = "grok-4-1-fast-non-reasoning"
```

**`backend/app/config.py:84-87` — Pricing constants**

```python
XAI_PRICE_INPUT_PER_M  = 0.20
XAI_PRICE_CACHED_PER_M = 0.05
XAI_PRICE_OUTPUT_PER_M = 0.50
```

---

## ARCHITECTURE

### Data Flow (after change)

```
extract_memories() ──┐
detect_contradictions() ──┤──▶ call_llm(system, user) ──┐
condense_to_learned_pattern() ─┘                         │
                                                         ├──▶ if EXTRACTION_PROVIDER == "google":
                                                         │       call_google(system, user)
                                                         │         POST generativelanguage.googleapis.com
                                                         │         /v1beta/openai/chat/completions
                                                         │         Auth: Bearer GOOGLE_API_KEY
                                                         │         Model: gemini-3-flash-preview
                                                         │         + response_format: json_object
                                                         │
                                                         └──▶ else (default "xai"):
                                                                 call_xai(system, user)
                                                                   POST api.x.ai/v1/chat/completions
                                                                   Auth: Bearer XAI_API_KEY
                                                                   Model: grok-4-1-fast-non-reasoning
```

### OpenAI-Compatible Endpoint Details (from Google AI docs)

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`  
**Auth**: `Authorization: Bearer <GOOGLE_API_KEY>` (standard Bearer token, same as xAI)  
**Model**: `gemini-3-flash-preview`  
**JSON mode**: `response_format: {"type": "json_object"}`  
**Response format**: Standard OpenAI — `choices[0].message.content`, `usage.prompt_tokens`, `usage.completion_tokens`

The request body is **identical** to xAI's format. The only differences are:
1. Base URL
2. API key
3. Model name
4. Pricing constants
5. Optional: `response_format` for native JSON mode

---

## IMPLEMENTATION PHASES

### PHASE 1: Multi-Provider Config

**Goal**: Add all Gemini configuration to `config.py`  
**Duration**: 10 minutes  
**Dependencies**: None  
**Status**: PENDING

**Deliverables:**
- [ ] `backend/app/config.py` — add `EXTRACTION_PROVIDER`, `GOOGLE_API_KEY`, `GOOGLE_BASE_URL`, `GOOGLE_EXTRACTION_MODEL`, pricing constants

**Config additions:**
```python
# Provider selection
EXTRACTION_PROVIDER: str = os.environ.get("EXTRACTION_PROVIDER", "xai")  # "xai" | "google"

# Google / Gemini credentials
GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
GOOGLE_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"
GOOGLE_EXTRACTION_MODEL = "gemini-3-flash-preview"

# Pricing (USD per million tokens) — Gemini 3 Flash
GOOGLE_PRICE_INPUT_PER_M  = 0.50
GOOGLE_PRICE_OUTPUT_PER_M = 3.00
```

**Success Criteria:**
- Config loads without errors
- All existing behavior unchanged (default is "xai")

---

### PHASE 2: Provider Abstraction in Extractor

**Goal**: Add `call_google()` and `call_llm()` dispatcher, replace all `call_xai()` callsites  
**Duration**: 30 minutes  
**Dependencies**: Phase 1  
**Status**: PENDING

**Deliverables:**
- [ ] `backend/app/extractor.py` — add `call_google()`, add `call_llm()` dispatcher, update all callsites
- [ ] `backend/app/telemetry.py` — add `record_google()` to ledger/activity_log (if needed)

**Implementation:**

```python
def call_google(system: str, user: str) -> str:
    """Make a Gemini chat completion via OpenAI-compatible endpoint."""
    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{GOOGLE_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {GOOGLE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GOOGLE_EXTRACTION_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
                "max_tokens": 2000,
                "temperature": 0,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        data = response.json()

    raw: str = data["choices"][0]["message"].get("content") or ""
    # ... telemetry recording with Google pricing ...
    return raw.strip()


def call_llm(system: str, user: str) -> str:
    """Route to configured extraction provider."""
    if EXTRACTION_PROVIDER == "google":
        return call_google(system, user)
    return call_xai(system, user)
```

**Callsite changes** (3 locations):
- `extract_memories()` line 180: `call_xai(...)` → `call_llm(...)`
- `detect_contradictions()` line 205: `call_xai(...)` → `call_llm(...)`
- `condense_to_learned_pattern()` line 234: `call_xai(...)` → `call_llm(...)`

**Success Criteria:**
- `EXTRACTION_PROVIDER=xai` works identically to before
- `EXTRACTION_PROVIDER=google` uses Gemini endpoint
- Telemetry records costs correctly for both providers
- `parse_json_array()` handles both providers' output

---

### PHASE 3: Benchmark & Validate

**Goal**: Run 1 benchmark with Gemini 3 Flash, compare to existing Grok runs  
**Duration**: 1.5-2 hours (benchmark runtime)  
**Dependencies**: Phase 2  
**Status**: PENDING

**Deliverables:**
- [ ] Rebuild backend Docker image
- [ ] Run 1 benchmark with `EXTRACTION_PROVIDER=google`
- [ ] Compare results to existing Grok runs (pr44-per-turn-refresh: 78.5%, pr44-run2: 83.5%)

**Commands:**
```bash
docker compose build opencode-memory-backend
docker compose up -d
# Verify Gemini is active in logs
docker logs opencode-memory-server --tail 5

# Run benchmark
cd benchmark
nohup bun run src/index.ts run -r gemini-flash-1 > /tmp/bench-gemini-flash-1.log 2>&1 &
```

**Success Criteria:**
- Benchmark completes without API errors
- Score documented in `benchmark/data/runs/gemini-flash-1/report.json`

---

## EDGE CASES

| Priority | Edge Case | Decision |
|----------|-----------|----------|
| **High** | Google API key missing when provider=google | Log error and raise immediately — don't silently fall back to xAI |
| **High** | JSON mode returns different structure than Grok | `parse_json_array()` already handles fences, unwrapping, etc. — test that it works with clean JSON too |
| **Medium** | Rate limits on Gemini free tier (20-25 RPM) | Paid tier should handle benchmark load; add retry with backoff if needed |
| **Medium** | `response_format` not supported for contradiction/condensation prompts | JSON mode should work for all prompts since they all request JSON arrays |
| **Low** | Gemini response has different `usage` field names | Wrap usage extraction in try/except (already done for xAI) |

---

## DECISION LOG

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API approach | OpenAI-compatible endpoint | Nearly identical request format to xAI — minimal code change, no new SDK dependency |
| Auth header | `Authorization: Bearer` | Google's OpenAI-compat layer accepts standard Bearer token, same as xAI |
| JSON mode | `response_format: {"type": "json_object"}` | Forces valid JSON — eliminates fence-stripping. Only available via OpenAI-compat endpoint |
| Dispatcher pattern | `call_llm()` wrapping provider-specific functions | Clean separation, easy to add more providers later |
| Default provider | `"xai"` initially | Don't change default until benchmarks prove Gemini is better |
| Telemetry | Separate `record_google()` method | Different pricing, separate cost tracking per provider |

---

## METRICS & MEASUREMENT

| Metric | How Measured | Baseline (Grok) | Target (Gemini) |
|--------|-------------|-----------------|-----------------|
| Overall benchmark score | `bun run bench run` | 78.5%–94.5% (mean ~85%) | Higher mean OR lower variance |
| Score variance | stddev across 3+ runs | ~8pp | < 5pp |
| Synthesis category | benchmark report | 48%–56% | > 60% |
| Extraction parse failures | `parse_json_array()` fallback rate | Unknown | Near-zero (JSON mode) |
| Cost per benchmark run | telemetry ledger | ~$0.05 | ~$0.15 |
| API latency per call | logs | ~500ms | ~500ms (comparable) |

---

## ROLLBACK PLAN

**Detection:**
- Benchmark score regression (< 75% overall)
- API errors or rate limiting
- Cost spikes

**Immediate rollback:**
```bash
# Switch back to Grok — no code change needed
EXTRACTION_PROVIDER=xai docker compose up -d
```

**Graceful degradation:**
- `EXTRACTION_PROVIDER` defaults to `"xai"` — simply unset the env var
- No code changes required to revert
- All existing xAI behavior is completely untouched
