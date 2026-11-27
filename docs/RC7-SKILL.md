---
name: writing-best-practices
description: Plan, fuse, draft and revise fiction or nonfiction using genre-aware craft references, anti-slop review and evidence-safe editorial gates. Activate for writing, rewriting, skill fusion, anti-slop, critique, and release review.
---

# Writing Best Practices

Use the shortest relevant route. Do not load every reference by default.

## Task routing

| Request | Read first | Output |
|---|---|---|
| Fiction draft or rewrite | `references/character-causality.md`, `references/scene-turns-and-stakes.md`, `references/voice-and-point-of-view.md` | Anchors, scenes, draft, continuity review |
| Skill fusion | `references/fusion-protocol.md`, `references/fusion-translation.md`, `references/fusion-anti-slop.md` | Decomposition, conflict ledger, translation map, dual acceptance |
| Nonfiction or financial analysis | `references/claims-and-evidence.md`, `references/causal-reasoning.md`, `references/numerical-integrity.md` | Claims ledger, evidence limits, argument, revision |
| Anti-slop rewrite | `references/banned-words.md`, `references/anti-slop-lexical.md`, `references/anti-slop-structural.md`, `references/anti-slop-semantic.md` | Smallest defensible edits and exception notes |
| Editorial release | `references/editorial-acceptance.md`, `references/paragraph-information-gain.md` | Checked gates, unresolved issues, review status |

## Non-negotiable order

1. Capture genre, audience, voice, material facts, mandatory anchors and the requested output.
2. Preserve structure and evidence before optimizing language. The primary skill owns **what happens**; constraints govern **how it is expressed**.
3. Translate each abstract anchor into an observable scene, claim or mechanism before drafting. Resolve conflicts explicitly.
4. Write the requested piece. Do not invent statistics, quotes, citations, firsthand anecdotes or reported results.
5. Review transitions and causality; inspect cross-paragraph repetition and unsupported significance.
6. Apply lexical anti-slop as **context-sensitive editing**, not AI authorship detection. Preserve quotes, code, proper nouns and necessary technical terms.
7. Recheck edits for meaning drift. State which checks actually ran and which require human or external verification.

## Profiles and contracts

Use `profiles/` for genre-specific tolerances. Use `rules/anti-slop-catalog.json` for candidate patterns and `schemas/anti-slop-catalog.schema.json` for its format. The user's absolute banned-word preference may be enforced in a requested strict profile, but never by fabricating facts or corrupting quotations.

Use `workflows/draft-revise-release.md` for the full workflow and `examples/anti-slop-before-after.md` for grounded demonstrations. Existing CLI contracts remain available; consult `docs/LEGACY-SKILL-INSTRUCTIONS.md` for the prior command reference.

## Verification boundaries

A lexical match is a review signal, not proof of AI authorship. Numeric punctuation quotas, three-item patterns, passive voice and sentence-length uniformity are editorial heuristics, not universal writing laws. Literary quality, semantic truth, provenance and actual author identity require other evidence.

## Executable catalog scan (v9.8)

For a draft in Markdown, use `node scripts/anti-slop-catalog.js scan --file draft.md --profile fiction --output report.json`. The scanner consumes `rules/anti-slop-catalog.json` and reports review candidates with byte offsets. It does not rewrite content or determine authorship. Recheck with `verify --file draft.md --profile fiction --report report.json`. Technical terminology and valid contextual uses must be reviewed by a person. For blind revision evaluation see `benchmarks/blind-review/PROTOCOL.md`.

## Originality and argument progression (v9.9)

For nonfiction, read `references/original-reporting-and-argument.md` before drafting. Use `workflows/originality-review.md`. Run `npm run originality:audit` for a synthetic demonstration. Treat repeated transitions, qualifications and source overlap as review candidates, not authorship evidence. Establish the author's independent contribution before rewriting a research summary. Return the complete fused article; keep audit notes separate unless requested. Respect publisher restrictions and required disclosures.

## Integrated editorial intelligence (v10.0)

For research-based nonfiction read `references/editorial-intelligence.md` and follow `workflows/editorial-intelligence.md`. Map propositions and scope, trace source lineage, record the author's actual contribution and resolve review findings. Do not repeatedly restate uncertainty; retain material qualifications at the point they affect the conclusion. Return only the complete fused article by default. Never manufacture approval or firsthand reporting.

## Argument progression and release (v10.1)

Read `references/argument-progression.md` for analytical revisions. Establish each section's distinct contribution; consolidate repeated caveats without removing material uncertainty. Keep the article no longer than necessary. Return the complete fused article, not the internal audit. For evidence-bound release use `docs/EDITORIAL-ORCHESTRATION.md`; never fabricate reviewer approval.

## Evidence-preserving revision (v10.2)

Read `references/evidence-preserving-compression.md`. Use `npm run compression:audit` for the synthetic example (exit 4 until reviewed). Map claims across drafts, review equivalent propositions and repeated qualifications, preserve evidence and scope, then run the existing release workflow. Output only the fused article by default.

## Context-aware revision (v10.3)
Read `references/context-aware-revision.md`. Run `node scripts/editorial-context.js audit examples/context/input.json` for a synthetic example. The release command requires both context and orchestration inputs; it recomputes both gates against the same revised text. Do not remove material qualifications to improve rhythm. Deliver the integrated article directly.

## v10.4 evidence-grounded revision

Read `references/automatic-context-and-novelty.md`. Run `node scripts/editorial-qualification-v104.js audit input.json` for candidate extraction, evidence linkage and qualification-loss review. Preserve the author's actual contribution. Deliver the fused article by default; keep audit records separate unless requested.

## v10.5 organic fusion
Read `references/organic-fusion-v105.md` before drafting when combining skills or personal habit lists. Use the first skill as primary, all others as constraints. Record decomposition, conflicts, concrete translations, transition reviews and draft-bound closure internally. Deliver the complete fused draft by default; do not append audit logs. Use romance beat targets only when requested. For nonfiction, preserve evidence and consolidate repeated qualifications. Run `node scripts/editorial-v105.js audit examples/v105/input.json` for the integrated candidate audit; incomplete input intentionally returns exit 3.

## v10.6 draft-bound fusion

Read `references/draft-bound-fusion.md`. Resolve all skill conflicts before drafting; bind every anchor and exception to the final text. For fiction check character causality and emotional continuity; for nonfiction link each distinct contribution to the existing claim and evidence chain. Run `npm run editorial:v106` for an intentionally unreviewed synthetic example. Never fabricate approval. Return only the integrated article unless the user requests the audit.

## v10.7 causal and argument progression

Read `references/fusion-progression.md` for multi-skill conflicts, scene dependencies, nonfiction contributions and contextual exceptions. Keep review records separate from the final fused article. Do not manufacture independent reviews.

### v10.8 semantic fusion assurance
Read [semantic fusion assurance](references/semantic-fusion-assurance.md) when combining skills or compressing nonfiction. Review unparsed directives, causal roots, source-bound progression and material exceptions before releasing the integrated article. Keep editorial records separate from the requested prose.

### Contextual fusion assurance (v10.9)
Read `references/contextual-adjudication.md` when combining skills. Preserve conditional scope and material qualifications. Resolve conflicts in the actual draft, not just in a plan. For nonfiction, require evidence to support the exact claim rather than merely share vocabulary. Deliver the fused article, not the audit record, unless requested.

### Unified runtime (v11.1)
Use [editorial runtime](references/editorial-runtime.md) for release assurance. Preserve the primary skill's argument or story and apply other skills during drafting. Deliver the fused article, not the audit log. Do not treat lexical checks or signatures as proof of semantic quality.

## v11.1 Consolidated editorial execution

Use `npm run editorial:consolidated -- audit INPUT POLICY` for the attested release path. See [runtime consolidation](references/runtime-consolidation.md). Historical interfaces remain compatible. Deliver the fused article, not the audit transcript.

For v11.2 use the canonical execution graph for release reports; preserve legacy gates and distinguish instrumented evidence checks from semantic review.

### v11.3
Use `runNative` for experimental stage migration; compare with `parity` before replacing legacy execution. Never treat unsigned pair scores as independent review.

### v11.4 integration
Use dependency-bound decisions only while their source, draft and rule dependencies remain unchanged. Distinguish differential fixture parity from full runtime equivalence; blind-pair scores are not independently authenticated. Do not bypass nonfiction release gates.
