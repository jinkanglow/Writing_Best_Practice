---
name: writing-best-practices
description: Diagnose, plan, fuse, and revise fiction or nonfiction with evidence-aware writing contracts and explicit verification boundaries.
---
# Writing Best Practices

Use when asked to write, edit, critique, combine writing skills, or preserve meaning during revision.

1. Identify task, audience, genre, non-negotiable facts, mandatory scenes or claims, and stylistic constraints.
2. Keep structural requirements separate from language restrictions; identify conflicts before drafting.
3. For fiction, track character knowledge, motivations, decisions, consequences, point of view, and scene purpose.
4. For nonfiction, distinguish reported facts, calculations, inference, predictions, and opinion. Never invent supporting evidence.
5. Treat anti-slop expressions as review candidates, not automatic evidence of poor writing.
6. Make local edits first; preserve the author's thesis, narrative state, factual claims, and required anchors.
7. If CLI is available, run the deterministic checks and report exactly what they cover.
8. Do not claim semantic verification, source checking, full fusion translation, or quality assurance unless those steps actually occurred.

## Skill fusion trigger

Recognize requests such as “融合这两个技能”, “skill融合”, “把X规范应用到Y故事里”. Primary skill defines what must happen; constraint skill governs how it is expressed. Do not silently drop either. If constraints cannot be reconciled, explain the conflict.

For actual fusion, read [`references/fusion-protocol.md`](references/fusion-protocol.md) and [`references/fusion-anti-slop.md`](references/fusion-anti-slop.md) **before drafting**. Follow the decomposed anchor/constraint ledgers, conflict decisions, concrete scene translations, transition reviews and dual closure checks. See [`docs/FUSION-WORKFLOW.md`](docs/FUSION-WORKFLOW.md). A completed machine-checkable fusion plan only means `READY_FOR_SEMANTIC_REVIEW`; it does not certify narrative quality.

## Output

Provide the requested writing or diagnosis, followed by material unresolved issues and the actual verification status. Never overwrite originals without approval.

## Executable contracts (v1.6)

A skill may contain one fenced `writing-contract` JSON block. Only its explicit
requirements can be compiled by the CLI. Natural-language prose is guidance,
not automatically verified machine instructions.

Run `node bin/writing-quality.js skill validate path/to/SKILL.md` to validate.
Run `node bin/writing-quality.js fuse-skills --primary primary.md --constraint constraint.md`
to detect direct conflicts across overlapping explicit scopes. A `BLOCKED`
result must be reported, not silently resolved. Semantic fusion remains manual.

For approved local edits, use `patch batch` with a JSON array of version-locked
patch proposals. Do not claim semantic preservation without independent review.

## v1.7 natural-language candidate extraction

When a source skill has no explicit machine contract, run `node bin/writing-quality.js skill extract path/to/SKILL.md --output .writing/candidates.json` to generate **review candidates**. Present candidate text and source lines for human confirmation. Never promote extracted obligations or inferred scope into enforceable rules without explicit review. The extraction is keyword-based and may miss implicit instructions or include false positives. Markdown checks exclude basic inline code and code blocks but are not a complete CommonMark implementation.

## v1.8 contract verification

When a user asks to enforce a skill, distinguish machine-verifiable literal
checks from semantic requirements. Run `skill extract` to propose candidate
requirements, require explicit approval before `skill compile-reviewed`, then
run `verify-contract` against the actual draft. Do not claim `PASS` when the
result is `INCOMPLETE`, and do not interpret a literal match as proof of
character development, factual accuracy, narrative causality or quality.

## Semantic review workflow (v1.9)

When a requirement needs semantic interpretation, use `check.kind: semantic_review`.
Run `evidence prepare` to create a document-and-contract-hash-locked review file.
Do not mark a semantic requirement PASS from keyword matching. A human reviewer
must supply a decision and an exact source quote. `evidence verify` validates
the review record and citation location, not the truth of the review judgment.
Never claim automated literary or factual validation from this workflow.

## v2.0 semantic review and revision safeguards

Use `semantic prepare` to create version-locked, evidence-linked review tasks for requirements with `check.kind: semantic_review`. The reviewer must explicitly supply a decision, identity, and exact source quotation. Run `semantic verify` after review; `REVIEW_COMPLETE` means the review record is internally valid, **not** that its conclusion or the source material is true. Use `preserve verify` for byte-exact protected spans before accepting patch batches. Never represent either operation as automated semantic equivalence or external fact-checking.

## v2.1 evaluation boundary

Use `writing-quality benchmark evaluate <labels.jsonl>` only when gold labels and predictions already exist. Never describe the sample benchmark as a model evaluation or substitute its results for external reader studies. Report coverage alongside recall because the evaluator excludes abstentions from decided-case confusion counts. Do not claim semantic validation merely because the benchmark CLI completes.

## v2.2 semantic exchange

Use `provider prepare` to create an offline request, and `provider verify` to validate an externally supplied response. Never represent model decisions as independently verified facts. A valid quote proves text presence, not claim truth. Use `benchmark provenance` to distinguish synthetic fixtures from declared human labels.


## Optional local semantic review (v2.4)

Only invoke `provider local` when the user explicitly enables a local endpoint and model. Treat the model output as untrusted analysis; never equate an evidence-matched quote with a verified claim or high writing quality. If the local server is unavailable, report the review as incomplete rather than fabricating results. See README.md for the exact command.


## Independent evaluation workflow (v2.4)

When evaluating semantic detection, keep gold annotations separate from model predictions. Prepare cases, gather independent human annotations, adjudicate unresolved disagreements, then join predictions by exact case ID and text hash. Do not present synthetic fixtures as human evidence. Commands and formats are documented in README.md.

## v2.5 review quality gate

Before reporting semantic benchmark performance, resolve every disagreement explicitly using a reviewer ID distinct from original annotators, preserve the initial labels and adjudication rationale, and run `benchmark error-audit` against the complete adjudicated cases. Treat abstentions separately from false negatives. Do not interpret self-declared reviewer IDs as verified human independence, or matched quotations as verified claims.

## v2.6 revision preservation

Before rewriting substantive material, capture exact source anchors for thesis, facts, causal links and character state in an `anchors.json` array. After rewriting, run `revision audit`. Treat `REVIEW_REQUIRED` as unresolved; do not interpret literal disappearance as a semantic contradiction. For changed anchors, require explicit reviewer approval bound to both draft hashes with a grounded revised quotation. Run `revision review`. Do not claim semantic equivalence or factual verification from this process.

## v2.7 Revision drift benchmark

For any claim that revisions preserve thesis, facts, causal links or character states, create independently reviewed before/after cases. Use `revision drift-prepare` to export tasks without gold labels, and `revision drift-evaluate` to score external predictions. Treat missing predictions as abstentions. Do not infer semantic validity from quote presence or synthetic benchmarks. Preserve raw cases, hashes, per-category errors and adjudication provenance.

### v2.8 Release gate

Before recommending publication, run `writing-quality revision gate --before original.md --after revised.md --anchors anchors.json` and include reviewed decisions for changed protected anchors. Optional contract reports must be tied to the revised document hash. Treat `READY_FOR_HUMAN_RELEASE` as a handoff to an authorized editor, never as proof of semantic preservation or authorization to auto-publish. Do not omit inconvenient anchors to pass the gate.

## v2.9 Release Evidence

Use `revision coverage` to compare a manually prepared assertion inventory against protected anchors. Do not infer that passing this check means all important assertions were captured. Use `revision bundle` to package original and revised drafts with audit decisions and gate output. Use `revision bundle-verify` to check bundle integrity. Treat `READY_FOR_HUMAN_RELEASE` as a human review handoff, never as permission for automatic publication. Bundle contents may include confidential manuscripts.

## v3.0 deterministic workflow

For a revision, prefer `writing-quality workflow run --before ORIGINAL --after REVISED --anchors ANCHORS.json --inventory INVENTORY.json --output .writing/workflow.json`. Add `--decisions` for reviewed protected changes and `--contract-report` when available. Inspect each stage and preserve `BLOCKED` and `INCOMPLETE` as fail-closed outcomes. Run `writing-quality workflow verify --report .writing/workflow.json` to check stored integrity. `READY_FOR_HUMAN_RELEASE` requires a human publishing decision. Do not claim automatic semantic fidelity, fact-checking, or model-based drafting from this workflow.

## v3.1 Revision planning execution contract

When a user requests revisions, first run `revision plan` on the original. Present tasks with source evidence and scope. Never treat a proposed task as permission to rewrite. Collect explicit `approve`/`reject` decisions and replacement text. Run `revision execute` to create a separate output file. Any `INCOMPLETE`, protected-content collision, stale hash or conflicting edit must stop automatic advancement. After execution, run the existing revision audit and release gate; `REVIEW_REQUIRED` is not release approval. Never claim the engine has checked semantic equivalence.

### v3.2 Post-revision acceptance

For approved revision plans, run `revision accept` with the original document, immutable plan, human decisions, and configured deterministic rules. Optionally supply both primary and constraint skill contracts and declared protected anchors. A new error finding blocks release; new non-error findings, pending decisions, or unverifiable requirements require review. Never present `READY_FOR_HUMAN_REVIEW` as automatic publication authorization. Preserve the original and keep the generated report. Validate a completed draft/report pair using `revision accept-verify`.

## v3.3: contextual style and revision regressions

When reviewing AI-sounding prose, use `style inspect` as an editorial triage tool only. Do not assert that stock phrases, em dashes, or repeated sentence openings prove AI authorship. Retain meaningful uncertainty, attribution, domain-specific terminology and factual qualifiers. For multi-patch revisions, use `revision attribute` to surface single-patch counterfactual regressions, and require human review when patch interactions could change meaning. See `references/style-signal-policy.md`.

## v3.4 Editorial Safety Contract

Before revising high-stakes prose, inventory the exact source spans containing uncertainty qualifiers, attribution, risk disclosures, technical terms, core claims, causal links, and character states. Run `revision safety-audit` after revision and treat `INCOMPLETE` as a mandatory human-review state. Verify the report with `revision safety-verify` against the exact source and revised files. Do not infer that exact quotation retention proves semantic fidelity; this mechanism checks only declared textual anchors.

### v3.5 — Fail-closed editorial safety release

Before accepting a revision, require a declared editorial safety inventory and run `revision safety-gate`. Any changed or duplicated protected quote requires an explicit reviewer decision bound to the original and revised document hashes and inventory hash. Reject decisions block release. Missing decisions leave the release incomplete. A human-approved change remains a judgment, not a proof of factual or semantic correctness. Use `revision safety-gate-verify` to recompute a saved report. Do not silently auto-approve, auto-publish, or infer completeness of the supplied inventory.

### v3.6 final editorial gate

Run `revision final-gate` before release with original and revised manuscripts, anchors, editorial inventory, original revision plan, approved plan decisions, revision acceptance report, and both primary and constraint skill contracts. The gate independently recomputes acceptance and editorial checks and fails closed for missing skills or unverified requirements. Never equate `READY_FOR_HUMAN_RELEASE` with permission to publish or a semantic equivalence guarantee. See README v3.6 for exact CLI flags.


### v3.7: Trace every approved revision

After a revision plan and explicit decisions are available, use `revision trace` to inspect task dispositions and introduced deterministic findings. Use `revision trace-verify` with the actual revised file before trusting the report. A disappeared phrase is not evidence that the underlying rhetorical or factual problem was fixed; require editorial review for such conclusions.

### v3.8 Claim-Level Revision Integrity

When a draft has material claims, register each exact claim quote, category, and source document SHA-256 before editing. Run `revision claims-audit` on the revised draft. Treat `REVIEW_REQUIRED` as incomplete, `REJECTED` as blocked, and `APPROVED_CHANGE` only as permission to proceed to human review. Never claim that `TEXT_PRESENT` proves contextual semantic equivalence or that editorial approval proves factual accuracy. See README v3.8 for the machine-readable inventory and review contract.

## v3.9 — Argument relation integrity

For material revisions, explicitly declare graph nodes (source quotes) and edges (supports, qualifies, causes, contradicts, attributed_to). Run `revision graph-audit` and require editorial decisions for each edge. Use `revision graph-verify` to recompute and detect report tampering. Supply `--argument-graph` and optionally `--argument-review` to `revision final-gate` along with `--claims` where available. Do not infer semantic preservation from quote presence, or present a human approval as external fact verification.

### v4.0 graph extraction protocol

Run `graph prepare` on the original document, provide an explicit proposal of source-grounded nodes and edges, then run `graph validate`. Never treat quote existence as proof of a causal or evidentiary relationship. Require explicit reviewer decisions through `graph approve` before passing the resulting `graph` to the revision audit. A missing or rejected relation must not silently pass. Avoid claiming automated argument extraction: this version only prepares candidate quotations and validates externally supplied proposals.

### v4.1 Graph evidence positions

For graph extraction, preserve exact `span.startByte`, `span.endByte` and `span.quoteHash` from the current UTF-8 document. Never invent positions or silently choose an occurrence when a quote is duplicated. Treat a valid byte span as evidence that a quote exists at a location, not as evidence that a proposed claim or causal relation is true. Proposals and graph relations still require editorial review.

## v4.2 Avoid AI Writing integration

Use `avoid-ai detect --file <draft> --context cn-explanatory` to identify review-only stylistic patterns, and `avoid-ai verify` to recompute a report. Never classify authorship from style signals. Preserve meaningful uncertainty (可能), numerical caveats, source attribution, quotations, established terminology, and genuine contrast. The primary writing skill determines structure and author intent; Avoid AI Writing acts only as a secondary editorial constraint. Never auto-apply its suggested rewrites without the existing approval and revision gates.

## v4.3: Tiered Avoid AI Writing editorial audit

Run `node bin/writing-quality.js avoid-ai tiers --file <draft.md> --context cn-explanatory --voice chinese-explanatory --output .writing/tiers.json` to produce document-hash-locked, byte-located editorial signals. Verify with `avoid-ai tiers-verify` using identical options. Tier 1 is per-occurrence, Tier 2 requires at least two occurrences in a paragraph, and Tier 3 uses document-level frequency with a configurable threshold. This is not an authorship detector. Never mechanically delete evidence qualifiers, attribution, direct quotations, or technical terms. Voice is metadata only in this version; voice-specific policy is not yet enforced.

### v4.4 Avoid AI Writing policy

Use `avoid-ai tiers --file <path> --context <profile> --voice <profile>` for deterministic Tier 1/2/3 editorial signals. Add `--non-native-tolerance true` only on explicit editorial request. Reports include resolved policy and source byte offsets. Verify with `avoid-ai tiers-verify` using identical options. Never infer author identity, claim AI authorship, or remove meaningful uncertainty, attribution, and quotations. Context changes tier thresholds; voice currently records guidance rather than implementing full voice-dependent rewriting. Require human review before edits.

### v4.5 Avoid AI Writing revision workflow

Use `avoid-ai plan` to create deterministic, source-anchored editorial tasks; use `avoid-ai apply` only with explicit reviewer decisions, rationale and protected quotes; run `avoid-ai apply-verify` to recompute the output and report. Rejected, pending, or remaining findings keep the workflow INCOMPLETE. Do not treat absence of lexical signals as evidence of human authorship, semantic preservation or factual correctness. A separate final-gate audit remains necessary.


## v4.6 — Claim-aware rewrite assurance

The new assurance layer recomputes the approved Avoid AI Writing patch and checks its exact output against the revised file. It requires a version-bound claims inventory and argument graph; missing inventories fail closed. Claim changes need explicit review, and every declared argument edge needs an editor decision. Rejected decisions block; pending reviews are incomplete. No automated semantic entailment or factual verification is claimed.

```bash
node bin/writing-quality.js avoid-ai assure --before draft.md --after revised.md --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json --claims .writing/claims.json --argument-graph .writing/graph.json --argument-review .writing/graph-review.json --output .writing/assurance.json
node bin/writing-quality.js avoid-ai assure-verify --before draft.md --after revised.md --plan .writing/ai-plan.json --decisions .writing/ai-decisions.json --claims .writing/claims.json --argument-graph .writing/graph.json --argument-review .writing/graph-review.json --report .writing/assurance.json
```

Optional `--claim-review` and `--protected` files are supported. The unified `revision final-gate` additionally accepts `--rewrite-assurance-input` (a JSON object containing the complete inputs for recomputation). Omitting this optional input preserves legacy gate behavior and does **not** mean claim-aware rewrite assurance was performed.

### v4.7 mandatory risk check

After approved Avoid AI Writing patches, run `avoid-ai risk-audit` before considering a rewrite ready for editorial review. The audit reports changes to numeric expressions, units, qualifiers, causal words, dates and source-attribution language in approved patch spans. Its findings are lexical review triggers, not proof of semantic or factual errors. `avoid-ai assure` now returns `INCOMPLETE` when lexical risk findings exist. Do not treat `NO_LEXICAL_RISK_DETECTED` as a guarantee that claims, context, sources or argument relationships are preserved.

### v4.8 benchmark requirement

Use `avoid-ai benchmark` to evaluate rewrite-risk categories against explicitly labeled cases. Report dataset provenance, case count, per-category TP/FP/FN/TN and precision/recall, including undefined metrics where denominators are zero. Do not call the bundled synthetic examples a real-world benchmark. Require independently annotated, held-out editorial examples before making claims about production false-positive or miss rates. Use `avoid-ai benchmark-verify` to recompute and verify reports.

### v4.9 — Evidence-based editorial corpus protocol

Use `avoid-ai corpus-prepare`, `corpus-adjudicate`, and `corpus-verify` to record two reviewer labels and a separate adjudicator's decision on disagreements. Never present self-declared reviewer identifiers as authenticated identities. Never claim the bundled constructed examples represent independent real-world accuracy. Preserve disagreements and explicit rationales.

## v5.0 numerical-integrity guard

Before accepting a rewrite, run `avoid-ai risk-audit` (or `avoid-ai assure`). Review newly flagged `percentage_point`, `percentage`, `currency`, `relative_period`, `negation`, `range`, and `ticker` findings against original evidence. Never treat an absence of lexical findings as proof of semantic equivalence, complete entity preservation, or factual correctness. Reviewers must confirm the underlying source independently.

### v5.1 financial fact review

For financial revisions, optionally run `avoid-ai facts-audit` with editor-declared, SHA-256-bound inventories before and after the edit. Every fact must include `id`, a unique `quote`, and a seven-field `tuple` (`entity`, `metric`, `value`, `unit`, `period`, `source`, `condition`). Treat added, removed, or changed fields as review tasks. Reject changes lacking adequate evidence. Verify the report with `avoid-ai facts-verify`. Do not claim this validates source truth, extracts facts automatically, or integrates with the final gate.


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

### v5.3 — Candidate-level financial fact coverage

For financial editorial revisions, enumerate candidates with `avoid-ai candidates`. Require one decision per candidate, with reviewer, rationale, and `factIds` for `covered` decisions. Run `avoid-ai granular-audit`, then independently recompute with `granular-verify`. Set `--require-granular-coverage true` and provide `--granular-fact-coverage-input` in `revision final-gate` when this audit must be mandatory. Never treat candidate coverage or editor attestation as independent factual verification. In particular, table cells and multiple numbers in one sentence must be reviewed separately.


### v5.4 source-evidence workflow
For finance edits, prepare a source bundle with `sources: [{id,uri,text}]`; map each before/after fact ID to an exact source quote with `sourceId`, `reviewer`, `rationale`. Run `avoid-ai evidence-audit` and `evidence-verify`; for gated releases add `--require-fact-evidence true` and `--fact-evidence-input`. The status `READY_FOR_HUMAN_REVIEW` is not evidence of truth or permission to publish. Never infer a source was independently verified.

### v5.5 Source governance requirement

For high-stakes financial writing, supply a source bundle with source IDs, classification (`primary-filing`, `primary-official`, `secondary-report`, `editor-estimate`), version, retrieval date, and fact period. Run `avoid-ai source-audit` and `avoid-ai source-verify` before final review. Enable `--require-source-governance true` in `avoid-ai evidence-audit` to bind the provenance decision to the evidence report. Treat source metadata as editor attestations, not independently authenticated records. Do not describe `READY_FOR_HUMAN_REVIEW` as fact-checked or publication-approved. The strict period equality rule requires manual handling of equivalent period aliases.

### v5.6 source-conflict review

Run `avoid-ai conflicts-audit` with a versioned source bundle, source observations, and editorial resolutions. A conflict is defined by identical declared entity, metric, period, unit and condition but different value strings. Never silently choose the newest version; require a documented selection and evidence of the correction lineage, or explicit methodology differences. Treat `INCOMPLETE` as an unresolved editorial task and `READY_FOR_HUMAN_REVIEW` as non-final. Verify with `avoid-ai conflicts-verify`. This check is standalone and not yet enforced by Final Gate. Never describe editor-provided observations as authenticated source evidence.

### v5.7 mandatory conflict review and accounting scope

For a high-stakes financial release, provide the **original input bundle** to `revision final-gate --source-conflicts-input .writing/source-conflicts-input.json --require-source-conflicts true`. The bundle contains `sources`, `observations`, and `resolutions`. Final Gate independently recomputes source conflict status; do not pass a precomputed conflict report as the input. Missing required inputs are `INCOMPLETE`, unresolved conflicts are `INCOMPLETE`, and invalid source lineage is `BLOCKED`. Always run `revision final-gate-verify` with the same flags and source bundle. `READY_FOR_HUMAN_RELEASE` is not permission to publish.

Where observations could differ by accounting definition, explicitly supply `accountingBasis`, `consolidationScope`, and `measurementBasis` on each observation fact. Never treat different scope values as directly comparable or silently assume missing scope means equivalence. This guard is exact-string comparison, not semantic accounting normalization or independent verification.

### v5.8 — Financial metric reconciliation

For edits involving changes between reported, adjusted, consolidated, or otherwise scoped financial metrics, register both observations and an explicit adjustment bridge. Use `avoid-ai reconcile-audit` and `reconcile-verify`; optionally require the bridge in the release workflow using `--require-metric-reconciliation true --metric-reconciliation-input <input.json>`. Do not treat exact arithmetic reconciliation as validation of accounting definitions, evidence authenticity, or a factual claim. Do not invent adjustments to make numbers balance. If the source does not document the adjustment, leave the review incomplete.


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

### v6.0 — Source snapshot checks

Before relying on editor-provided source extracts, optionally pin each local original artifact in a JSON array of `{id,path,expectedSha256}`. Run `avoid-ai snapshot-audit --root <dir> --manifest <json> --output <json>` and `avoid-ai snapshot-verify --root <dir> --manifest <json> --report <json>`. A mismatch or missing artifact blocks the snapshot audit. These checks do not establish provenance, publisher identity, source freshness or semantic support. Never describe a matching SHA-256 as proof of an official filing. Final Gate integration is not implemented in v6.0.

## v6.1 source acquisition

Use `avoid-ai source-fetch` only when the user has authorized a source download and supplied or reviewed an explicit trusted host allowlist. Provide `--root`, `--entry`, `--allow-hosts`, and `--output`; the entry contains `{id,url,path}`. Use `--max-bytes` and `--timeout-ms` to constrain resource use. The downloader refuses redirects, private/reserved DNS answers, non-HTTPS URLs, unsafe paths, and overwriting existing evidence. Run `avoid-ai source-fetch-verify --root ... --record ... --allow-hosts ...` before relying on the pinned bytes. Treat the result as local byte provenance, not verified publisher identity or verified financial truth. Do not claim that this module authenticates official filings, and do not infer publication approval from a successful fetch.

## v6.2 Acquisition-to-Evidence Chain

For source-backed financial editing, retain v6.1 acquisition records and create a separate `links.json` with each fact ID, record ID, reviewer, rationale, exact UTF-8 quote and byte offsets. Run `avoid-ai chain-audit` and `avoid-ai chain-verify` before editorial review. Treat `BLOCKED` as a source integrity failure; `READY_FOR_HUMAN_REVIEW` only means that the supplied source bytes and excerpt positions were internally consistent. Do not infer publisher authenticity, accounting validity, semantic support, or full claim coverage. Do not attempt to use binary PDF byte offsets as extracted-text offsets.

## v6.3 evidence-chain release requirement

For financial editorial release, declare the critical fact inventory (`[{"id":"revenue","reason":"material revenue figure","reviewer":"editor"}]`), bind each ID to an acquired-source excerpt, and run `avoid-ai chain-release`. Require `--require-evidence-chain true --evidence-chain-input ...` on `revision final-gate`. Treat `INCOMPLETE` and `BLOCKED` as non-release states. This audit cannot establish that the inventory is exhaustive or that quoted evidence semantically supports a claim.

## v6.4 — Claim-to-Evidence Review

When a claim is linked to an acquired UTF-8 source excerpt, use `avoid-ai claim-evidence-audit` to re-verify the acquired file and compare explicitly registered `entity`, `metric`, `value`, `unit`, `period`, and `condition` fields with values literally present in the excerpt. Supply `claims.json` with `{id,linkId,fields,evidenceFields}` and `reviews.json` with `{claimId,decision,reviewer,rationale}`. Use `avoid-ai claim-evidence-verify` to recompute the audit. Never describe literal matches or reviewer approvals as independent semantic or factual verification. Unreviewed or mismatched claims are incomplete; rejected reviews and broken evidence bindings block. This audit is not yet mandatory in Final Gate.


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

## v6.6 — Inference Dependency Review

For an article with dependent conclusions, require a dependency declaration for every inference. Each declaration has `inferenceId` and a nonempty `premises` array of `{type:'claim'|'inference',id}`. Run `avoid-ai dependencies-audit` after inference review, and `dependencies-verify` before release. Fail closed on unknown premises, duplicate declarations, cycles, missing dependencies, or upstream unreviewed inferences. The optional Final Gate switch `--require-inference-dependencies true --inference-dependencies-input <json>` makes this a release prerequisite. Never interpret a valid DAG or reviewer attestation as proof of causal validity, semantic entailment or complete premise discovery.


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

## v6.8 Craft-first drafting and editing

Use `rules/craft-contract.json` as the **operational writing craft standard**, not a word blacklist. Do not insert book titles, author names, or book citations into the draft or machine rule pack. Select `fiction`, `narrative-nonfiction`, or `analytical-nonfiction` before writing. Never impose a fiction plot formula on analytical commentary.

Drafting sequence: identify the reader's central question or character's desire; arrange causal progression and consequential changes; choose viewpoint and disclosure timing; draft in a distinctive voice; revise sentence rhythm, syntax, and purposeful repetition; remove redundancy only when it adds no information; check what the reader can infer and what remains unsupported. In nonfiction, preserve uncertainty, data provenance, competing explanations, and the line between observation and inference. In fiction, examine scene changes, decisions, consequences, and voice consistency.

For each applicable rule, request a concrete quote and observation. Use `craft prepare`, `craft audit`, and `craft verify` for a document-hash-locked human review. A completed checklist is not proof of excellent writing. Where rules conflict, preserve factual truth, author intent, and meaningful uncertainty over cosmetic concision.

### v6.9 Craft-Guided Workflow

For user requests to **write**, **draft**, or **revise** with the craft rules, begin with an explicit audience, central question, intended reader gain, and factual boundary. Use `craft workflow-prepare` to obtain stage-specific rules. Work in the order `intent → outline → draft → structure → line → release`. Never force fictional plot beats onto financial or analytical writing. Draft and revise with the stage's rule questions; preserve sourced facts, attribution, uncertainty and voice. Collect human reviews with exact text excerpts and per-rule decisions; run `craft workflow-audit` and `craft workflow-verify`. A text change invalidates the previous workflow plan and reviews. The workflow does not automatically generate prose or certify literary merit.

## v7.0 Craft-guided drafting workflow

When writing or revising, use `craft draft-prepare` to create six concrete assignments from the selected profile and a human-supplied brief. Do not invent missing audience, thesis, sources or facts. Work through intent, outline, draft, structure, line and release in order; use the relevant craft questions as editing constraints rather than stylistic templates. Before adopting changes, use `craft revision-audit` to compare the original and revised document. If numbers, negation, uncertainty or attribution markers change, require separate source/meaning review. Never treat `READY_FOR_HUMAN_RELEASE_REVIEW` as automatic approval, and do not claim lexical preservation implies semantic equivalence. See README for executable commands.

## v7.1 paragraph-level review

For every paragraph, record its unique information or scene change, its relation to neighboring paragraphs, and the facts, qualifications, narrative viewpoint or voice that a rewrite must preserve. Use `craft paragraph-prepare` to produce stable source-hash-bound paragraph tasks, `craft paragraph-audit` for reviewer decisions, and `craft paragraph-audit-verify` to recompute the report. Never silently apply proposed prose or claim automatic literary evaluation. `REVISE` and `REMOVE` require a separate authorized editing pass and fresh audit. The heuristic paragraph splitter may misclassify complex Markdown; review such documents manually.

### v7.2 Paragraph revision execution

Use `craft paragraph-propose` to turn reviewed `REVISE` or `REMOVE` decisions into source-bound patches. Obtain a separate explicit reviewer decision, then run `craft paragraph-apply` and `craft paragraph-apply-verify`. Never silently edit the document. Protected lexical changes (numbers, negation, uncertainty, attribution) and deletion fail closed; send them to independent content/fact review. Successful application does not authorize publication. See README v7.2 for command arguments.

## v7.3 — Mandatory revision-impact review in craft workflow

After an approved paragraph revision, run `craft impact-audit` with the original text, original paragraph plan, reviews, proposal, approval decisions, and a directed list of editorial dependencies. Recheck every affected paragraph (including unchanged neighbors and downstream conclusions) against the revised document hash. Record `APPROVE` or `REJECT`, reviewer identity label, and substantive rationale; verify the report with `craft impact-review-verify`. Do not treat a clean dependency graph or human approvals as semantic truth or final publication approval. See README.md for exact CLI commands and JSON shapes. No source book names are required in editorial rule files.

## v7.4 — Paragraph impact and document structure release gates

After paragraph revisions, run `craft impact-audit` and `craft impact-review` against the original plan and actual execution. Invalidate changed paragraphs, neighbors, and downstream declared dependencies. Independently run `craft structure-audit` on the revised document, supplying one reviewed `PASS`/`FAIL` decision per paragraph, bound to the revised SHA-256. Use `--require-craft-impact true --craft-impact-input ...` and `--require-structure-regression true --structure-regression-input ...` with `revision final-gate`. Do not equate a passed check with semantic correctness, evidence sufficiency, or permission to publish. Rules should express craft techniques without attributing or naming the underlying books.

### v7.5 Editorial coherence contract

Before release, declare the distinct information contribution of each paragraph with an exact quote, reviewer, rationale, and explicit dependencies. Use `craft coherence-prepare`, `craft coherence-audit`, and `craft coherence-verify`. A `CONCLUSION` requires a declared support paragraph; a `RESPONSE` requires a declared `COUNTERARGUMENT`. Repeated contribution identifiers, rejected reviews, and malformed dependencies block; missing reviews remain incomplete. Require `--require-coherence true --coherence-input coherence-input.json` at Final Gate where the project mandates this review. Do not claim that these checks prove semantic originality, argument validity, source accuracy, or literary merit.

### v7.6 evidence-bound editorial review

For evidence-dependent nonfiction, create a paragraph-specific claim inventory before declaring the draft ready. Run `craft evidence-prepare`, then record explicit source excerpts, SHA-256 excerpt hashes, claim quotes, source links, inference dependencies and independent editorial decisions in the `sources`, `claims`, `links`, and `reviews` arrays. Run `craft evidence-audit` and `craft evidence-verify`. Do not call a source authentic merely because an excerpt hash matches a self-supplied excerpt. Distinguish a source statement, a factual claim, an inference and a conclusion. Record conflicting evidence and a concrete resolution. Use `--require-evidence-bound true --evidence-bound-input ...` in the final release gate when this contract is mandatory. Do not cite book names in generated editorial rules or writing instructions.

### v7.7 Source provenance verification

Before accepting a source-bound craft review, pin the full local UTF-8 source file bytes with SHA-256 and run `craft source-provenance-audit` using the v7.6 evidence plan and records. Every source ID must have a matching manifest entry. Verify exact excerpts against pinned bytes; reject stale or unreadable files, path escapes, and acquisition-record mismatches. Re-run after source files or evidence records change. Never interpret byte integrity as source authority, factual truth, or semantic entailment. The v7.7 command is a standalone release prerequisite until explicitly integrated with Final Gate.

## v7.8 Source change regression

When evidence sources are replaced or updated, compare pinned baseline/current manifests with `craft source-change-audit`. Recheck every impacted claim (including transitive dependents) against the new source, record editor decisions tied to both manifests and the document hash, and verify the resulting report. For releases requiring this check, set `--require-source-change true --source-change-input ...` on `revision final-gate`. Never treat unchanged hashes as evidence of current truth; never treat review completion as independent fact verification.

### v7.9 — Evidence dependency coverage

For analytical nonfiction, run `craft coverage-prepare` against the current draft, then review each numeric, causal, certainty and attribution candidate. Record explicit `LINK` to a same-paragraph evidence-supported claim, `NOT_A_CLAIM` with rationale, or `NEEDS_SOURCE` to defer release. Run `craft coverage-audit` and `craft coverage-verify`. Enable `--require-dependency-coverage true --dependency-coverage-input coverage-input.json` for the optional final release gate. Do not represent lexical coverage as semantic completeness or evidence validity. Do not cite books in the rules or editorial output.

### v8.0 Unified editorial pipeline

For multi-stage reviews, prefer `craft pipeline-audit --file <article> --manifest <manifest.json> --output <report.json>` and `craft pipeline-verify` over manually interpreting independent reports. Required stages must be explicitly declared. Evidence records can be shared with coverage. A missing review yields `INCOMPLETE`; malformed stage data yields `BLOCKED`. Never describe a `READY_FOR_INDEPENDENT_RELEASE_REVIEW` report as a proof of truth or independent human publication approval. See README v8.0 for manifest schema and supported stages.

## v8.1 Unified Release Decision

For final editorial decisions, use `craft release-audit --file <article> --manifest <editorial-release.json> --output <release-report.json>`, followed by `craft release-verify` with the same article and manifest plus `--report`. The manifest must explicitly list required stages and stage inputs. When a legacy revision gate is mandatory, set `requireLegacy: true` and supply its complete `legacy` input and exact `--before` baseline. Do not treat `READY_FOR_INDEPENDENT_RELEASE_REVIEW` as publication approval or proof of factual accuracy. Diagnose `blockers` and `pending` by their `origin` fields.

### v8.2 Incremental audit planning

Run `craft incremental-audit` with `--file`, `--manifest`, optional `--before` and optional `--previous`. Save the advisory cache using `--cache-output`. Always recompute the full required pipeline for release; never equate a matching cache fingerprint with verified editorial quality. `craft incremental-verify` recomputes and checks the complete report.

### v8.3 authenticated incremental execution

Use `craft incremental-execute` for local iteration with a private `--secret-file` (minimum 32 UTF-8 bytes). A signed cache can skip unchanged stages, but it is not a release certificate. Run with `--compare-full true` to require deterministic parity against the full pipeline. Do not commit the secret, treat cached results as untrusted without a valid MAC, and always run the complete `craft release-audit` for publication decisions. Engine code fingerprinting protects the included engine modules only; do not infer external source authenticity or semantic correctness.


## v8.4: CI reproducibility contract

Run `node scripts/editorial-ci.js --file <article> --manifest <manifest> --output <evidence.json>`. This performs two authenticated incremental runs, compares both to the complete pipeline, verifies a document mutation invalidates all cached stages, and verifies a different HMAC key prevents reuse. Treat an `INCOMPLETE` or `BLOCKED` editorial decision as non-release; do not infer writing quality or factual accuracy from successful reproducibility checks. The repository's GitHub Actions example expects an `INCOMPLETE` result because its example has no human approvals. Never store signing secrets in reports or source control.


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

### v8.7 Repair impact acceptance

After completing the repair-plan audit, run `scripts/editorial-repair-acceptance.js audit` with the original document, revised document, original diagnostics, repair plan, decisions, and the current editorial manifest. Record all changed and adjacent paragraphs and editor-declared argument/evidence/conclusion/transition dependencies in the revised document. Obtain explicit impact checks for every affected paragraph, binding each check to both the revised document SHA-256 and the paragraph SHA-256. Re-run `verify` after any change. Do not describe an acceptance report as proof of factual correctness or publication approval. For strict release enforcement supply a separate unified release configuration using `--release`.


## v8.8 — Editorial Acceptance Regression Suite

Use a curated, version-controlled suite to detect changes in editorial release decisions and paragraph impact results. Each fixture specifies its expected status, diagnostic codes or exact changed/affected paragraph indices. The runner recomputes release reports, checks deterministic output, and rejects stale reports after document mutation. It does **not** establish semantic correctness, and the fixture set is not a statistical measure of false positives or false negatives.

```bash
npm run editorial:regression
node scripts/editorial-regression.js run --suite benchmarks/acceptance/cases.json --output regression-report.json
node scripts/editorial-regression.js verify --suite benchmarks/acceptance/cases.json --report regression-report.json
```

GitHub Actions runs this suite before reproducibility checks. Add independently reviewed real-world examples to `benchmarks/acceptance/cases.json` with explicit expected results; changes to expectations require editorial approval. The suite currently tests known regression cases, not all possible writing errors.

### v8.9 benchmark evidence contract

Use `npm run editorial:benchmark` to measure existing gate diagnostics against explicitly labeled cases. Keep detector output separate from the annotation. Require provenance, a concrete rationale and annotator, and for real cases documented consent, redaction review, date and guideline version. Report confusion counts and undefined metrics honestly. Never treat synthetic fixture performance as real-world accuracy. A failed release gate is not itself proof of a factual error. Do not silently relabel a case to make a test pass.

## v9.0 evaluation protocol

Before claiming benchmark quality, require independent labels, third-party adjudication of disagreements, group-isolated development and holdout partitions, real-world consent/redaction review, and positive and negative holdout cases. Run `node scripts/editorial-evaluation.js run --dataset <dataset.json> --protocol <protocol.json> --output <report.json>` and verify using the `verify` subcommand. `NOT_CALIBRATED` is an expected fail-closed outcome when evidence is inadequate. Never describe synthetic-only evaluation as demonstrated production accuracy.

## v9.1 Real-case collection

For real-world calibration, intake only cases with documented consent, redaction review, distinct independent reviewers, and an explicit source-group split. Use `scripts/editorial-cases.js` to collect blind annotations, adjudicate disagreements, and freeze a reproducible benchmark/protocol export. Never claim consent metadata is independently verified, never expose peer labels in reviewer packets, and never claim real-world accuracy from bundled synthetic fixtures. Preserve private cases outside the public repository.

### v9.2 annotation governance

Before interpreting benchmark metrics, audit the independently annotated case registry with `scripts/editorial-governance.js audit --registry <path> --policy benchmarks/editorial/governance-policy.example.json --output <path>`. Investigate duplicate inputs, split/label/category gaps, missing reviews, and disagreement. Use `verify` to recompute a report. Treat agreement and Cohen's kappa as descriptive statistics, not validation of ground-truth correctness. An audit passing does not authenticate consent or prove representativeness.


## v9.3 — Annotation Bias & Dataset Leakage Audit

Use `node scripts/editorial-bias.js audit --registry private/registry.json --policy benchmarks/editorial/bias-policy.example.json --output private/bias-report.json`. Verify with `node scripts/editorial-bias.js verify --registry private/registry.json --policy benchmarks/editorial/bias-policy.example.json --report private/bias-report.json`.

The audit identifies lexical near-duplicates across development/holdout, plus reviewer positive-rate disparities measured only on shared cases. It reports explicit uncertainty: token Jaccard cannot detect all semantic paraphrases, and reviewer disagreement alone does not establish bias. Thresholds are operator-defined; sample coverage and independent validation remain necessary. Do not publish raw private case text in CI artifacts.

### v9.4 qualification gate

Before claiming a dataset is eligible for editorial evaluation, run `scripts/editorial-qualification.js audit` with the case registry, v9.2 governance policy, and v9.3 bias policy. A `QUALIFIED` result means the configured structural checks passed, not that the dataset is representative or the detector accurate. Treat `NOT_READY` as blocking and `REVIEW_REQUIRED` as requiring documented human disposition. Never waive cross-split leakage or sample coverage via review decisions. Recompute verification before consuming a stored report. Do not expose private article text or consent metadata in public CI artifacts.


## v9.5 production checks
Run `npm run check && npm run production:smoke && npm run production:pack`; inspect `docs/PRODUCTION-HARDENING.md` before release.

## External anti-slop constraint (optional)

When the user requests the external anti-slop skill as a secondary constraint, load [references/external-anti-ai-slop.md](references/external-anti-ai-slop.md) before drafting. Treat matched expressions as review candidates, not grounds for automatic deletion. Preserve primary story anchors, accurate qualifications, and character voice.
