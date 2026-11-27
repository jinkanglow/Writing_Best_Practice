# Writing Best Practices

**A practical, evidence-aware writing skill and deterministic quality-checking CLI.**

> v2.4 Foundation: deterministic checks, evidence-bound offline reviews, benchmark provenance, and an opt-in local model adapter. Model-assisted review is not independent fact verification.

## Why it exists

Generic anti-AI-slop filters often remove phrases without examining whether the writing delivers an argument, a believable scene, or a useful conclusion. This project separates **writing guidance**, **deterministic validation**, and **semantic review**. It will not claim a text is excellent because a phrase checker passed.

## Capabilities

| Feature | Status |
|---|---|
| Portable root `SKILL.md` | Available |
| Narrative, editorial and skill-fusion guidance | Available |
| Chinese and English literal/regex checks | Available |
| UTF-8 byte spans and line numbers | Available |
| Ignore fenced code, quotations, YAML frontmatter | Available (line-level) |
| Rule validation | Available (JSON rule format) |
| Exact same-scope fusion conflicts | Available (legacy JSON requirements) |
| Explicit `writing-contract` blocks in Markdown skills | Available |
| Scope-intersection conflict detection | Available |
| Multi-patch transaction (non-overlapping, version-locked) | Available |
| Version-locked single patch, non-overwriting output | Available |
| Full Markdown AST / inline quotation parsing | Not implemented |
| Reviewed candidate-to-contract compilation | Available (v1.8) |
| Explicit literal contract verification against drafts | Available (v1.8) |
| Evidence-linked manual semantic review | Available (v1.9) |
| Local OpenAI-compatible semantic model call | Available (v2.4, explicit loopback only) |
| Semantic fusion, causality, originality, voice scoring | Not independently validated |
| External fact verification and reader studies | Not implemented |
| Semantic regression and automatic revision | Not implemented |

## Requirements

Node.js 20+; no npm dependencies. Commands run from the repository root. All checks are local.

## Quick start

```bash
npm test
node bin/writing-quality.js rules validate
node bin/writing-quality.js analyze examples/article.md --output .writing/report.json
```

The sample contains one flagged Chinese expression and identical expressions inside a quote and a fenced code block. Only the prose occurrence should be flagged.

## Fuse two explicit rule contracts

```bash
node bin/writing-quality.js fuse \
  --primary examples/primary.json \
  --constraint examples/constraint.json \
  --output .writing/fusion.json
```

This intentionally exits with code `3` for an exact conflict. It **does not** read arbitrary Markdown skill files or perform semantic translation.

## Compile explicit Markdown skill contracts (v1.6)

Natural-language skill files are not reliably machine-parseable. Embed **one** fenced
`writing-contract` block containing JSON (`version: "1.6"`, `requirements: []`).
The CLI validates that explicit contract; other prose remains guidance for the agent.

```bash
node bin/writing-quality.js skill validate examples/primary-skill.md
node bin/writing-quality.js fuse-skills \
  --primary examples/primary-skill.md \
  --constraint examples/constraint-skill.md \
  --output .writing/fusion-v1.6.json
```

The example intentionally returns exit code 3 because both skills disagree on
dialogue in chapter 3. Scope intersection is exact-string-based, with `*` as a
wildcard. Semantic interpretation, arbitrary natural-language extraction and
creative translation are **not** implemented.

## Batch patch transaction (v1.6)

Create a JSON array of independent patches from `patch propose`, then:

```bash
node bin/writing-quality.js patch batch examples/article.md \
  --patches patches.json --output revised.md
```

Every patch must target the **same original document hash**. Overlapping ranges,
ambiguous adjacent insertions, stale hashes, and split UTF-8 code points fail
before any output is written. Existing output files are never overwritten.
No semantic-preservation claim is made.

## Safe patch workflow

```bash
node bin/writing-quality.js patch propose examples/article.md \
  --start 0 --end 1 --replace X
```

The proposal command prints a JSON patch; save it to a file, then use:

```bash
node bin/writing-quality.js patch apply examples/article.md \
  --patch patch.json --output revised.md
```

Offsets are **UTF-8 byte offsets**, not character indices. Patch application rejects stale files, invalid byte boundaries and existing output files. The example `--start 0 --end 1` demonstrates the interface, not a recommended prose edit.

## Rule format

Rules are JSON arrays. Each rule requires `id`, `detector` (`literal` or `regex`), nonempty `phrases`, `severity` (`error`, `warning`, `info`) and optional `scope` (`prose`, `heading`). The default rules are in [`rules/anti-slop.json`](rules/anti-slop.json). Warnings require editorial judgment; they are not auto-deleted.

## Agent integration

Copy the repository's [`SKILL.md`](SKILL.md) and the relevant `skills/` and `references/` files into your agent's supported skill directory. Different agents have different discovery conventions; no universal installation command is claimed. The CLI and the Skill work independently.

## Quality and security boundaries

- Markdown parsing is line-based, not a full AST. Inline code and nested structures are not fully classified.
- Regex patterns come from trusted local configuration. Do not load untrusted regex without review; complex expressions can cause excessive runtime.
- Legacy JSON fusion checks identical scopes; v1.6 Markdown contract fusion checks explicit scope intersections and exact `must` versus `must_not` values.
- The patch command is not a full transaction manager; semantic preservation requires review.
- No uploaded book text is copied into this repository; the skills express independently formulated writing workflows.

## Development roadmap

1. Full Markdown AST and byte-accurate spans for nested constructs.
2. Formal JSON Schema and TypeScript public interfaces.
3. Conflict dependency graph, multiple-patch transactions and immutable anchors.
4. Pluggable semantic and evidence adapters with calibrated evaluations.
5. Human-labeled multilingual benchmark and reader outcome studies.

## Test and CI

Run `npm test`. GitHub Actions runs tests, validates the rule configuration and analyzes the example. See [`.github/workflows/quality.yml`](.github/workflows/quality.yml).

## License

MIT. See [`LICENSE`](LICENSE).

## v1.7 — Review-first natural-language skill extraction

Extract **candidates**, not executable rules, from an ordinary Markdown skill:

```bash
node bin/writing-quality.js skill extract SKILL.md --output .writing/candidates.json
```

The result includes `line`, `section`, `text`, `proposedObligation`, `proposedScope`, and `status: needs_review`. Every candidate must be manually reviewed before it can become an explicit `writing-contract` requirement. This command does **not** compile arbitrary natural-language instructions or perform semantic fusion.

Markdown analysis now conservatively masks inline backtick code, classifies list items and indented code, and preserves UTF-8 byte offsets and CRLF source positions. It is still **not** a full CommonMark parser: nested block containers, HTML blocks, and all inline delimiter edge cases remain unsupported.

```bash
npm run check
node bin/writing-quality.js analyze examples/article.md
node bin/writing-quality.js skill extract examples/primary-skill.md
```

### Engineering verification

v1.7 includes 25 passing local tests, covering deterministic rule checks, contract loading, exact conflict detection, version-locked patch transactions, candidate extraction and source offsets. Passing tests do not establish writing quality, semantic correctness, or production readiness.

## v1.8: Review-first contract compilation and document verification

Natural-language candidate extraction **does not** authorize automatic enforcement.
Review each candidate and supply a JSON array of explicit decisions. An approved
requirement must contain `id`, `action: "approve"`, `obligation`, `value`, and
`scope`; optionally specify a deterministic `check`:

```json
[
  {
    "id": "C-EXAMPLE",
    "action": "approve",
    "obligation": "must",
    "value": "required wording",
    "scope": ["*"],
    "check": { "kind": "literal", "text": "required wording" }
  }
]
```

Use actual candidate IDs from `skill extract`. Rejected candidates use
`{"id":"...","action":"reject"}`. Unreviewed candidates remain pending;
the CLI writes the approved subset and exits `4` when review is incomplete.

```bash
node bin/writing-quality.js skill extract SKILL.md --output .writing/candidates.json
node bin/writing-quality.js skill compile-reviewed \
  --candidates .writing/candidates.json \
  --decisions .writing/decisions.json \
  --output .writing/approved-contract.json
node bin/writing-quality.js verify-contract examples/article.md \
  --contract .writing/approved-contract.json \
  --output .writing/verification.json
```

`verify-contract` accepts either JSON contracts or Markdown skills with one
`writing-contract` block. It supports **explicit literal checks only**. It does
not infer that an abstract label such as `dialogue`, `character-growth`, or
`consequential-choice` is satisfied by finding those words in prose. Such
requirements return `NOT_VERIFIED`, making the report `INCOMPLETE`.

Section scopes match normalized Markdown headings (for example, `# Chapter 3`
becomes `chapter-3`). The wildcard `*` covers all eligible prose. The current
line-oriented Markdown parser is **not** a full CommonMark AST. Complex nested
containers, HTML blocks and some inline delimiters remain unsupported.

Exit codes: `0` pass, `1` contract violation, `2` invalid CLI arguments,
`3` exact fusion conflict, `4` incomplete review or verification, `5` runtime
or input error. These codes describe implemented commands, not an assurance
of overall writing quality.

## Evidence-linked semantic review (v1.9)

Machine-checkable literal requirements and editorial semantic judgments are separate.
A reviewed contract may set `"check": {"kind": "semantic_review"}`. This **does not**
activate an LLM or automatically judge writing quality. It requires a human reviewer
to record a decision and cite an exact quote from the current document.

```bash
node bin/writing-quality.js evidence prepare examples/article.md \
  --contract examples/semantic-contract.json --output .writing/review.json
# Edit review.json: set decision to supported, contradicted, or insufficient_evidence;
# add reviewer and evidence: [{"nodeId":"L2","quote":"exact excerpt"}].
node bin/writing-quality.js evidence verify examples/article.md \
  --contract examples/semantic-contract.json --review .writing/review.json
```

The review is bound to SHA-256 hashes of both the document and the contract.
Evidence quotes must occur in the cited source node and, when scoped, its heading
section. `REVIEW_COMPLETE` means that the review record is complete; it does
**not** prove the reviewer's conclusion. No external fact checking, model inference,
or independent truth certification is performed. Exit code 4 means incomplete;
1 means a review contradicted a requirement; 5 means invalid/stale input.

**Known limitations:** the Markdown scanner is not a full CommonMark AST;
semantic review does not verify entailment; cited snippets can be taken out of
context; reviewer identities are plain-text attestations, not authenticated signatures.

## v2.0 — Semantic adapter boundary and protected revisions

This release adds **offline semantic task preparation and review validation**. It does not ship a language model, model API client, factual truth detector, or automatic semantic inference. A model or human may populate a task file, but the CLI verifies its source references and version locks before accepting the response as a *review attestation*, not proof.

```bash
node bin/writing-quality.js semantic prepare examples/article.md \
  --contract examples/semantic-contract.json \
  --output .writing/semantic-tasks.json
# Review and fill decisions/reviewer/source quotations in the JSON file.
node bin/writing-quality.js semantic verify examples/article.md \
  --contract examples/semantic-contract.json \
  --response .writing/semantic-tasks.json
```

`preserve verify` accepts a JSON array of existing version-locked patches and a JSON array of protected spans (`id`, `documentHash`, `startOffset`, `endOffset`, `expectedTextHash`). It refuses patches intersecting protected ranges and can write a **new** output file; it never overwrites the source.

```bash
node bin/writing-quality.js preserve verify examples/article.md \
  --patches .writing/patches.json \
  --protected .writing/protected.json \
  --output .writing/revised.md
```

**Boundaries:** Protected-span checks are byte-exact, not semantic equivalence checks. Review evidence proves that a quotation exists in the selected source node, not that the review conclusion is correct. Markdown parsing remains a conservative scanner, not a full CommonMark AST. These commands do not establish publication quality.

## v2.1: Reproducible benchmark evaluation

Run `node bin/writing-quality.js benchmark evaluate benchmarks/sample.jsonl --output .writing/benchmark-report.json` to evaluate externally supplied labels. Input is newline-delimited JSON with unique `id`, nonempty `category`, `gold` (`violation` or `no_violation`) and `prediction` (`violation`, `no_violation` or `abstain`).

The benchmark is **an evaluation harness, not an automatic semantic detector**. `benchmarks/sample.jsonl` is deliberately synthetic and **must not** be presented as measured model performance. The report contains confusion counts, precision, recall on decided cases, false-positive rate and coverage for each category and overall. `null` means a metric has an undefined denominator. Abstentions are excluded from decided-case recall and explicitly reduce coverage. Keep gold-label provenance and reviewer agreement outside the harness until a separate annotation workflow is implemented.

Example:

```bash
npm run check
node bin/writing-quality.js benchmark evaluate benchmarks/sample.jsonl \
  --output .writing/benchmark-report.json
```

**Limitations:** This version does not run an LLM or verify human labels. It does not provide calibrated semantic accuracy, semantic preservation, real-reader outcomes, or source fact-checking. Do not use the synthetic example to claim production quality.

## v2.2: offline semantic provider exchange and benchmark provenance

This version introduces a **provider-neutral file exchange**, not an automatic LLM connection. The adapter prepares a hash-bound request; a separately operated model or human reviewer may populate a response file. The verifier checks task IDs, version locks, allowed decisions and exact source quotations. It **cannot establish that the model's interpretation is correct**.

```bash
node bin/writing-quality.js provider prepare examples/article.md \
  --contract examples/semantic-contract.json \
  --provider manual --model unconfigured \
  --output .writing/provider-request.json
# Supply a separate response JSON matching schemaVersion 2.2, requestHash,
# provider, model and tasks [{id,decision,evidence:[{nodeId,quote}]}].
node bin/writing-quality.js provider verify examples/article.md \
  --contract examples/semantic-contract.json \
  --request .writing/provider-request.json \
  --response .writing/provider-response.json
```

Benchmark provenance can be checked with:

```bash
node bin/writing-quality.js benchmark provenance benchmarks/sample.jsonl \
  --manifest benchmarks/sample.manifest.json
```

The sample benchmark is **synthetic**, not an independent human-labelled evaluation. Manifest metadata is self-declared and cannot authenticate annotators. v2.2 does not perform automatic semantic inference, web fact checking, full CommonMark parsing, or semantic-preservation proof.


## Local semantic provider (v2.4)

The provider adapter is **opt-in**. Start a local OpenAI-compatible chat completions server yourself, then run:

```bash
node bin/writing-quality.js provider local examples/article.md \
  --contract examples/semantic-contract.json \
  --endpoint http://127.0.0.1:1234/v1/chat/completions \
  --model YOUR_LOCAL_MODEL_ID \
  --output .writing/local-review.json
```

The endpoint is an example, not a running service included with this repository. Supported paths: `/v1/chat/completions` and `/api/chat/completions` on explicit HTTP loopback ports. No API keys or external addresses are accepted. Model output is parsed as strict JSON and checked against source-node IDs and exact source quotations. A verified quote establishes only that the text was quoted accurately; it does not establish that the model's interpretation or any real-world claim is correct. The adapter currently does not implement automatic retries, model discovery, streaming, or arbitrary provider protocols.

### What is actually tested

`npm run check` includes an HTTP loopback integration test using a deterministic mock server and tests rejecting external endpoints, malformed responses, and fabricated quotations. No model weights, local inference server, or independent human evaluation dataset is bundled.


## v2.4 — Independent annotation and reviewed evaluation

This release adds a deterministic annotation workflow. **The bundled examples are synthetic and do not establish model quality or genuine human agreement.**

```bash
node bin/writing-quality.js benchmark annotation-prepare benchmarks/annotation-cases.example.json --output .writing/annotation-task.json
node bin/writing-quality.js benchmark adjudicate --cases benchmarks/annotation-cases.example.json --annotations benchmarks/annotations.synthetic.example.json --output .writing/adjudicated.json
node bin/writing-quality.js benchmark evaluate-reviewed --adjudication .writing/adjudicated.json --predictions benchmarks/predictions.synthetic.example.json --output .writing/reviewed-metrics.json
```

Each case has an ID, category, rule ID, and source text. Each independent annotation must include the case ID, reviewer ID, `violation` / `no_violation` / `uncertain`, rationale, and SHA-256 of the exact text. Two agreeing non-uncertain labels are required for consensus. Disagreements or missing reviews remain `INCOMPLETE` and cannot enter `evaluate-reviewed`. Prediction IDs and text hashes must match the adjudicated set exactly; abstentions remain abstentions.

**Limitations:** Two labels with different reviewer identifiers do not establish reviewer independence. Consensus is not a substitute for expert adjudication. The example annotations and predictions are synthetic; do not use the example benchmark metrics as model performance claims. Full CommonMark AST, automatic semantic truth assessment, and verified human studies remain outside the implemented scope.

## v2.5 — Disagreement resolution and traceable error audit

The adjudication command requires a **separate reviewer** to explicitly resolve each disputed or insufficiently labelled case. It preserves original labels, the adjudicator's rationale and the final label; unresolved cases remain `INCOMPLETE` and cannot be silently excluded from the reviewed benchmark.

```bash
node bin/writing-quality.js benchmark resolve-disagreements \
  --cases benchmarks/annotation-cases.example.json \
  --adjudication .writing/adjudicated.json \
  --decisions .writing/adjudicator-decisions.json \
  --output .writing/resolved.json

node bin/writing-quality.js benchmark error-audit \
  --cases benchmarks/annotation-cases.example.json \
  --adjudication .writing/resolved.json \
  --predictions benchmarks/predictions.synthetic.example.json \
  --output .writing/error-audit.json
```

The adjudicator decision format is an array of `{id, gold, adjudicator, rationale, textSha256}`. `gold` must be `violation` or `no_violation`. The adjudicator must not be one of the original annotators of that case. The error audit classifies `FALSE_POSITIVE`, `FALSE_NEGATIVE`, and `ABSTENTION`, and attaches the exact case text, rule ID, category, and any supplied matching source quote. It requires a complete adjudicated dataset; it never silently drops disputed cases.

**Security and validity boundary:** Different reviewer IDs do not authenticate human identities or independence. Quotation matching proves textual presence, not semantic truth. Neither the synthetic examples nor the test suite demonstrate real model quality. This version does **not** implement automated claim-preservation assessment.

## v2.6 — Revision preservation anchor audit

This release adds **deterministic textual anchor preservation** for a draft before/after comparison. It does not infer semantic equivalence. Supply anchors as an array of `{ "id": "claim-1", "kind": "thesis", "quote": "Exact original sentence" }`. Supported kinds are `thesis`, `fact`, `causal_link`, `character_state`. Each original quote must occur exactly once in the original draft. Changed or missing exact quotations require explicit review.

```bash
node bin/writing-quality.js revision audit --before original.md --after revised.md --anchors anchors.json --output .writing/revision-audit.json
node bin/writing-quality.js revision review --before original.md --after revised.md --anchors anchors.json --decisions decisions.json --output .writing/revision-review.json
```

Review JSON requires `schemaVersion: "2.6"`, the `beforeHash` and `afterHash` from the audit, and `decisions` containing `{id,decision,reviewer,rationale,revisedQuote}` for changed anchors. Decisions are `allow` or `reject`. The revised quotation must appear in the revised draft. The review command rejects stale document hashes, duplicate decisions, unsupported IDs, and fabricated revised quotations. It returns `INCOMPLETE` (exit 4) for missing reviews, `BLOCKED` (exit 1) for explicit rejection, or `REVIEW_COMPLETE` when all changed anchors are approved.

**Boundary:** This is an anchor tracking and editorial authorization system, not an automatic semantic preservation verifier. An unchanged quotation does not prove the surrounding context preserves its meaning; a changed quotation does not prove the meaning changed. Reviews are self-declared, not authenticated. The project still lacks a real expert-labeled preservation benchmark.

## v2.7 — Revision Semantic Drift Benchmark

This version adds a **gold-label-blind prediction task** for paired original/revised texts. Cases cover `thesis_reversal`, `fact_addition`, `fact_removal`, `causal_inversion`, and `character_state_conflict`. Predictions are supplied externally; the CLI does **not** infer semantic drift. The evaluator checks document SHA-256 locks, evidence quote existence, duplicate/missing predictions, and reports per-category metrics plus individual error cases. Missing predictions count as abstentions and cause exit code 4.

```bash
node bin/writing-quality.js revision drift-prepare \
  --cases benchmarks/drift.synthetic.example.json \
  --output .writing/drift-tasks.json

# Obtain independent model predictions following the task hashes and schema.
node bin/writing-quality.js revision drift-evaluate \
  --cases benchmarks/drift.synthetic.example.json \
  --predictions .writing/drift-predictions.json \
  --output .writing/drift-results.json
```

Prediction envelope: `{ "schemaVersion": "2.7", "provider": {"name":"offline", "model":"model-id"}, "predictions": [{"id":"demo-1", "beforeHash":"<sha256>", "afterHash":"<sha256>", "prediction":"violation", "evidence":{"side":"after", "quote":"decreasing"}}] }`. An abstention omits `evidence`. Missing case predictions are tracked, not silently excluded.

**Evidence limits:** Example gold labels and reviewer names are synthetic. Two distinct reviewer identifiers are a declared annotation protocol, not proof of independent human annotation. Matching a quoted span does not prove that the conclusion follows from it. This module does not measure real model accuracy until externally produced predictions are evaluated against genuinely independently adjudicated cases.

## v2.8 — Fail-closed Revision Quality Gate

A release gate for **explicitly protected textual anchors**, not a semantic-equivalence oracle. Run after drafting and review:

```bash
node bin/writing-quality.js revision gate \
  --before original.md --after revised.md --anchors anchors.json \
  --decisions decisions.json --contract-report contract-report.json \
  --output .writing/release-gate.json
```

`--decisions` and `--contract-report` are optional, but changes to protected anchors **cannot** clear the gate without review. If a contract report is supplied, its `documentHash` must equal the SHA-256 of the revised document. A report marked `FAIL` or with a stale hash blocks release; `INCOMPLETE` holds release. An empty anchor list never clears the gate.

Exit codes: `0` means `READY_FOR_HUMAN_RELEASE`, **not** permission to publish automatically; `1` means `BLOCKED`; `4` means `INCOMPLETE`; `5` means invalid input. Existing commands remain available. The gate cannot discover unlisted claims, establish semantic equivalence, authenticate reviewer identity, or prove external facts. Production workflows should independently verify factual assertions and require an authorized human publisher.

## v2.9 — Declared Anchor Coverage & Release Evidence

Version 2.9 adds **deterministic inventory-to-anchor coverage** and a **content-addressed release evidence bundle**. Neither mechanism discovers omitted claims or proves semantic equivalence.

```bash
node bin/writing-quality.js revision coverage \
  --before examples/release/original.md \
  --anchors examples/release/anchors.json \
  --inventory examples/release/inventory.json \
  --output .writing/coverage.json

node bin/writing-quality.js revision bundle \
  --before examples/release/original.md \
  --after examples/release/revised.md \
  --anchors examples/release/anchors.json \
  --inventory examples/release/inventory.json \
  --output .writing/release-evidence.json

node bin/writing-quality.js revision bundle-verify \
  --bundle .writing/release-evidence.json
```

To evaluate changed protected assertions, provide `--decisions path/to/reviews.json` to `revision bundle`. Optionally provide `--contract-report path/to/contract-report.json`. Without required review, the bundle is `INCOMPLETE` and the CLI exits 4. Rejected review or failed contract is `BLOCKED` and exits 1. A complete deterministic gate returns `READY_FOR_HUMAN_RELEASE`, **not** authorization to publish.

Inventory entries must have unique `id`, supported `kind` (`thesis`, `fact`, `causal_link`, `character_state`), an exact unique `quote` in the original, and an `anchorId` referencing an anchor of the same kind whose quote contains that inventory quote. This is **declared coverage**, not an automatic assertion census.

The bundle embeds both full texts and all supplied review material; treat it as sensitive editorial material. Its SHA-256 digest detects modification of the included fields when verified using this implementation, but is **not a signature** and does not authenticate reviewers. A malicious actor able to replace the bundle can also generate a new valid bundle. Preserve the expected digest through an independently trusted channel if authenticity is required.

`.github/workflows/release-evidence.yml` demonstrates a **working example CI check** against included fixture files. To protect real manuscripts, configure the workflow to use the project's actual input paths, branch protections, and review procedures. This template does not automatically discover manuscripts or enforce repository-wide editorial approval.

## v3.0 — Auditable writing workflow

The `workflow` command connects deterministic rule scanning, declared anchor coverage, revision release checks, and a reproducible evidence bundle. It **does not** draft text, run a language model, verify external facts, or establish semantic equivalence.

```bash
node bin/writing-quality.js workflow run \
  --before examples/release/original.md \
  --after examples/release/revised.md \
  --anchors examples/release/anchors.json \
  --inventory examples/release/inventory.json \
  --rules rules/anti-slop.json \
  --output .writing/workflow.json

node bin/writing-quality.js workflow verify --report .writing/workflow.json
```

Optional inputs: `--decisions decisions.json` and `--contract-report report.json`. The workflow outputs four named stages (`analyze`, `coverage`, `release_gate`, `bundle_integrity`) with evidence and the complete embedded release bundle. Exit status: `0` means ready for **human** release or successful verification, `1` means blocked, `4` means incomplete, and `5` means invalid input or runtime error. Warnings require review rather than silently passing.

**Integrity scope:** `workflow verify` validates the stored checksum and embedded bundle against each other; SHA-256 is not a digital signature and cannot authenticate who created the report. A manifest that omits an important claim cannot protect that claim. This command does not publish anything.

## v3.1 — Reviewed Revision Planning

The revision planner converts configured deterministic findings into byte-accurate tasks. A separate, explicit decision file is required to execute replacements. It never asks a model to invent edits and never overwrites the source file.

```bash
node bin/writing-quality.js revision plan --file examples/article.md --output .writing/plan.json
node bin/writing-quality.js revision plan-verify --file examples/article.md --plan .writing/plan.json
```

Prepare a decisions file (one entry per task you wish to approve or reject):

```json
{
  "planHash": "COPY_PLAN_HASH_FROM_PLAN_JSON",
  "items": [
    {"taskId":"task-0001","action":"approve","replacementText":"Revised wording"}
  ]
}
```

Then execute:

```bash
node bin/writing-quality.js revision execute --file examples/article.md --plan .writing/plan.json --decisions .writing/decisions.json --output .writing/revised.md --report .writing/execution.json
```

Unreviewed tasks produce `INCOMPLETE` (exit code 4). Approved edits produce `REVIEW_REQUIRED`, not release approval. Protected-anchor overlaps, stale document hashes, duplicate decisions and conflicting patches are rejected. The output is created exclusively (`wx`), so an existing output is not silently replaced.

**Scope:** The engine can identify only configured literal/regex findings. It cannot identify all writing problems, generate replacements, prove semantic equivalence, or authenticate human approvals. Existing workflow release gates must still run on the revised document.

## v3.2 — Post-revision acceptance

`revision accept` connects a reviewed v3.1 plan to deterministic post-edit analysis. It executes only approved replacements, checks newly introduced rule matches, audits declared anchors, and optionally checks fused machine-readable skill contracts. The original file is never overwritten. A `BLOCKED` result writes the audit report but **does not write the revised draft**.

```bash
node bin/writing-quality.js revision plan --file draft.md --output .writing/plan.json
# Create decisions.json with {"planHash":"<planHash>","items":[{"taskId":"task-0001","action":"approve","replacementText":"..."}]}
node bin/writing-quality.js revision accept \
  --file draft.md --plan .writing/plan.json --decisions decisions.json \
  --rules rules/anti-slop.json --output .writing/revised.md \
  --report .writing/acceptance.json
node bin/writing-quality.js revision accept-verify \
  --report .writing/acceptance.json --before draft.md --after .writing/revised.md
```

Optional flags: `--anchors anchors.json --primary primary-skill.md --constraint constraint-skill.md`. Primary and constraint must be supplied together; only explicit exact contradictory obligations are detected. Existing findings are counted by rule ID, severity and matched phrase, so the comparison cannot prove the same issue was resolved at the same location. `READY_FOR_HUMAN_REVIEW` is **not** publication approval. A report checksum checks accidental modification, not authenticity or the correctness of the reviewer. Exit codes: `0` ready, `1` blocked, `4` incomplete, `5` invalid input or runtime error.

**Current limitations:** No automatic semantic equivalence, no automated source fact-checking, no LLM-generated edits, no semantic conflict detection, no independent production benchmark. This is a deterministic post-revision quality gate.

## v3.3 — Contextual style signals and revision regression attribution

The v3.3 integration draws on **categories** publicly described by [anti-ai-slop-writing](https://github.com/jalaalrd/anti-ai-slop-writing), rather than copying its skill text or banned-word inventory. The original upstream `SKILL.md` was not available for full inspection in this build, so upstream-specific implementation parity is **not claimed**.

The default style policy detects selected stock phrases, conventional sentence openers, repeated punctuation and repetitive English sentence starts. All results are **editorial review signals**, never evidence of AI authorship. Review [the policy and limits](references/style-signal-policy.md) before enforcing warnings.

```bash
node bin/writing-quality.js style inspect --file examples/article.md --output .writing/style.json
node bin/writing-quality.js revision attribute --file examples/article.md --patches .writing/patches.json --output .writing/attribution.json
npm run check
```

`revision attribute` validates each patch against the original document, runs each patch independently, and compares those findings with the combined patch result. Its single-patch counterfactuals **cannot prove causal responsibility for interacting changes**. It does not alter the source document. Both commands use the existing JSON output conventions.

**v3.3 validation:** 195 automated tests passed locally. No external writing model accuracy, human editorial quality, or AI-authorship classification performance is claimed.

## v3.4 — Editorial Safety Audit

Revision fluency is not evidence of factual fidelity. `revision safety-audit` checks a **user-declared** inventory of exact protected quotations across two document versions. Supported inventory kinds: `qualification`, `attribution`, `risk`, `technical_term`, `claim`, `causal_link`, `character_state`.

```bash
node bin/writing-quality.js revision safety-audit \
  --before examples/editorial-safety/before.md \
  --after examples/editorial-safety/after.md \
  --inventory examples/editorial-safety/inventory.json \
  --output .writing/editorial-safety.json

node bin/writing-quality.js revision safety-verify \
  --before examples/editorial-safety/before.md \
  --after examples/editorial-safety/after.md \
  --inventory examples/editorial-safety/inventory.json \
  --report .writing/editorial-safety.json
```

The example intentionally returns `INCOMPLETE` (exit 4): attribution and qualification were removed. The audit rejects duplicate IDs and ambiguous quotations in the original, records UTF-8 byte spans, and binds the report to both document hashes and inventory hash. Verification recomputes the results instead of trusting report content. It never edits either document.

**Limitations:** Only explicitly listed quotations are protected. A quote retained verbatim may change meaning in a different context. This is neither a semantic-equivalence checker nor a fact-checker. A `TEXT_CHECK_COMPLETE` result does not authorize publication. This feature is separate from the v3.3 anti-slop style signals, which remain editorial heuristics rather than AI-authorship detection.

## v3.5 — Editorial safety release gate

The `revision safety-gate` command composes the existing protected-anchor release gate with the editorial safety inventory. It fails closed when a declared qualification, attribution, risk disclosure, technical term, claim, causal link, or character-state quote has been removed or duplicated without a decision.

```bash
node bin/writing-quality.js revision safety-gate \
  --before examples/release/original.md \
  --after examples/release/revised.md \
  --anchors examples/release/anchors.json \
  --inventory examples/release/inventory.json \
  --output .writing/editorial-release.json
```

For reviewed changes, pass `--editorial-decisions decisions.json`. The decisions file uses schema version `3.5`, with `beforeHash`, `afterHash`, `inventoryHash`, and an `items` array. Each changed item needs `{ "id": "...", "decision": "approve" | "reject", "reviewer": "...", "reason": "..." }`. Generate the three hashes from the `revision safety-audit` report. This is a *self-declared* human review record, not an authentication mechanism or semantic correctness certificate.

Use `revision safety-gate-verify` with the same inputs plus `--report .writing/editorial-release.json` to recompute the decision and detect report tampering. Exit codes: `0` ready for human release, `1` blocked, `4` incomplete, `5` invalid input. Empty inventories cannot pass. The original document is never changed.

**Limitations:** The inventory is not auto-generated or exhaustive; exact quote retention is not semantic preservation; approvals are not independently authenticated. Do not interpret `READY_FOR_HUMAN_RELEASE` as permission to publish without editorial judgment.

A changed-qualification example is provided under `examples/editorial-release/`. Running `revision safety-gate` against those files returns `INCOMPLETE` (exit 4), as expected, until a review decision is supplied. The separate `examples/release/` fixture contains unchanged text and can return `READY_FOR_HUMAN_RELEASE` without editorial decisions.

## v3.6 — Unified final gate (fail-closed)

`revision final-gate` now recomputes the v3.2 revision acceptance from the **original plan, plan decisions, and rules**; checks that the resulting text exactly matches `--after`; recomputes the editorial safety gate; and verifies the fused primary and constraint skill contracts. A self-contained acceptance report is **not** accepted merely because its checksum matches. Missing skill contracts are `INCOMPLETE` rather than silently skipped.

```bash
node bin/writing-quality.js revision final-gate \
  --before original.md --after revised.md \
  --anchors anchors.json --inventory inventory.json \
  --plan revision-plan.json --plan-decisions revision-decisions.json \
  --acceptance-report acceptance.json \
  --primary primary-skill.md --constraint constraint-skill.md \
  --output .writing/final-gate.json
```

Optionally supply `--rules` (defaults to `rules/anti-slop.json`), `--editorial-decisions`, `--decisions` (anchor review) and `--contract-report`. Use `revision final-gate-verify` with the same inputs and `--report .writing/final-gate.json` to recompute the full decision. Exit 0: `READY_FOR_HUMAN_RELEASE`; exit 1: `BLOCKED`; exit 4: `INCOMPLETE`; exit 5: invalid input. The final gate never edits the manuscript.

**Trust boundary:** Report hashes detect inconsistency and staleness, not authorship or malicious substitution of *all* input files. A complete pass does not establish factual correctness, semantic equivalence, reviewer identity, or publication authorization. Declared inventory coverage is not exhaustive.


## v3.7 — Revision Trace (deterministic)

The `revision trace` command recomputes each declared revision task against the post-edit document, records whether its **literal finding signature** disappeared, and lists newly introduced rule findings. The verifier re-executes the approved patch set and compares the complete report; a checksum alone is not accepted as evidence.

```bash
node bin/writing-quality.js revision trace --before draft.md --plan .writing/plan.json --decisions .writing/decisions.json --output .writing/trace.json
node bin/writing-quality.js revision trace-verify --before draft.md --after revised.md --plan .writing/plan.json --decisions .writing/decisions.json --report .writing/trace.json
```

Both commands use `--rules rules/anti-slop.json` by default. The plan must have been generated from the **same rules**. `BLOCKED` exits 1 for newly introduced `error` findings; `INCOMPLETE` exits 4 for unresolved/rejected/pending tasks or introduced warnings. This is signature-level tracking, **not causal attribution, semantic equivalence, or independent factual verification**. Existing tests use synthetic cases and do not establish real-world editorial accuracy.

## v3.8 — Claim-Level Revision Integrity

A declared claim inventory can protect exact quotations classified as `thesis`, `fact`, `qualification`, `causal`, `conclusion`, `character_state`, or `attribution`. This is an **exact-text audit**, not a semantic entailment detector. A changed claim requires a document- and inventory-hash-locked editorial decision. An approval permits human review; it does not prove factual correctness.

```bash
node bin/writing-quality.js revision claims-audit --before original.md --after revised.md --claims claims.json --output .writing/claims-audit.json
node bin/writing-quality.js revision claims-verify --before original.md --after revised.md --claims claims.json --report .writing/claims-audit.json
```

The inventory JSON contains `beforeHash` (SHA-256 of the original UTF-8 text) and a nonempty `claims` array with unique `id`, `type`, and exact `quote`. If a quote appears multiple times, provide zero-based `occurrence`. The optional review file contains `beforeHash`, `afterHash`, `inventoryHash` (SHA-256 of JSON-stringified inventory) and `decisions` with `claimId`, `action` (`approve` or `reject`), `reviewer`, and nonempty `reason`. Reviews are not cryptographically signed. A retained quote can still change meaning through context; this tool does not infer new claims, validate facts, or independently verify semantic preservation. This command is standalone and is **not yet integrated into `revision final-gate`**.

## v3.9 — Argument Graph Audit and Final Gate Integration

The argument graph is **declared by an editor**. It does not extract claims or prove semantic relations. Each node references an exact quote in the original draft. Each edge records a relationship (`supports`, `qualifies`, `causes`, `contradicts`, or `attributed_to`). A preserved quote alone is not evidence that the relation survives a revision: every edge requires an explicit human decision before the graph reaches `READY_FOR_HUMAN_REVIEW`.

```bash
node bin/writing-quality.js revision graph-audit \
  --before examples/argument-graph/original.md \
  --after examples/argument-graph/revised.md \
  --graph examples/argument-graph/graph.json \
  --output .writing/argument-graph-audit.json

node bin/writing-quality.js revision graph-verify \
  --before examples/argument-graph/original.md \
  --after examples/argument-graph/revised.md \
  --graph examples/argument-graph/graph.json \
  --report .writing/argument-graph-audit.json
```

To incorporate claim integrity and argument graph checks in the existing final gate, add `--claims claims.json --claim-review claim-review.json --argument-graph graph.json --argument-review graph-review.json` to `revision final-gate` (the review flags may be omitted to receive `INCOMPLETE`). The final gate recomputes the audits and includes their report hashes. Without those optional inputs, the v3.8 behavior remains unchanged; omission is **not** proof of argument coverage. A graph approval is a workflow acknowledgment, not a semantic-equivalence or factual-correctness certificate.

## v4.0 — Argument graph candidate extraction and human approval

The `graph` commands establish an explicit **candidate → source-quote validation → editorial approval** boundary. They do **not** infer or verify semantic relations automatically. The proposal JSON is supplied by an external reviewer or model, and every node quote must appear **exactly once** in the source document. This strict constraint intentionally rejects ambiguous duplicate quotations.

```bash
node bin/writing-quality.js graph prepare --before draft.md --output .writing/graph-request.json
node bin/writing-quality.js graph validate --before draft.md --request .writing/graph-request.json --proposal .writing/graph-proposal.json --output .writing/graph-validation.json
node bin/writing-quality.js graph approve --before draft.md --validation .writing/graph-validation.json --decisions .writing/graph-decisions.json --output .writing/approved-graph.json
```

Proposal format: `{"requestHash":"<requestHash>","nodes":[{"id":"a","quote":"<exact original quotation>","role":"evidence"}],"edges":[]}`. Allowed roles: `claim`, `evidence`, `qualifier`, `cause`, `effect`, `source`, `conclusion`, `other`. Allowed relations: `supports`, `qualifies`, `causes`, `contradicts`, `attributed_to`. Decisions must contain `reportHash` and `decisions` with `edgeId`, `action` (`approve`/`reject`), `reviewer`, and `reason`.

**Boundary:** `APPROVED_FOR_AUDIT` means that all declared relations have an explicit approval record. It does not prove those relations are true. The approved graph can be used as the graph input for the existing revision graph audit, which still requires its own post-revision relation review. Reviewer identity is not cryptographically authenticated.

## v4.1 — Exact UTF-8 evidence spans

Graph extraction candidates now include `span.startByte`, `span.endByte`, `span.quoteHash`, and source `line`. The offsets are **UTF-8 byte offsets**, not JavaScript character indices. The verifier checks the exact bytes against the supplied quote and SHA-256 hash, rejecting forged or stale spans. The graph proposal validator also accepts an optional `span` on each node and validates it; otherwise it computes an exact span for uniquely occurring quotes. Existing proposal fields remain supported.

`graph prepare` skips fenced code, frontmatter, headings, blockquotes and list markers, and preserves byte offsets across blank lines and Chinese text. This is a conservative line scanner, **not a full CommonMark parser**; nested containers and complex Markdown syntax remain unsupported. Duplicate identical quotes cannot be uniquely located by quote alone and are rejected at proposal validation. Cross-paragraph **candidate collection** is supported, but automatic inference of cross-paragraph relationships is not.

Run `npm run check` and use the existing `graph prepare`, `graph validate`, and `graph approve` commands. `schemaVersion` for newly generated graph extraction reports is `4.1`. No real model accuracy study has been conducted.

## v4.2 — Avoid AI Writing editorial audit

`avoid-ai detect` is a **writing-quality heuristic**, never an AI-authorship verdict. The bilingual rules target formulaic openings, generic conclusions, significance inflation, pseudo-contrasts, vague source attribution, and chatbot artifacts. Findings have UTF-8 byte offsets and document hashes. Code fences, Markdown quotations, and inline code are excluded by the existing conservative scanner.

```bash
node bin/writing-quality.js avoid-ai detect --file examples/article.md --context cn-explanatory --output .writing/avoid-ai.json
node bin/writing-quality.js avoid-ai verify --file examples/article.md --context cn-explanatory --report .writing/avoid-ai.json
```

Supported contexts: `blog`, `technical-blog`, `investor-email`, `docs`, `casual`, `cn-explanatory`. All findings are review-only; the tool **does not auto-rewrite** text, remove justified uncertainty, delete source attribution, or infer AI authorship. This implementation selects concrete, testable patterns from the user-supplied Avoid AI Writing specification; it does not claim full parity with that extensive specification. The source specification's quantitative AI-detection claims have not been independently verified.

## v4.3 — Avoid AI Writing tiered editorial audit

The new **tiered audit** is separate from the v4.2 `avoid-ai detect` command, which remains backward-compatible. The audit **does not classify authorship** and does not rewrite text automatically.

```bash
node bin/writing-quality.js avoid-ai tiers --file examples/article.md --context cn-explanatory --voice chinese-explanatory --output .writing/tiers.json
node bin/writing-quality.js avoid-ai tiers-verify --file examples/article.md --context cn-explanatory --voice chinese-explanatory --report .writing/tiers.json
```

Optional `--tier3-threshold 0.05` overrides the document-level Tier 3 density threshold. English density uses English word tokens; Chinese density uses Han characters, **not segmented Chinese words**. These metrics are not directly comparable. Tier 2 flags two or more matching occurrences in a paragraph; this is not yet a distinct-term cluster metric. The Tier 1/2/3 lexicon is a deliberately selected **subset** of the supplied editorial reference, not a complete transcription. Current voice selection is validated and recorded, but does **not** yet alter severity or tolerance; avoid relying on it for voice-specific enforcement. Quoted blocks, fenced code, and inline code are excluded using the existing conservative Markdown scanner. Findings require editorial review and are not proof of AI authorship. In particular, uncertainty qualifiers and attributions must not be mechanically removed.

**Implementation boundary:** The Tier 3 sliding-window rule, complete context tolerance matrix, safe rewrite mode, voice-dependent severity, and automatic final-gate integration are not implemented in v4.3.

## v4.4 — Context-aware Avoid AI Writing policy

The `avoid-ai tiers` command now resolves a deterministic policy from `--context` and `--voice`. The report includes the effective policy so editorial reviewers can see which thresholds were applied. These rules detect wording patterns, **not AI authorship**.

```bash
node bin/writing-quality.js avoid-ai tiers --file article.md --context cn-explanatory --voice chinese-explanatory --output .writing/tiers.json
node bin/writing-quality.js avoid-ai tiers --file article.md --context technical-blog --non-native-tolerance true --output .writing/tiers-technical.json
node bin/writing-quality.js avoid-ai tiers-verify --file article.md --context technical-blog --non-native-tolerance true --report .writing/tiers-technical.json
```

Context policies: `blog`, `cn-explanatory`, and `investor-email` use Tier 2 minimum 2, Tier 3 density >3%, and three repetitions of the same Tier 3 term in a 100-unit window. `technical-blog` and `docs` use Tier 2 minimum 3, Tier 3 density >5%, and four repetitions in 100 units. `casual` suppresses vocabulary findings. `--tier3-threshold` overrides density only. `--non-native-tolerance true` is an explicit opt-in: raises the density threshold to at least 5% and disables the Tier 3 sliding window. English units are words, Chinese units are Han characters. Markdown code fences and block quotations are excluded.

**Limitations:** Context and voice are recorded, but the voice profile currently changes guidance only; it does not implement a complete sentence rhythm or tone engine. The lexicon is a curated subset of the supplied Avoid AI Writing reference. Term matching does not recognize all proper nouns, legal terms, technical jargon, or grammatical contexts. The sliding-window rule is a heuristic and should not be treated as an authorship classifier. No automatic rewrite is performed; keep meaningful uncertainty qualifiers and source attributions.

## v4.5 — Avoid AI Writing controlled revision

The `avoid-ai plan` command converts configured editorial signals into byte-anchored, document-hash-bound tasks. A reviewer must provide a replacement, reviewer label, and rationale before `avoid-ai apply` can make a change. Rejected or pending tasks, or surviving signals, result in `INCOMPLETE` (exit code 4). Original files are not overwritten; output creation uses exclusive file creation.

```bash
node bin/writing-quality.js avoid-ai plan --file article.md --context cn-explanatory --voice chinese-explanatory --output .writing/ai-plan.json
node bin/writing-quality.js avoid-ai plan-verify --file article.md --plan .writing/ai-plan.json
node bin/writing-quality.js avoid-ai apply --file article.md --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json --protected .writing/protected-quotes.json --output revised.md --report .writing/ai-execution.json
node bin/writing-quality.js avoid-ai apply-verify --file article.md --after revised.md --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json --protected .writing/protected-quotes.json --report .writing/ai-execution.json
```

`ai-decisions.json` format: `{"planHash":"<plan.planHash>","items":[{"taskId":"ai-0001","action":"approve","replacementText":"specific text","reviewer":"editor","rationale":"reason"}]}`. `protected-quotes.json` is an array of exact, uniquely occurring strings. These checks are lexical, not semantic: the reviewer must separately validate factual claims, causal logic, attribution and forecast qualifiers. This workflow does **not** automatically connect to the unified final gate and does **not** grant publication approval.


## v4.6 — Claim-aware rewrite assurance

The new assurance layer recomputes the approved Avoid AI Writing patch and checks its exact output against the revised file. It requires a version-bound claims inventory and argument graph; missing inventories fail closed. Claim changes need explicit review, and every declared argument edge needs an editor decision. Rejected decisions block; pending reviews are incomplete. No automated semantic entailment or factual verification is claimed.

```bash
node bin/writing-quality.js avoid-ai assure --before draft.md --after revised.md --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json --claims .writing/claims.json --argument-graph .writing/graph.json --argument-review .writing/graph-review.json --output .writing/assurance.json
node bin/writing-quality.js avoid-ai assure-verify --before draft.md --after revised.md --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json --claims .writing/claims.json --argument-graph .writing/graph.json --argument-review .writing/graph-review.json --report .writing/assurance.json
```

Optional `--claim-review` and `--protected` files are supported. The unified `revision final-gate` additionally accepts `--rewrite-assurance-input` (a JSON object containing the complete inputs for recomputation). Omitting this optional input preserves legacy gate behavior and does **not** mean claim-aware rewrite assurance was performed.

## v4.7 — Rewrite Risk Audit

The deterministic rewrite-risk audit checks approved patch spans for changes in numbers and units, uncertainty qualifiers, causal language, source-attribution expressions, and dates. A detected change is a **review trigger**, not proof of factual error. No detected change is **not** proof of semantic preservation. Risk findings automatically make `avoid-ai assure` return `INCOMPLETE`.

```bash
node bin/writing-quality.js avoid-ai risk-audit \
  --before draft.md --after revised.md \
  --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json \
  --output .writing/risk-report.json

node bin/writing-quality.js avoid-ai risk-verify \
  --before draft.md --after revised.md \
  --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json \
  --report .writing/risk-report.json
```

Exit status `4` indicates `REVIEW_REQUIRED`. The detector does not authenticate reviewer identity, inspect external sources, or measure real-world false-positive rates. It audits the exact changed spans; contextual or unlisted entity changes can escape detection. In v4.7, risk findings cannot be overridden automatically by the revision executor. A human must resolve the issue outside this deterministic audit before publication.

## v4.8 — Rewrite-risk benchmark harness

A version-bound evaluation harness computes per-category and micro precision/recall for labeled edit pairs. The included `benchmarks/rewrite-risk/illustrative.json` contains **seven constructed examples**, not real financial articles and not independent annotations. Its scores only establish expected behavior on those cases. They must **never** be advertised as production accuracy or real-world false-positive rates.

```bash
node bin/writing-quality.js avoid-ai benchmark --dataset benchmarks/rewrite-risk/illustrative.json --output .writing/benchmark-report.json
node bin/writing-quality.js avoid-ai benchmark-verify --dataset benchmarks/rewrite-risk/illustrative.json --report .writing/benchmark-report.json
node bin/writing-quality.js avoid-ai benchmark --dataset benchmarks/rewrite-risk/illustrative.json --min-recall 0.9
```

The dataset must declare `provenance` as `synthetic` or `human-annotated`; the label is self-declared and not authenticated. Each case requires `id`, `before`, `targetQuote` (an exact Avoid AI revision task), `replacement`, and `expected` categories (`number`, `qualifier`, `causal`, `attribution`, `date`). An empty expected list denotes no expected lexical alert. The evaluator rebuilds the revision plan, applies the exact approved replacement, audits changed spans, and compares predicted categories to labels. It does not infer missing entity risks, audit full articles, or prove that the supplied labels are correct. Before citing any field performance, collect independently annotated real editorial revisions, adjudicate disagreements, and evaluate a held-out corpus.

## v4.9 — Editorial corpus: two-reviewer labels and adjudication

The editorial corpus workflow accepts **explicitly provided** cases, requires two distinct reviewers per case, and requires a third adjudicator when their labels disagree. It produces a dataset compatible with `avoid-ai benchmark`. Reviewer identifiers and source provenance are **not authenticated**. The included cases are constructed examples, **not real financial articles**; no empirical accuracy claim follows from these fixtures.

```bash
node bin/writing-quality.js avoid-ai corpus-prepare --cases benchmarks/editorial-corpus/cases.json --output .writing/corpus.json
node bin/writing-quality.js avoid-ai corpus-adjudicate --corpus .writing/corpus.json --reviews benchmarks/editorial-corpus/reviews.json --decisions benchmarks/editorial-corpus/decisions.json --output .writing/adjudicated.json
node bin/writing-quality.js avoid-ai corpus-verify --corpus .writing/corpus.json --reviews benchmarks/editorial-corpus/reviews.json --decisions benchmarks/editorial-corpus/decisions.json --report .writing/adjudicated.json
```

To benchmark the adjudicated labels, extract the `dataset` field from `.writing/adjudicated.json` into a standalone JSON file and run `avoid-ai benchmark --dataset <file>`. This is a **labeling protocol**, not proof of independent annotation or real-world detection performance. Additional lexical categories (entities, negation scope, percentage-point distinctions) remain unimplemented.

## v5.0 — Numerical Integrity Engine

The existing `avoid-ai risk-audit` and `avoid-ai assure` workflows now include additional deterministic change signals for: percentage points, percentages, currencies and amounts, relative periods (YoY/QoQ/MoM), negation, numeric ranges, and exchange-qualified tickers. Each finding identifies its approved edit task and requires editorial review. No automatic assertion of factual correctness or semantic equivalence is made.

```bash
node bin/writing-quality.js avoid-ai risk-audit --before draft.md --after revised.md --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json --output .writing/risk-report.json
```

**Limitations:** Detection compares approved edit spans, not the entire article. Named entities without exchange-qualified ticker formats are not comprehensively recognized. Mixed units, implicit scope, and grammatical negation require human review. These rules are not validated against an independent real-world editorial corpus. Risk report schema is now `5.0`; older reports must be regenerated before verification.

## v5.1 — Editor-declared structured financial fact contracts

`avoid-ai facts-audit` compares **editor-declared** facts as complete tuples: `entity`, `metric`, `value`, `unit`, `period`, `source`, and `condition`. A fact has a stable `id`, a `quote` occurring exactly once in the bound document, and a `tuple` containing all seven string fields. Inventories use `schemaVersion: "5.1"` and `documentHash` equal to the SHA-256 of the exact UTF-8 document. Changes, additions, and removals require explicit review; rejection blocks; missing review stays incomplete. Review entries require `id`, `action` (`accept` or `reject`), `reviewer`, and `rationale`.

```bash
node bin/writing-quality.js avoid-ai facts-audit --before draft.md --after revised.md --before-facts before-facts.json --after-facts after-facts.json --review fact-review.json --output fact-audit.json
node bin/writing-quality.js avoid-ai facts-verify --before draft.md --after revised.md --before-facts before-facts.json --after-facts after-facts.json --review fact-review.json --report fact-audit.json
```

**Critical limitations:** No extraction, named-entity recognition, source checking, identity verification, or semantic equivalence is implemented here. The tuple is supplied by an editor and is **not** checked against its quote. The same `id` must be used across revisions; omission or mislabeling can conceal errors. `READY_FOR_HUMAN_REVIEW` is not publication approval. This is an independent audit command and is **not yet** a mandatory input to `avoid-ai assure` or the unified release gate. This version has not been measured on independently annotated real financial articles.


## v5.2 — Fact Coverage Assurance (editor-attested)

`avoid-ai coverage-audit` compares the v5.1 registered financial fact inventories **and** reviews line-level coverage declarations. Its signal scanner flags candidate financial lines containing amounts, percentages, growth metrics, forecasts, and similar terms. Each signal line requires an editor attestation (`covered` or `no-financial-fact`). `covered` requires at least one inventory quote bound to that line; `no-financial-fact` conflicts with an already registered fact. Unreviewed signals and signals explicitly left without facts are `INCOMPLETE`; contradictions are `BLOCKED`.

```bash
node bin/writing-quality.js avoid-ai coverage-audit \
  --before examples/fact-coverage/before.md \
  --after examples/fact-coverage/after.md \
  --before-facts examples/fact-coverage/before-facts.json \
  --after-facts examples/fact-coverage/after-facts.json \
  --before-attestations examples/fact-coverage/before-attestations.json \
  --after-attestations examples/fact-coverage/after-attestations.json \
  --review examples/fact-coverage/review.json \
  --output .writing/fact-coverage.json

node bin/writing-quality.js avoid-ai coverage-verify \
  --before examples/fact-coverage/before.md \
  --after examples/fact-coverage/after.md \
  --before-facts examples/fact-coverage/before-facts.json \
  --after-facts examples/fact-coverage/after-facts.json \
  --before-attestations examples/fact-coverage/before-attestations.json \
  --after-attestations examples/fact-coverage/after-attestations.json \
  --review examples/fact-coverage/review.json \
  --report .writing/fact-coverage.json
```

`revision final-gate` optionally accepts `--fact-coverage-input coverage-input.json`, containing the complete `auditFactCoverage` input object, including `before` and `after` strings. When supplied, a blocked coverage audit blocks the final gate, and incomplete coverage keeps the gate incomplete. This is **optional** in v5.2 for backward compatibility, not a globally mandatory release condition.

**Boundaries:** The scanner is line-oriented and heuristic, not a full Markdown parser or a complete financial fact extractor. It may miss implicit financial facts, facts in tables, or unrecognized terminology. A `covered` declaration does not prove every fact in that line was registered. Human identities, fact values, and source truth are not independently verified. `READY_FOR_HUMAN_REVIEW` is not permission to publish.

## v5.3 — Granular Financial Fact Coverage

Unlike v5.2's line-level attestation, v5.3 emits **individual lexical candidates** for financial values, metrics, and growth terminology, including Markdown table cells. Each candidate must receive an explicit editorial decision. A `covered` decision must identify at least one registered fact whose unique source quote encloses that candidate's UTF-8 byte span. The alternative `no-financial-fact` requires reviewer and rationale; it is an editorial assertion, **not** automatic proof that the candidate is harmless.

```bash
writing-quality avoid-ai candidates --file draft.md --output .writing/candidates.json
writing-quality avoid-ai granular-audit \
  --before draft.md --after revised.md \
  --before-facts before-facts.json --after-facts after-facts.json \
  --before-candidate-attestations before-candidates-reviewed.json \
  --after-candidate-attestations after-candidates-reviewed.json \
  --review fact-review.json --output .writing/granular-report.json
writing-quality avoid-ai granular-verify \
  --before draft.md --after revised.md \
  --before-facts before-facts.json --after-facts after-facts.json \
  --before-candidate-attestations before-candidates-reviewed.json \
  --after-candidate-attestations after-candidates-reviewed.json \
  --review fact-review.json --report .writing/granular-report.json
```

Candidate attestation shape:

```json
{"candidateId":"c1","action":"covered","factIds":["revenue"],"reviewer":"editor","rationale":"Checked against the registered revenue fact"}
```

For an opt-in **mandatory** final-gate policy, use `revision final-gate --require-granular-coverage true --granular-fact-coverage-input inputs.json` (alongside all normal final-gate arguments). Missing granular inputs leave the gate `INCOMPLETE`. The report is recomputed from supplied inputs, not trusted by filename. Existing projects retain their previous behavior unless this option is enabled.

**Limits:** regex candidate coverage is not complete fact extraction. Cross-line relationships, inferred entities, semantic truth, and reviewer identity remain unverified. Dismissals can conceal genuine facts; editors remain accountable. `READY_FOR_HUMAN_REVIEW` is never publication authorization.


## v5.4 — Source excerpt traceability (implemented)

`avoid-ai evidence-audit` binds editor-declared structured facts to exact excerpts of editor-supplied source documents, including excerpts spanning multiple lines. Source text, exact excerpt and UTF-8 byte spans are hashed; missing evidence produces `INCOMPLETE`, and excerpts that omit the declared literal value produce `BLOCKED`. This **does not authenticate the source or prove the financial fact**.

```bash
node bin/writing-quality.js avoid-ai evidence-audit \
  --before examples/v54/before.md --after examples/v54/after.md \
  --before-facts examples/v54/before-facts.json --after-facts examples/v54/after-facts.json \
  --sources examples/v54/sources.json \
  --before-links examples/v54/before-links.json --after-links examples/v54/after-links.json \
  --review examples/v54/review.json --output examples/v54/report.json
node bin/writing-quality.js avoid-ai evidence-verify \
  --before examples/v54/before.md --after examples/v54/after.md \
  --before-facts examples/v54/before-facts.json --after-facts examples/v54/after-facts.json \
  --sources examples/v54/sources.json \
  --before-links examples/v54/before-links.json --after-links examples/v54/after-links.json \
  --review examples/v54/review.json --report examples/v54/report.json
```

Final gate supports `--fact-evidence-input inputs.json` and `--require-fact-evidence true`. The evidence input JSON uses the same keys as the library's `auditFactEvidence` arguments. Without the required input the gate stays `INCOMPLETE`.

Known limitations: no URL fetching, independent source authentication, entity/period semantic matching, or automatic reconciliation of cross-sentence relationships. The demo uses invented data for software testing, **not real financial evidence**.

## v5.5 — Source governance and period integrity

`avoid-ai source-audit` checks editor-declared source provenance metadata independently of the existing excerpt binding check. Source records can declare `kind` (`primary-filing`, `primary-official`, `secondary-report`, `editor-estimate`), `version`, `retrievedAt` (ISO date), optional `publishedAt`, `period`, and `supersedes`. The engine verifies **literal equality** between the fact tuple's `period` and the source's `period`, and between the tuple's `source` and source ID. It does not resolve accounting calendars, authenticate URLs, download documents, or verify the truth of a reported number.

```bash
node bin/writing-quality.js avoid-ai source-audit \
  --before-facts before-facts.json --after-facts after-facts.json \
  --sources sources.json --before-links before-links.json \
  --after-links after-links.json --require-primary true \
  --output source-report.json

node bin/writing-quality.js avoid-ai source-verify \
  --before-facts before-facts.json --after-facts after-facts.json \
  --sources sources.json --before-links before-links.json \
  --after-links after-links.json --require-primary true \
  --report source-report.json
```

Use `--require-source-governance true` with `avoid-ai evidence-audit` and `avoid-ai evidence-verify` to include these checks in the existing evidence audit. Existing final-gate evidence inputs can supply `sourceGovernancePolicy: {"requirePrimary": true}`. **Fail-closed adoption requires enabling the policy explicitly**; existing workflows remain backward compatible. A non-primary source under a primary-source policy is `INCOMPLETE` rather than proven false; period/source mismatches and impossible chronology are `BLOCKED`. Editor estimates require a `methodology` and `assumptions` string on each evidence link.

**Limitations:** classifications, versions, dates and review labels are editor-supplied; version strings are not checked against a remote registry; a matching period or value is not independent corroboration. The exact-period comparison can produce false alarms for synonymous fiscal-period notation. Real-world precision/recall is unmeasured.

## v5.6 — Source version graph and conflicting observations

`avoid-ai conflicts-audit` constructs a directed `supersedes` version graph and compares editor-declared source observations for **the same exact entity, metric, period, unit and condition**. Differing value strings are conflicts requiring a documented editorial resolution. It checks cycles, missing parents, cross-document version links and inverted publication chronology. A `correction` resolution must select an observation from a source whose version chain reaches another conflicting source; `methodology-change` requires before/after methodology descriptions. No automatic winner is chosen.

```bash
node bin/writing-quality.js avoid-ai conflicts-audit \
  --sources examples/source-conflicts/sources.json \
  --observations examples/source-conflicts/observations.json \
  --resolutions examples/source-conflicts/resolutions.json \
  --output .writing/conflicts.json

node bin/writing-quality.js avoid-ai conflicts-verify \
  --sources examples/source-conflicts/sources.json \
  --observations examples/source-conflicts/observations.json \
  --resolutions examples/source-conflicts/resolutions.json \
  --report .writing/conflicts.json
```

The sample intentionally produces `INCOMPLETE` and exit code 4: it contains a conflict without an editorial resolution. Obtain the conflict ID from the report before supplying a resolution. Resolution objects require `conflictId`, `reason` (`correction`, `methodology-change`, `unresolved`), `reviewer`, `rationale`, and for accepted resolutions `selectedObservationId`. Methodology changes also require `methodologyBefore` and `methodologyAfter`.

**Important:** v5.6 is a standalone audit; it is not yet a mandatory Final Gate input. Observations, metadata, version links and reviewers are self-declared. String equality does not normalize accounting definitions, currency scales, rounding, or fiscal calendars. A documented editorial selection is not independent verification of source authenticity or factual correctness.

## v5.7 — Evidence conflict release gate and accounting-scope isolation

The unified `revision final-gate` and `revision final-gate-verify` commands now accept:

```bash
--source-conflicts-input .writing/source-conflicts-input.json \
--require-source-conflicts true
```

The input is the **original conflict-audit input bundle**, not an existing report:

```json
{
  "sources": {"sources": [{"id":"filing-1","documentId":"issuer-q3","publishedAt":"2026-10-01"}]},
  "observations": [],
  "resolutions": []
}
```

Final Gate recomputes the conflict audit from this input. Missing mandatory input adds `SOURCE_CONFLICT_AUDIT_REQUIRED` (`INCOMPLETE`); unresolved or insufficiently scoped conflicts add `SOURCE_CONFLICT_AUDIT_INCOMPLETE`; invalid source/version relationships add `SOURCE_CONFLICT_AUDIT_BLOCKED`. `sourceConflictAuditHash` and `requireSourceConflicts` are included in the recomputable Final Gate report. The audit remains optional unless `--require-source-conflicts true` is set, for backward compatibility.

Conflict observations may now declare **three optional accounting-scope dimensions** inside `fact`: `accountingBasis` (e.g. `IFRS`), `consolidationScope` (e.g. `group`), and `measurementBasis` (e.g. `gross`). Observations with different declared scopes are *not* automatically compared as equivalent facts. If some observations declare a dimension and others omit it, `SCOPE_METADATA_INCOMPLETE` requires review. This is a conservative exact-string guard, not accounting ontology, FX conversion, IFRS/GAAP reconciliation, or proof of the declared metadata. For reliable comparison, explicitly supply all relevant scope dimensions for every observation.

The `avoid-ai conflicts-audit` and `avoid-ai conflicts-verify` CLI commands remain available. `v5.7` adds 12 automated tests for release-gate integration, tampering, and accounting scope. These are synthetic tests; no real-world editorial accuracy or source authenticity is claimed.

## v5.8 — Financial Metric Reconciliation

The deterministic `src/metric-reconciliation.js` audits **editor-declared** bridges between observations. Each observation must declare `entity`, `metric`, `period`, `unit`, `condition`, `accountingBasis`, `consolidationScope`, `measurementBasis`, and a decimal-string `value`. Each bridge binds `fromId`, `toId`, signed decimal-string `adjustments`, and a named reviewer and rationale. Every adjustment requires an `id`, `label`, `reason`, `evidenceId`, and `amount`. Missing scope/metric mapping rationale leaves the report `INCOMPLETE`; unsupported unit conversion, period/entity mismatch, or arithmetic mismatch makes it `BLOCKED`. Arithmetic is exact to six decimal places; there is **no automatic conversion** between currencies, accounting standards, or fiscal calendars.

```bash
node bin/writing-quality.js avoid-ai reconcile-audit \
  --observations examples/metric-reconciliation/observations.json \
  --bridges examples/metric-reconciliation/bridges.json \
  --output .writing/reconciliation.json

node bin/writing-quality.js avoid-ai reconcile-verify \
  --observations examples/metric-reconciliation/observations.json \
  --bridges examples/metric-reconciliation/bridges.json \
  --report .writing/reconciliation.json
```

`revision final-gate` and `revision final-gate-verify` accept `--metric-reconciliation-input .writing/metric-reconciliation-input.json --require-metric-reconciliation true`. The input JSON contains `{ "observations": [...], "bridges": [...] }`, not a precomputed report. The gate recomputes the audit and records its hash. Missing mandatory input is `INCOMPLETE`; a failed bridge is `BLOCKED`. This optional gate preserves existing integrations until explicitly enabled.

**Limits:** This verifies arithmetic and declared metadata only. Evidence IDs, reviewer names and adjustments are not independently authenticated. A balanced bridge is not evidence of valid accounting treatment. The included example is synthetic and must not be represented as a real financial filing.


## v5.9 — Reconciliation Evidence Assurance

The reconciliation bridge now has a separate, opt-in **evidence cross-reference audit**. The audit checks each adjustment's `evidenceId` against a unique evidence record, the declared source, its SHA-256 text hash, a verbatim quote, an exact adjustment amount, and editor-supplied entity/metric/period/unit fields. Missing references, stale hashes, and mismatched metadata fail closed; missing review metadata and unsupported literal numbers remain pending. These are deterministic checks **not independent accounting verification**.

```bash
node bin/writing-quality.js avoid-ai reconcile-evidence-audit \
  --observations examples/metric-reconciliation/observations.json \
  --bridges examples/metric-reconciliation/bridges.json \
  --sources examples/reconciliation-evidence/sources.json \
  --evidence examples/reconciliation-evidence/evidence.json \
  --output .writing/reconciliation-evidence.json

node bin/writing-quality.js avoid-ai reconcile-evidence-verify \
  --observations examples/metric-reconciliation/observations.json \
  --bridges examples/metric-reconciliation/bridges.json \
  --sources examples/reconciliation-evidence/sources.json \
  --evidence examples/reconciliation-evidence/evidence.json \
  --report .writing/reconciliation-evidence.json
```

The unified `revision final-gate` supports `--reconciliation-evidence-input <json>` and `--require-reconciliation-evidence true`. The JSON input has `observations`, `bridges`, `sources`, and `evidence` arrays. When both the existing metric reconciliation input and the evidence input are present, their observation and bridge payloads must match exactly. A passing audit remains `READY_FOR_HUMAN_REVIEW`, **not publication approval**. Source contents and reviewer identities are not authenticated. Numerical presence in a quote does not establish causal or accounting support.

## v6.0 — Local Source Artifact Integrity

The `snapshot-audit` command compares **local source file bytes** with SHA-256 digests supplied in a manifest. Missing files and mismatched bytes produce `BLOCKED`. Paths must stay within the configured root, including after resolving symlinks. The report contains actual hashes, byte counts and a deterministic report hash. `snapshot-verify` recomputes the report against the **current** files.

Example manifest (`source-manifest.json`):

```json
[
  {"id":"annual-report-2026","path":"annual-report.pdf","expectedSha256":"<64 lowercase hex digits from the original file>"}
]
```

```bash
node bin/writing-quality.js avoid-ai snapshot-audit \
  --root ./source-documents \
  --manifest ./source-manifest.json \
  --output .writing/source-snapshots.json

node bin/writing-quality.js avoid-ai snapshot-verify \
  --root ./source-documents \
  --manifest ./source-manifest.json \
  --report .writing/source-snapshots.json
```

Create the original digest from a separately obtained, trusted file: `sha256sum source-documents/annual-report.pdf` (Linux). The digest in the manifest is **editor supplied**. A compromised source and a correspondingly changed manifest can both pass. The tool does not fetch official filings, validate signatures, identify publishers, prove freshness or verify accounting facts. This is an independently usable artifact integrity layer, **not yet wired into Final Gate**.

## v6.1 — Explicit HTTPS Acquisition & Provenance

This release adds `src/source-acquisition.js` and the `avoid-ai source-fetch` / `source-fetch-verify` commands. Downloads are opt-in: the caller supplies an explicit HTTPS host allowlist, a single URL, a destination relative to the source root, a byte limit, and a timeout. The fetcher resolves the host and pins the connection to one public DNS address, rejects private/loopback/reserved IP results, refuses HTTP redirects, and uses exclusive destination-file creation. It never silently overwrites an existing pinned source.

Create an empty local directory for source files, and an `entry.json`:

```json
{"id":"issuer-filing-2026","url":"https://reports.example.org/filing.pdf","path":"filings/filing.pdf"}
```

`reports.example.org` is an **illustrative placeholder**, not an asserted official disclosure source. Replace it with a verified publisher host and an actual document URL.

```bash
mkdir -p source-documents
node bin/writing-quality.js avoid-ai source-fetch \
  --root source-documents \
  --entry entry.json \
  --allow-hosts reports.example.org \
  --max-bytes 10000000 \
  --timeout-ms 15000 \
  --output .writing/acquisition-record.json

node bin/writing-quality.js avoid-ai source-fetch-verify \
  --root source-documents \
  --record .writing/acquisition-record.json \
  --allow-hosts reports.example.org
```

The resulting record includes `schemaVersion`, `id`, `url`, `host`, `path`, `sha256`, `bytes`, `contentType`, `retrievedAt`, `httpStatus`, `verification`, and `recordHash`. `source-fetch-verify` validates the record hash and rehashes the local bytes. The record's time is local wall-clock time, not a trusted timestamp. The verifier does not re-fetch the URL or authenticate the publisher. Domain ownership, TLS issuance, issuer identity, source authenticity, filing currency, PDF signatures, and semantic financial claims remain outside this release. Use independent source confirmation before treating any filing as authoritative. This module is not yet wired into the unified Final Gate.

## v6.2 — Acquisition-to-Evidence Chain

This release adds a deterministic audit from a v6.1 acquisition record to an exact UTF-8 excerpt and editor-declared fact ID. It **does not** authenticate publishers, establish source credibility, verify accounting meaning, or prove that every claim has been covered.

Input `records.json` is an array of records produced by `avoid-ai source-fetch`; `links.json` is an array of objects with `id`, `recordId`, `factId`, `quote`, `startByte`, `endByte`, `reviewer`, `rationale`, and optional `literalValue`. Offsets are **byte offsets in the original downloaded file**. For now, exact text spans are supported for UTF-8 text documents; PDF binary extraction and source-layout mapping are not supported.

```bash
node bin/writing-quality.js avoid-ai chain-audit \
  --root ./source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --output .writing/chain-report.json
node bin/writing-quality.js avoid-ai chain-verify \
  --root ./source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --report .writing/chain-report.json
```

The audit rechecks the acquisition record and local SHA-256, checks exact quote bytes, and binds the excerpt to the declared fact ID. Source changes or invalid spans block the audit. A `READY_FOR_HUMAN_REVIEW` result is **not** publication authorization. The final release gate is not yet integrated with this asynchronous file-based check.

## v6.3 — Evidence Chain Release Enforcement

The release chain verifies an **editor-declared inventory of critical facts**, not every fact automatically. For each `requiredFacts` entry, provide a unique `id`, a substantive `reason`, and `reviewer`. Every critical fact must have a verified acquired-source excerpt binding to the same `factId`. Undeclared bindings and missing critical-fact links remain `INCOMPLETE`; invalid source bytes or excerpts cause `BLOCKED`.

```bash
node bin/writing-quality.js avoid-ai chain-release \
  --root ./source-documents \
  --records records.json --links links.json \
  --required-facts critical-facts.json \
  --allow-hosts reports.example.org \
  --output .writing/chain-release.json

node bin/writing-quality.js avoid-ai chain-release-verify \
  --root ./source-documents \
  --records records.json --links links.json \
  --required-facts critical-facts.json \
  --allow-hosts reports.example.org \
  --report .writing/chain-release.json
```

In the existing `revision final-gate` command, append `--require-evidence-chain true --evidence-chain-input evidence-chain-input.json`. The input JSON object must include `root`, `records`, `links`, `allowedHosts`, and `requiredFacts`; the gate **recomputes** the chain rather than trusting a prior report. `revision final-gate-verify` recomputes both the gate and its chain. The legacy synchronous `evaluateFinalGate` API remains unchanged; use the async `evaluateFinalGateWithEvidenceChain` API for this extension.

**Limits:** A declared inventory may omit material claims. Source excerpts are literal evidence, not semantic proof; reviewer identity and publisher authenticity are not independently verified. `READY_FOR_HUMAN_REVIEW` does not authorize publication.

## v6.4 — Claim-to-Evidence Review (deterministic, not semantic entailment)

The `avoid-ai claim-evidence-audit` command compares six **editor-declared** claim fields (`entity`, `metric`, `value`, `unit`, `period`, `condition`) with corresponding **editor-declared** evidence fields, after re-verifying the acquisition record and exact UTF-8 excerpt. Evidence-field values must appear literally in the verified excerpt. A separate reviewer decision (`APPROVE` or `REJECT`) with reviewer and rationale is required for each claim.

```bash
node bin/writing-quality.js avoid-ai claim-evidence-audit \
  --root source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --claims claims.json \
  --reviews reviews.json --output .writing/claim-evidence.json

node bin/writing-quality.js avoid-ai claim-evidence-verify \
  --root source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --claims claims.json \
  --reviews reviews.json --report .writing/claim-evidence.json
```

`claims.json` is an array of `{id,linkId,fields,evidenceFields}`. Both field objects must provide nonempty strings for all six fields. `reviews.json` is an array of `{claimId,decision,reviewer,rationale}`. Missing reviews or mismatched fields produce `INCOMPLETE`; rejected reviews and unverified or incorrectly bound source excerpts produce `BLOCKED`. The CLI uses exit code 4 for incomplete, 1 for blocked.

**Boundary:** Exact string matching does not establish semantic entailment, negation scope, accounting equivalence, or factual truth. Source identity and reviewer identity are not authenticated. This v6.4 command is **not yet a mandatory Final Gate check**.


## v6.5 — Inference Review & Release Gate

`avoid-ai inference-audit` combines the verified claim-to-evidence chain with an explicitly declared inference inventory. Every inference has a `claimId`, `statement`, `evidenceRationale`, and three scope declarations (`negationScope`, `causalDirection`, `forecastConditions`). Each scope declaration has `{ "applicable": true|false, "explanation": "..." }`. An independent review record contains `inferenceId`, `reviewer`, `rationale`, `decision` (`APPROVE` or `REJECT`), and each dimension as `CHECKED` or `NOT_APPLICABLE`. The audit rejects duplicate or unknown identifiers and mismatched scope declarations. Missing reviews are `INCOMPLETE`; explicit rejection or invalid source binding is `BLOCKED`. These statuses **do not prove semantic entailment or factual truth**.

```bash
node bin/writing-quality.js avoid-ai inference-audit \
  --root ./source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --claims claims.json --reviews claim-reviews.json \
  --inferences inferences.json --inference-reviews inference-reviews.json \
  --output .writing/inference-report.json

node bin/writing-quality.js avoid-ai inference-verify \
  --root ./source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --claims claims.json --reviews claim-reviews.json \
  --inferences inferences.json --inference-reviews inference-reviews.json \
  --report .writing/inference-report.json
```

Enable the gate using `revision final-gate --require-inference-review true --inference-review-input inference-input.json` (in addition to the existing required final-gate inputs). The input JSON uses the same keys as the `auditInferenceReview` function, including `root`, `records`, `links`, `allowedHosts`, `claims`, `reviews`, `inferences`, and `inferenceReviews`. The gate **recomputes** the audit and never trusts a precomputed report. Missing mandatory inputs yield `INCOMPLETE`; rejected inferences yield `BLOCKED`. Legacy gates remain optional for backwards compatibility. Reviewer identities and inference validity are not independently authenticated.

## v6.6 — Inference Dependency Graph & Release Gate

`avoid-ai dependencies-audit` validates a **reviewer-declared** directed acyclic graph of inference premises. `dependencies.json` is an array of `{ "inferenceId": "forecast", "premises": [{"type":"claim","id":"revenue"},{"type":"inference","id":"growth"}] }`. Every inference must have a declaration with at least one premise. Every referenced claim/inference must exist, duplicate premises and nodes are rejected, and direct or indirect cycles are rejected. An unreviewed upstream inference propagates `INCOMPLETE` to downstream inferences; rejected inference/source evidence yields `BLOCKED`. The audit never claims logical validity or automatically discovers implicit premises.

```bash
node bin/writing-quality.js avoid-ai dependencies-audit \
  --root source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --claims claims.json \
  --reviews claim-reviews.json --inferences inferences.json \
  --inference-reviews inference-reviews.json --dependencies dependencies.json \
  --output .writing/dependencies-report.json

node bin/writing-quality.js avoid-ai dependencies-verify \
  --root source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --claims claims.json \
  --reviews claim-reviews.json --inferences inferences.json \
  --inference-reviews inference-reviews.json --dependencies dependencies.json \
  --report .writing/dependencies-report.json
```

The existing `revision final-gate` accepts `--require-inference-dependencies true --inference-dependencies-input inference-dependencies-input.json` (alongside its existing required inputs). The input JSON includes the fields accepted by `auditInferenceReview` plus `dependencies`. The gate recomputes the audit instead of trusting a saved report. `INCOMPLETE` returns exit code 4, `BLOCKED` returns exit code 1. **Limitations:** declared graph completeness, evidence support, reviewer identity and inference soundness are not independently verified.


## v6.7 — Counterargument & Falsification Engine

The deterministic `avoid-ai counterarguments-audit` command extends the v6.6 inference dependency audit. Every declared inference must have at least one competing explanation (`alternatives`) and at least one observable falsification condition (`falsifiers`). Each item requires an explicit human review. `UNRESOLVED` and missing reviews produce `INCOMPLETE`; `REJECTED` produces `BLOCKED`. This does **not** automatically prove or disprove any inference.

Example input fragment (`counterarguments.json`):

```json
[{"inferenceId":"a","alternatives":[{"id":"alt","explanation":"Growth may reflect price rather than volume","discriminatingEvidence":"Unit shipments"}],"falsifiers":[{"id":"fals","condition":"Shipments contract","observable":"Quarterly unit volume","consequence":"Reconsider growth thesis"}]}]
```

Example review (`counterargument-reviews.json`):

```json
[{"inferenceId":"a","reviewer":"editor","rationale":"Reviewed unit shipments","decision":"APPROVE","alternativeReviews":[{"id":"alt","decision":"CONSIDERED","rationale":"Compared volumes"}],"falsifierReviews":[{"id":"fals","decision":"CONSIDERED","rationale":"Reviewed latest volume data"}]}]
```

Both files must cover all declared inferences. Use the same `--root`, `--records`, `--links`, `--allow-hosts`, `--claims`, `--reviews`, `--inferences`, `--inference-reviews`, and `--dependencies` options as `avoid-ai dependencies-audit`:

```bash
node bin/writing-quality.js avoid-ai counterarguments-audit \
  --root source-documents --records records.json --links links.json \
  --allow-hosts reports.example.org --claims claims.json --inferences inferences.json \
  --dependencies dependencies.json --counterarguments counterarguments.json \
  --counterargument-reviews counterargument-reviews.json --output counterargument-report.json
```

Recompute with `avoid-ai counterarguments-verify` and the same inputs plus `--report counterargument-report.json`. Final Gate supports `--require-counterarguments true --counterargument-input counterargument-input.json`, where the JSON input combines the upstream audit inputs with `counterarguments` and `counterargumentReviews`. The gate re-audits the inputs rather than trusting a precomputed report.

Limitations: the editorial inventory may omit important alternative explanations; reviewer identity is not authenticated; `CONSIDERED` is not evidence that the explanation was refuted; no automatic semantic entailment or independent source validation is claimed.

## v6.8 — Writing craft rules (no book names in the executable contract)

The writing-craft layer makes narrative and editorial principles actionable as **review questions, evidence requests, failure criteria, and minimal repair instructions**. It does **not** turn subjective writing quality into an automatic score. Its rule pack is `rules/craft-contract.json`, and the runtime is `src/craft-contract.js`.

Three distinct profiles prevent forcing fictional plot beats onto factual commentary: `fiction`, `narrative-nonfiction`, and `analytical-nonfiction`. The analytical profile checks paragraph progression, evidence boundaries, counterexamples, reader value, and sentence craft. The fiction profile checks scene change, viewpoint, character decisions, narrative pace, and dialogue alongside sentence craft.

```bash
node bin/writing-quality.js craft prepare --file article.md --profile analytical-nonfiction --output .writing/craft-plan.json
# Fill craft-reviews.json with explicit ruleId, decision (PASS/NEEDS_REVISION/NOT_APPLICABLE),
# reviewer, rationale, and for applicable checks an exact quote plus a concrete observation.
node bin/writing-quality.js craft audit --file article.md --plan .writing/craft-plan.json --reviews craft-reviews.json --output .writing/craft-report.json
node bin/writing-quality.js craft verify --file article.md --plan .writing/craft-plan.json --reviews craft-reviews.json --report .writing/craft-report.json
```

`INCOMPLETE` exits with code 4 and `NEEDS_REVISION` with code 1. `REVIEW_COMPLETE` confirms recorded reviews only, **not** objective literary merit or fact checking. A review must use a quote that exists in the submitted document. Document hash and rule-pack hash are pinned; changed documents or rules invalidate old plans. This layer does not yet integrate into the final release gate; run it alongside existing integrity checks.

The rules are original operational abstractions, not reproduced exercises or quotations. The rule pack intentionally contains no book names or author names.

## v6.9 — Craft-Guided Writing Workflow

This release introduces an **editorial workflow**, not a text generator. The same original craft rules are applied during intent, outline, draft, structure, line editing, and release review. The fiction profile does not impose its narrative structure on analytical nonfiction. Each stage is bound to the exact document SHA-256 and the rule pack; changing the text requires a new plan and new reviews. Later stages cannot be completed while their predecessor is pending or requires revision.

```bash
node bin/writing-quality.js craft workflow-prepare --file article.md --profile analytical-nonfiction --brief brief.json --output workflow-plan.json
node bin/writing-quality.js craft workflow-audit --file article.md --plan workflow-plan.json --reviews workflow-reviews.json --output workflow-report.json
node bin/writing-quality.js craft workflow-verify --file article.md --plan workflow-plan.json --reviews workflow-reviews.json --report workflow-report.json
```

`brief.json` is a JSON object with editorial goals such as `audience`, `question`, and `intendedReaderGain`. A review is a JSON array of stage decisions: `{ "stage":"intent", "decision":"PASS", "reviewer":"editor", "rationale":"...", "quote":"exact excerpt", "observation":"...", "ruleChecks":[] }`. Each `ruleChecks` item must identify the applicable `ruleId`, `decision` (`PASS`, `NEEDS_REVISION`, `NOT_APPLICABLE`) and `rationale`; `NOT_APPLICABLE` also requires `notApplicableReason`. All six stages must be reviewed to obtain `REVIEW_COMPLETE`. This status records review completeness, **not independently proven writing quality or fact verification**.

The source craft principles are translated into original operational questions. The rule pack and CLI do not reference book titles or authors. No automatic writing, semantic judgment, or Final Gate enforcement is claimed for v6.9.

## v7.0 — Craft-Guided Drafting & Revision

This version converts the craft rules into six **actionable, profile-specific writing assignments** and a revision preservation audit. Rule files do not cite books or authors. It does **not** generate prose or claim that a completed review establishes literary quality.

Prepare a brief (`brief.json`):

```json
{"audience":"investors","centralQuestion":"Why can revenue grow while margin falls?","intendedInsight":"Separate revenue growth from cost and mix effects"}
```

```bash
node bin/writing-quality.js craft draft-prepare --file article.md --profile analytical-nonfiction --brief brief.json --output drafting-plan.json
node bin/writing-quality.js craft draft-verify --file article.md --plan drafting-plan.json
node bin/writing-quality.js craft revision-audit --file article.md --after revised.md --plan drafting-plan.json --reviews revision-reviews.json --output revision-report.json
node bin/writing-quality.js craft revision-verify --file article.md --after revised.md --plan drafting-plan.json --reviews revision-reviews.json --report revision-report.json
```

`revision-reviews.json` contains an array with one record per stage (`intent`, `outline`, `draft`, `structure`, `line`, `release`), each with `stage`, `decision` (`APPROVED` or `REJECTED`), `reviewer`, and `rationale`. This is an editorial review record, **not** authenticated approval.

The revision audit records exact changes to number-like tokens, negation, uncertainty, and attribution expressions. Any such change remains `INCOMPLETE` pending separate semantic and factual integrity checks, even when all six stages are approved. An explicit rejection returns `BLOCKED`. `READY_FOR_HUMAN_RELEASE_REVIEW` does not authorize publication. Lexical checks are intentionally incomplete and may miss changed meaning without changed markers; use the existing fact, evidence and Final Gate workflows for material claims.

## v7.1 — Paragraph-level editorial review

The paragraph engine turns the craft principles into paragraph-specific, document-hash-bound editorial tasks. It does **not** generate or silently apply replacement prose. A review must identify a contribution, transition, preservation boundary, rationale and reviewer. `REVISE` requires `proposedText`; `REMOVE` requires `removalJustification`. Both remain `INCOMPLETE` pending a separate revision process.

```bash
node bin/writing-quality.js craft paragraph-prepare --file article.md --profile analytical-nonfiction --output paragraph-plan.json
node bin/writing-quality.js craft paragraph-verify --file article.md --plan paragraph-plan.json
node bin/writing-quality.js craft paragraph-audit --file article.md --plan paragraph-plan.json --reviews paragraph-reviews.json --output paragraph-report.json
node bin/writing-quality.js craft paragraph-audit-verify --file article.md --plan paragraph-plan.json --reviews paragraph-reviews.json --report paragraph-report.json
```

`paragraph-reviews.json` is an array of `{ "id": "p-1", "decision": "KEEP", "reviewer": "editor", "rationale": "...", "contribution": "...", "transition": "...", "preservation": "..." }` records, one per paragraph. `REVIEW_COMPLETE` means only that all identified paragraphs were reviewed as `KEEP`, not that their quality or truth has been independently established. The splitter is heuristic and does not fully parse Markdown code blocks, nested blockquotes, or tables. A clean report is not a release authorization.

## v7.2 — Paragraph-level controlled revision

This release adds a deterministic, **human-approved** paragraph patch workflow. It does not generate prose or certify semantic equivalence. Proposed edits are bound to the source SHA-256 and UTF-8 byte ranges. Changes to numeric, negation, uncertainty, or attribution signals fail closed; paragraph deletion requires a separate integrity process. All applied changes still require independent fact and release review.

```bash
node bin/writing-quality.js craft paragraph-prepare --file article.md --output plan.json
node bin/writing-quality.js craft paragraph-propose --file article.md --plan plan.json --reviews reviews.json --output proposals.json
node bin/writing-quality.js craft paragraph-apply --file article.md --plan plan.json --reviews reviews.json --proposal proposals.json --decisions decisions.json --after revised.md --output execution.json
node bin/writing-quality.js craft paragraph-apply-verify --file article.md --plan plan.json --reviews reviews.json --proposal proposals.json --decisions decisions.json --report execution.json
```

`reviews.json` is an array of paragraph review records (`id`, `decision`, `reviewer`, `rationale`, `contribution`, `transition`, `preservation`, and `proposedText` for `REVISE`). `decisions.json` contains records such as `{"id":"p-1","decision":"APPROVE","reviewer":"editor-2","rationale":"Checked against source"}`. An `APPROVE` decision is required before applying each proposal. Rejections or pending proposals yield `INCOMPLETE` and exit code 4. This is **not** a substitute for final release approval.

## v7.3 — Paragraph Revision Impact & Regression

`craft impact-audit` consumes the **original** paragraph plan, editorial reviews, execution proposal, explicit approval decisions, and optional editor-declared dependency links. It recomputes the applied revision and marks modified paragraphs, their immediate neighbors, and downstream paragraphs reachable through declared links as requiring recheck. It does **not** infer semantic dependencies.

```bash
node bin/writing-quality.js craft impact-audit \
  --file article.md --plan paragraph-plan.json --reviews paragraph-reviews.json \
  --proposal proposals.json --decisions decisions.json --links editorial-links.json \
  --output impact.json
node bin/writing-quality.js craft impact-verify \
  --file article.md --plan paragraph-plan.json --reviews paragraph-reviews.json \
  --proposal proposals.json --decisions decisions.json --links editorial-links.json \
  --impact impact.json
node bin/writing-quality.js craft impact-review \
  --file article.md --plan paragraph-plan.json --reviews paragraph-reviews.json \
  --proposal proposals.json --decisions decisions.json --links editorial-links.json \
  --impact impact.json --checks impact-checks.json --output impact-review.json
```

`editorial-links.json` is an array of directed `{ "from":"p-1", "to":"p-3", "kind":"argument" }` records. Supported kinds: `argument`, `evidence`, `conclusion`, `transition`. Direction means the destination depends on the source. `impact-checks.json` is an array of `{ "id":"p-3", "decision":"APPROVE", "reviewer":"editor-id", "rationale":"...", "afterHash":"<impact.afterHash>" }`. `REJECT` blocks review; missing checks remain incomplete. `craft impact-review-verify` recomputes the review. `READY_FOR_INDEPENDENT_RELEASE_REVIEW` is **not** permission to publish.

Limitations: link coverage depends on human declaration; adjacent invalidation is conservative; no semantic equivalence, source truth, or automatic final release guarantee. The v7.3 impact gate is a separate workflow, not yet mandatory in `revision final-gate`.

## v7.4 — Structure Regression & Release Enforcement

`craft structure-audit` compares original and revised paragraph inventories. It detects exact normalized duplicate paragraphs, validates editor-declared directional links, and requires an explicit reviewer decision for every revised paragraph. It does **not** infer semantic redundancy or logical entailment.

```bash
node bin/writing-quality.js craft structure-audit \
  --before article.md --after revised.md --profile analytical-nonfiction \
  --links revised-links.json --checks structure-checks.json \
  --output structure-report.json
node bin/writing-quality.js craft structure-verify \
  --before article.md --after revised.md --profile analytical-nonfiction \
  --links revised-links.json --checks structure-checks.json \
  --report structure-report.json
```

`structure-checks.json` is an array of `{ "id":"p-1", "decision":"PASS", "reviewer":"editor-id", "rationale":"Verified the transition and unique contribution", "afterHash":"<SHA-256 of revised.md>" }`. Use `FAIL` to reject. All paragraphs require explicit checks; absence is `INCOMPLETE`. Repeated normalized paragraph content (35 or more characters) or a failed check is `BLOCKED`.

`revision final-gate` now accepts `--require-craft-impact true --craft-impact-input impact-input.json` and `--require-structure-regression true --structure-regression-input structure-input.json`. `impact-input.json` must contain `before`, `plan`, `reviews`, `proposal`, `decisions`, `links`, `impact`, and `checks`; the gate **recomputes** the impact review and verifies that the before/after hashes match the release documents. `structure-input.json` contains `profile`, `links`, and `checks` and is re-evaluated against the release documents. Missing required inputs are `INCOMPLETE`, and rejected or invalid reviews cannot be silently treated as approved. The flags remain opt-in for compatibility.

No automated check proves an argument is sound, that all dependencies are registered, or that a text is ready to publish. An independent final editorial review remains necessary.

## v7.5 — Editorial Coherence & Information Gain

The coherence contract records **human-reviewed** paragraph contributions and their declared dependencies. It does not infer semantic novelty or prove an argument.

```bash
node bin/writing-quality.js craft coherence-prepare --file article.md --output coherence-plan.json
node bin/writing-quality.js craft coherence-audit --file article.md --plan coherence-plan.json --entries coherence-entries.json --output coherence-report.json
node bin/writing-quality.js craft coherence-verify --file article.md --plan coherence-plan.json --entries coherence-entries.json --report coherence-report.json
```

Each entry requires `id`, `type` (`FACT`, `MECHANISM`, `INFERENCE`, `COUNTERARGUMENT`, `RESPONSE`, `CONCLUSION`, or `NARRATIVE_CHANGE`), `contributionId`, `contribution`, `quote` (an exact substring of its paragraph), `dependsOn` (array of paragraph IDs), `reviewer`, `rationale`, and `decision` (`PASS` or `FAIL`). A conclusion must declare at least one dependency. A response must reference a counterargument entry. Duplicate contribution IDs are blocked; missing reviews remain incomplete. All reports bind to the exact document hash and can be recomputed.

Final Gate options: `--require-coherence true --coherence-input coherence-input.json`. The input JSON must contain `plan` and `entries`; it is audited against the **after** document. The release gate remains subject to independent editorial and factual review. Declared contributions and dependencies are not independently verified facts.

## v7.6 — Evidence-Bound Editorial Reasoning

The editorial evidence gate maps each paragraph to explicit claims, source excerpts, reasoning dependencies, and human review. It **does not** authenticate sources, prove semantic entailment, or automatically verify the factual correctness of a claim. Rule text is independent of book titles and author names.

```bash
writing-quality craft evidence-prepare --file article.md --profile analytical-nonfiction --output evidence-plan.json
writing-quality craft evidence-audit --file article.md --plan evidence-plan.json --records evidence-records.json --output evidence-report.json
writing-quality craft evidence-verify --file article.md --plan evidence-plan.json --records evidence-records.json --report evidence-report.json
```

`evidence-records.json` requires four arrays:

- `sources`: `{id, locator, excerpt, retrievedAt, contentHash}` where `contentHash` is SHA-256 of the **exact UTF-8 excerpt**.
- `claims`: `{id, paragraphId, type, quote, interpretation, dependsOn?}`; reasoning claims (`INFERENCE`, `MECHANISM`, `RESPONSE`, `CONCLUSION`) must declare dependencies on other claim IDs.
- `links`: `{id, claimId, sourceId, kind, excerptQuote, reasoning}`; `kind` is `SUPPORTS`, `CONTRADICTS`, or `QUALIFIES`.
- `reviews`: `{claimId, reviewer, rationale, decision}`; decision is `APPROVE` or `REJECT`.

When a claim has a `CONTRADICTS` link, the claim must include a nonempty `conflictResolution` to avoid a blocking finding. Every paragraph must map to at least one claim. Every claim needs a supporting link and review. Inference dependencies must reference known claims. An approval records an editorial decision; it does not authenticate reviewer identity or evidence quality.

For the existing `revision final-gate` command, add `--require-evidence-bound true --evidence-bound-input evidence-bound-input.json` where the input JSON contains `{ "plan": ..., "records": ... }`. The gate recomputes the evidence audit against the final document and fails closed for blocked or incomplete evidence.

Status meanings: `BLOCKED` = invalidated evidence, unresolved contradiction or explicit rejection; `INCOMPLETE` = missing links, dependencies or reviews; `READY_FOR_INDEPENDENT_RELEASE_REVIEW` = declarations are internally consistent, not a claim of factual truth.

## v7.7 — Pinned source provenance for craft evidence

Use `craft source-provenance-audit` to bind v7.6 claim evidence to actual local UTF-8 source bytes. The manifest is an array of `{ "id": "s1", "path": "source.txt", "sha256": "<64 hex chars>" }`; the ID must match `records.sources[].id`. The SHA-256 is calculated from the complete **file bytes**, not the excerpt. All paths are relative to `--root` and must stay within that directory, including resolved symlinks.

```sh
node bin/writing-quality.js craft source-provenance-audit \
  --file article.md --plan evidence-plan.json --records evidence-records.json \
  --root ./sources --manifest source-pins.json --output source-provenance-report.json

node bin/writing-quality.js craft source-provenance-verify \
  --file article.md --plan evidence-plan.json --records evidence-records.json \
  --root ./sources --manifest source-pins.json \
  --report source-provenance-report.json
```

Optional `--acquisitions acquisition-records.json --allowed-hosts example.org,example.com` verifies existing source-acquisition records against local pinned bytes. This is **not** a network fetch. `BLOCKED` exits 1, `INCOMPLETE` exits 4, and ready exits 0. Binary PDFs require an independently extracted, pinned UTF-8 text file. Neither a matching hash nor an acquisition record authenticates the publisher or proves the claim. This standalone audit is **not yet wired into the unified Final Gate**.

## v7.8 — Source Change Impact & Release Gate

A source snapshot change invalidates all registered claims directly citing that source and all claims transitively depending on those claims. It does **not** claim semantic comprehension or verify publisher authenticity.

```bash
node bin/writing-quality.js craft source-change-audit \
  --file article.md --plan evidence-plan.json --records evidence-records.json \
  --root ./sources --baseline source-pins-before.json \
  --current source-pins-after.json --reviews source-change-reviews.json \
  --output source-change-report.json

node bin/writing-quality.js craft source-change-verify \
  --file article.md --plan evidence-plan.json --records evidence-records.json \
  --root ./sources --baseline source-pins-before.json \
  --current source-pins-after.json --reviews source-change-reviews.json \
  --report source-change-report.json
```

The review file is an array of `{ "claimId": "c1", "decision": "RECHECKED", "reviewer": "Editor", "rationale": "Compared changed source with the claim", "documentHash": "<sha256-of-document>", "baselineManifestHash": "<sha256-of-JSON-stringified-baseline-array>", "currentManifestHash": "<sha256-of-JSON-stringified-current-array>" }`. Use `REJECT` to block. If no source changed, an empty review array is permitted. An absent review for an impacted claim produces `INCOMPLETE` (exit 4); stale, rejected, or invalid evidence produces `BLOCKED` (exit 1). Current pinned source bytes must exist under `--root` and pass v7.7 provenance checks.

To enforce at the unified revision release gate, add:

```bash
--require-source-change true --source-change-input source-change-input.json
```

`source-change-input.json` contains `plan`, `records`, `root`, `baseline`, `current`, and optionally `reviews`, `acquisitions`, and `allowedHosts`. The release gate supplies the final article text and re-computes the impact audit. The resulting release status remains subject to every other enabled gate. This feature is opt-in for backward compatibility.

**Scope:** Registered dependencies only; the engine cannot discover undeclared source relationships, establish a publisher's identity, or guarantee that an unchanged source remains accurate.

## v7.9 — Editorial Dependency Discovery & Coverage

The local-first `craft coverage-*` commands discover **lexical review candidates**, not verified claims. Numeric expressions, causal language, certainty markers and attribution phrases are attached to paragraph hashes and exact quotations. Each candidate requires a reviewer decision (`LINK`, `NOT_A_CLAIM`, or `NEEDS_SOURCE`). `LINK` must reference a registered, source-supported claim in the same paragraph containing the candidate quote. Missing decisions or sources fail closed. The audit also flags unsupported registered claims and registered reasoning cycles. The report can be independently recomputed.

```bash
node bin/writing-quality.js craft coverage-prepare --file article.md --output coverage-plan.json
node bin/writing-quality.js craft coverage-audit --file article.md --plan coverage-plan.json --records evidence-records.json --decisions coverage-decisions.json --output coverage-report.json
node bin/writing-quality.js craft coverage-verify --file article.md --plan coverage-plan.json --records evidence-records.json --decisions coverage-decisions.json --report coverage-report.json
```

A decision record is `{ "candidateId": "candidate-1", "decision": "LINK", "claimId": "c1", "reviewer": "Editor", "rationale": "This phrase belongs to the source-supported revenue claim" }`. For nonclaims use `NOT_A_CLAIM` with a rationale; unresolved candidates use `NEEDS_SOURCE` and keep the audit incomplete. Optional final gate flags: `--require-dependency-coverage true --dependency-coverage-input coverage-input.json`, where the input contains `plan`, `records`, and `decisions`.

**Scope:** Regex candidate detection has false positives and false negatives; it cannot discover every implied claim, authenticate source truth, or prove entailment. A reviewer can dismiss a real claim; the tool records that decision but cannot certify its correctness. `READY_FOR_INDEPENDENT_RELEASE_REVIEW` is not a publication approval.

## v8.0 Unified Editorial Pipeline

Run one manifest-driven audit instead of manually chaining independent CLI commands. The pipeline recomputes selected stage audits against the same document, shares evidence records between evidence and coverage, checks prerequisite ordering, detects mismatched supplied reports, and emits a single version-bound report. It does **not** certify factual truth, semantic quality, or publication approval.

Example `editorial-pipeline.json`:

```json
{
  "profile": "analytical-nonfiction",
  "required": ["evidence", "coverage", "coherence"],
  "stages": {
    "evidence": {"records": {"sources": [], "claims": [], "links": [], "reviews": []}},
    "coverage": {"decisions": []},
    "coherence": {"entries": []}
  }
}
```

```bash
node bin/writing-quality.js craft pipeline-audit --file article.md --manifest editorial-pipeline.json --output editorial-pipeline-report.json
node bin/writing-quality.js craft pipeline-verify --file article.md --manifest editorial-pipeline.json --report editorial-pipeline-report.json
```

Supported stages: `workflow`, `evidence`, `coverage` (requires `evidence`), `coherence`, `structure` (requires `coherence` and `--before baseline.md`). Omitted required stages are not silently waived. Stage input failures block the pipeline; missing review work remains incomplete. A minimal manifest with an empty `required` list is an empty audit, **not** a release gate. Exit codes: 0 ready, 1 blocked, 4 incomplete. This is a workflow-level aggregator, not yet an integration with the legacy `revision final-gate` command.

## v8.1 — Unified Release Decision

`craft release-audit` provides one fail-closed decision for the v8.0 pipeline and, optionally, the legacy revision Final Gate. It recomputes both gates rather than trusting a supplied status. It does **not** automatically publish an article.

Example `editorial-release.json`:

```json
{
  "profile": "analytical-nonfiction",
  "required": ["evidence", "coverage", "coherence"],
  "stages": {"evidence": {"records": {}}, "coverage": {"decisions": []}, "coherence": {"entries": []}},
  "requireLegacy": false
}
```

```bash
node bin/writing-quality.js craft release-audit --file article.md --manifest editorial-release.json --output release-report.json
node bin/writing-quality.js craft release-verify --file article.md --manifest editorial-release.json --report release-report.json
```

To enforce the legacy revision gate, set `"requireLegacy": true`, include a complete `"legacy"` input object in the manifest, and supply `--before baseline.md`. Its `before` and `after` fields must match the exact baseline and current document. Missing or mismatched inputs fail closed. Statuses: `BLOCKED`, `INCOMPLETE`, or `READY_FOR_INDEPENDENT_RELEASE_REVIEW` (never automatic publication). `blockers` and `pending` identify the originating gate. This version does not implement incremental recomputation or semantic dependency inference.

## v8.2 — Incremental Audit Planning (fail-closed)

The incremental planner fingerprints the current document, stage inputs, editorial profile, and declared stage dependencies. A prior cache record is **only a hint** about unchanged inputs: it cannot authorize publication. Every required audit is recomputed before a release decision, including on cache hits. This is a safe prerequisite for future incremental execution, **not** a performance acceleration claim.

```bash
node bin/writing-quality.js craft incremental-audit --file article.md --manifest editorial-release.json --output incremental-report.json --cache-output incremental-cache.json
node bin/writing-quality.js craft incremental-audit --file article.md --manifest editorial-release.json --previous incremental-cache.json --output incremental-next.json
node bin/writing-quality.js craft incremental-verify --file article.md --manifest editorial-release.json --previous incremental-cache.json --report incremental-next.json
```

`--before baseline.md` is required when the selected stages include `structure`. The manifest must provide `required` and `stages`, with the same structure as the unified pipeline manifest. The output exposes `changed`, `reusable`, `recomputed`, and `reusedForRelease`. `reusedForRelease` is always empty by design. A changed document or stage input invalidates its fingerprint; changes to a dependency invalidate downstream fingerprints. A malformed or tampered cache is rejected as a reuse hint. The release gate remains `craft release-audit`.

## v8.3 — Authenticated incremental execution

The `craft incremental-execute` command can **actually skip unchanged stages** when a previously saved cache is authenticated using a local HMAC-SHA256 secret. The cache is bound to document text, stage inputs, declared dependencies, and a fingerprint of the editorial engine source files. Cache misses or invalid signatures trigger recomputation. This optimization **does not authorize publication**: use `craft release-audit` (full recomputation) as the release authority.

Create a local secret file (at least 32 UTF-8 bytes), keep it outside the repository, and restrict its file permissions. Never commit the secret or share it with untrusted cache producers. For example:

```bash
node -e "require('node:fs').writeFileSync('.editorial-cache-secret',require('node:crypto').randomBytes(32).toString('hex'),{mode:0o600})"
node bin/writing-quality.js craft incremental-execute --file article.md --manifest editorial-release.json --secret-file .editorial-cache-secret --output run1.json --cache-output local-cache.json --compare-full true
node bin/writing-quality.js craft incremental-execute --file article.md --manifest editorial-release.json --secret-file .editorial-cache-secret --previous local-cache.json --output run2.json --compare-full true
```

The `executed` and `reused` arrays distinguish actual execution from authenticated reuse. `--compare-full true` recomputes all stages and rejects a mismatch; it is an explicit parity check, **not a performance optimization**. The engine fingerprint covers the listed local engine modules, not arbitrary external packages or environmental changes. Cache reuse is appropriate only in a trusted local environment. The final release gate still recomputes all required checks.


## v8.4 — Editorial CI & Reproducibility Assurance

The GitHub Actions workflow `.github/workflows/editorial-assurance.yml` runs the complete test suite, then verifies full/incremental parity, authenticated cache reuse, document-change invalidation, and wrong-key invalidation. It uploads a machine-readable evidence JSON artifact. The example deliberately has no human editorial approvals, so `INCOMPLETE` (exit 4) is expected and **does not constitute release approval**. The CI workflow explicitly checks for that state; parity failures, cache security failures, or unexpected states fail the job.

```bash
node scripts/editorial-ci.js --file examples/ci/article.md --manifest examples/ci/manifest.json --output editorial-assurance.json
```

Use your own article and editorial manifest to check a real project. Do not commit cache secrets. CI generates an ephemeral signing secret, which is never written to the evidence artifact. The evidence contains document and manifest hashes, stage names, release decision, and four verification outcomes; it is a reproducibility record, not a source-authenticity certificate. The workflow uses a pinned Node major version and action major versions, not immutable action SHAs; strict supply-chain reproducibility requires further pinning and provenance checks.


## v8.5 Editorial CI diagnostics

`node scripts/editorial-diagnostics.js --file examples/ci/article.md --manifest examples/ci/manifest.json --output editorial-diagnostics.json --markdown editorial-diagnostics.md --github true`

Diagnostics are derived from recomputed unified-pipeline reports, not AI-inferred facts. GitHub Actions emits annotations and a job summary; the JSON artifact retains codes, stages, severity and remediation hints. Use `--verify previous-diagnostics.json` to reject stale or altered reports. Exit codes: 0 for pipeline ready for independent review, 4 incomplete, 1 blocked, 2 invalid invocation. Annotations are document-level unless an upstream verified location exists; no invented line numbers. This diagnostic status does not replace the independent release gate.


## v8.6 — Editorial Repair Planning & Verification

Convert reproducible editorial diagnostics into version-bound repair tasks. A repair is not closed merely because an editor claims it was fixed: the current audit must no longer report the original issue, and a reviewer must supply a repair description and evidence. Newly introduced issues remain visible. This is not independent factual verification or release authorization.

```bash
node scripts/editorial-repair.js prepare --baseline editorial-diagnostics.json --output repair-plan.json
node scripts/editorial-repair.js audit --baseline editorial-diagnostics.json --plan repair-plan.json --decisions repair-decisions.json --file article.md --manifest editorial-release.json --output repair-report.json
node scripts/editorial-repair.js verify --baseline editorial-diagnostics.json --plan repair-plan.json --decisions repair-decisions.json --file article.md --manifest editorial-release.json --report repair-report.json
```

`repair-decisions.json` is an array of objects containing `taskId`, `decision` (`CLOSE`, `DEFER`, `REJECT`) and, for `CLOSE`, `reviewer`, `description`, and `evidence`. The report statuses are `BLOCKED`, `INCOMPLETE`, and `READY_FOR_INDEPENDENT_RELEASE_REVIEW`. Task identity is based on registered diagnostic codes and messages; changed diagnostic wording can appear as a newly introduced issue. CLI exit codes: 0 ready, 4 incomplete, 1 blocked, 2 invalid invocation.

## v8.7 — Repair Impact & Acceptance

The repair acceptance engine combines the existing diagnostic repair audit with paragraph-level change detection, conservative adjacent-paragraph invalidation, and editor-declared dependency propagation. Every affected paragraph needs a reviewer decision tied to the exact revised document and paragraph hash. An unresolved repair, rejected impact, or incomplete optional release review cannot be silently accepted. This is **not** automatic semantic dependency discovery.

```bash
node scripts/editorial-repair-acceptance.js audit \
  --baseline editorial-diagnostics.json --plan repair-plan.json \
  --decisions repair-decisions.json --before original.md --file revised.md \
  --manifest editorial-release.json --links editorial-links.json \
  --checks impact-checks.json --output acceptance-report.json
node scripts/editorial-repair-acceptance.js verify \
  --baseline editorial-diagnostics.json --plan repair-plan.json \
  --decisions repair-decisions.json --before original.md --file revised.md \
  --manifest editorial-release.json --links editorial-links.json \
  --checks impact-checks.json --report acceptance-report.json
```

`editorial-links.json` is an array of `{ "from": 1, "to": 3, "kind": "conclusion" }`, using **1-based paragraph numbers in the revised document**. Kinds: `argument`, `evidence`, `conclusion`, `transition`. `impact-checks.json` is an array of `{ "paragraph": 1, "decision": "APPROVE", "afterHash": "<SHA256 of full revised UTF-8 text>", "paragraphHash": "<SHA256 of trimmed revised paragraph>", "reviewer": "Editor", "rationale": "Checked the transition and supporting evidence" }`. `REJECT` blocks acceptance; missing checks remain incomplete. To independently require the unified release gate, provide `--release release-config.json` containing an object accepted by the unified release evaluator; the final status then includes its result. Without `--release`, the report is only **ready for independent release review**, not publication authorization.

This version uses exact paragraph matching (longest common subsequence), not a Markdown AST or semantic model. Complex Markdown, paragraph reordering, and unregistered relationships require manual review. Very large documents can make the quadratic paragraph comparison expensive. `audit` exits 0 when ready for independent release review, 4 when incomplete, 1 when blocked, and 2 on invalid inputs.


## v8.8 — Editorial Acceptance Regression Suite

Use a curated, version-controlled suite to detect changes in editorial release decisions and paragraph impact results. Each fixture specifies its expected status, diagnostic codes or exact changed/affected paragraph indices. The runner recomputes release reports, checks deterministic output, and rejects stale reports after document mutation. It does **not** establish semantic correctness, and the fixture set is not a statistical measure of false positives or false negatives.

```bash
npm run editorial:regression
node scripts/editorial-regression.js run --suite benchmarks/acceptance/cases.json --output regression-report.json
node scripts/editorial-regression.js verify --suite benchmarks/acceptance/cases.json --report regression-report.json
```

GitHub Actions runs this suite before reproducibility checks. Add independently reviewed real-world examples to `benchmarks/acceptance/cases.json` with explicit expected results; changes to expectations require editorial approval. The suite currently tests known regression cases, not all possible writing errors.

## v8.9 — Editorial benchmark and error taxonomy

Run a **labeled** evaluation of the existing release diagnostics, keeping ground-truth labels separate from detector outputs:

```bash
npm run editorial:benchmark
node scripts/editorial-benchmark.js verify --dataset benchmarks/editorial/synthetic.example.json --report editorial-benchmark.json
```

The dataset uses `ISSUE` and `NO_ISSUE` labels, explicit categories (`evidence`, `coherence`, `structure`, `release`, `other`), provenance (`synthetic`, `real-consented`, `real-redacted`), rationale, and annotator. Real-world entries require a consent reference, redaction review, annotation date, and guideline version. Do not put private source material in public fixtures without authorization.

The report records TP/FP/TN/FN/abstentions, precision, recall, specificity, accuracy, coverage, and category/origin slices. Undefined denominators are `null`, never silently interpreted as perfect performance. `verify` recomputes results and rejects altered reports. Diagnostic code expectations are tracked separately from the binary ground truth.

**Evidence limitation:** bundled examples are synthetic, not a representative or independently annotated real-world sample. The benchmark does **not** establish a production accuracy rate. Here `ISSUE` means an editorial release gate did not pass; it does not prove that the article contains a factual error. Real performance claims require a pre-registered sampling protocol, independently labeled cases, disagreement adjudication, and a held-out test split.

## v9.0 — Editorial Evaluation Protocol & Calibration

The evaluation protocol adds independent dual annotations, explicit disagreement adjudication, group-separated development/holdout splits, and conservative threshold reporting to the v8.9 benchmark. The example remains **synthetic-only**, and therefore **does not qualify as real-world calibration**. It intentionally exits with status 4 (`NOT_CALIBRATED`).

```bash
node scripts/editorial-evaluation.js run \
  --dataset benchmarks/editorial/synthetic.example.json \
  --protocol benchmarks/editorial/evaluation-protocol.example.json \
  --output editorial-evaluation.json
node scripts/editorial-evaluation.js verify \
  --dataset benchmarks/editorial/synthetic.example.json \
  --protocol benchmarks/editorial/evaluation-protocol.example.json \
  --report editorial-evaluation.json
```

Each case needs two distinct annotators with explicit labels and rationales. Disagreements require a third independent adjudicator. A shared `groupId` cannot cross development and holdout partitions. Real-world provenance and consent metadata are still declared by the submitter and not independently authenticated. Thresholds are descriptive acceptance criteria, not statistical proof; repeated tuning on the holdout invalidates its independence. The report deliberately withholds calibration when real cases or both classes are absent.

## v9.1 — Real Editorial Case Intake & Blind Annotation

The collection CLI supports consent/redaction metadata, two independently assigned reviewers, blinded reviewer packets, disagreement adjudication by a third person, and a frozen export compatible with the v8.9 benchmark and v9.0 evaluation protocol. **No real cases are bundled or represented as independently validated.** Consent and redaction declarations are supplied by the operator; the tool does not inspect or certify permissions or privacy.

```bash
node scripts/editorial-cases.js init --output private/registry.json
node scripts/editorial-cases.js add --registry private/registry.json --case private/case.json --output private/registry.json
node scripts/editorial-cases.js assignments --registry private/registry.json --reviewer reviewer-a --output private/packet-a.json
node scripts/editorial-cases.js annotate --registry private/registry.json --case-id case_one --annotation private/annotation-a.json --output private/registry.json
node scripts/editorial-cases.js status --registry private/registry.json
node scripts/editorial-cases.js freeze --registry private/registry.json --reviewer lead-editor --at 2026-11-20T10:00:00Z --output private/frozen.json
node scripts/editorial-cases.js verify --registry private/registry.json --frozen private/frozen.json
```

For a new case, use `examples/editorial-case.example.json` as the schema reference. The `assignments` command intentionally excludes peer annotations and gold labels. `freeze` refuses incomplete or unresolved cases and exports both `dataset` and `protocol` for the existing evaluation tools. Keep the registry and reviewer packets in access-controlled storage; do not commit private material or consent records to a public repository. The freeze hash is a consistency checksum, **not** a digital signature or an immutable timestamp. Holdout independence and real-world performance still require external governance and representative samples.

## v9.2 — Annotation Quality & Sampling Governance

The governance audit checks the *composition and consistency* of an editorial case registry before calibration. It detects duplicate evaluation inputs, underrepresented development/holdout splits, missing positive/negative labels, category gaps, insufficient independent paired reviews, unresolved disagreements, and low observed inter-reviewer agreement. It reports Cohen's kappa only when mathematically defined. Thresholds are explicit and configurable, not universal evidence of statistical sufficiency.

```bash
node scripts/editorial-governance.js audit \
  --registry private/registry.json \
  --policy benchmarks/editorial/governance-policy.example.json \
  --output private/governance-report.json
node scripts/editorial-governance.js verify \
  --registry private/registry.json \
  --policy benchmarks/editorial/governance-policy.example.json \
  --report private/governance-report.json
```

The example policy is illustrative. The empty example registry intentionally returns `NOT_READY` (exit code 4). A `READY_FOR_EVALUATION` result is **not** a claim of real-world accuracy, representative sampling, independently verified consent, or unbiased annotation. Do not commit sensitive case material, consent records, or private annotations to public Git repositories. The existing freeze and evaluation commands remain separate; governance does not silently override them.


## v9.3 — Annotation Bias & Dataset Leakage Audit

Use `node scripts/editorial-bias.js audit --registry private/registry.json --policy benchmarks/editorial/bias-policy.example.json --output private/bias-report.json`. Verify with `node scripts/editorial-bias.js verify --registry private/registry.json --policy benchmarks/editorial/bias-policy.example.json --report private/bias-report.json`.

The audit identifies lexical near-duplicates across development/holdout, plus reviewer positive-rate disparities measured only on shared cases. It reports explicit uncertainty: token Jaccard cannot detect all semantic paraphrases, and reviewer disagreement alone does not establish bias. Thresholds are operator-defined; sample coverage and independent validation remain necessary. Do not publish raw private case text in CI artifacts.

## v9.4 — Unified Dataset Qualification Gate

`editorial-qualification` combines the v9.2 sample/annotation governance audit and the v9.3 near-duplicate/reviewer-disparity audit into a single **fail-closed** decision. `NOT_READY` means missing coverage, empty registry, identical inputs, cross-split leakage, or a rejected risk. `REVIEW_REQUIRED` means a reviewable same-split near-duplicate or reviewer-rate disparity is unresolved. `QUALIFIED` means **only** that configured checks passed; it does not establish representative sampling, verified consent, or editorial detection accuracy.

```bash
node scripts/editorial-qualification.js audit \
  --registry private/registry.json \
  --governance-policy benchmarks/editorial/governance-policy.example.json \
  --bias-policy benchmarks/editorial/bias-policy.example.json \
  --output private/qualification.json
node scripts/editorial-qualification.js verify \
  --registry private/registry.json \
  --governance-policy benchmarks/editorial/governance-policy.example.json \
  --bias-policy benchmarks/editorial/bias-policy.example.json \
  --report private/qualification.json
```

An optional `--decisions private/decisions.json` file has the shape `{"reviewDecisions":[{"code":"NEAR_DUPLICATE_SAMPLE","detail":"<exact issue detail>","reviewer":"lead-editor","rationale":"<documented rationale of at least 12 characters>","disposition":"accepted-risk"}]}`. Review decisions must exactly match an existing reviewable issue; cross-split leakage and governance failures cannot be waived. The exit code is 4 unless `QUALIFIED`. Recompute verification rejects altered reports, policies, or registries. Treat reviewer decisions as operator declarations, not independently authenticated attestations.
