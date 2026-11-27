---
name: writing-best-practices
description: Write, rewrite, critique and fuse fiction, financial research, macroeconomic and political commentary, technical articles and other nonfiction. Use for evidence-grounded argument, narrative craft, compression and anti-slop editing.
---
# Writing Best Practices

Deliver the requested writing, not a description of the writing process. Improve substance before style. Use the shortest relevant route; do not load the entire repository.

## 1. Select the route

| Task | Read first |
|---|---|
| Financial, macro, political or technical analysis | `references/editorial-decision-guide.md`, `references/claims-and-evidence.md`, `references/numerical-integrity.md` |
| Rewrite or compress | `references/evidence-preserving-compression.md`, `references/argument-progression.md` |
| Fiction | `references/character-causality.md`, `references/scene-turns-and-stakes.md`, `references/voice-and-point-of-view.md` |
| Combine skills | `references/fusion-protocol.md`, `references/fusion-translation.md`, `references/fusion-anti-slop.md` |
| Anti-slop | `references/anti-slop-structural.md`, `references/anti-slop-semantic.md`, `references/banned-words.md`; for Chinese, `references/anti-slop-chinese.md` |
| Formal release or audit | `references/editorial-runtime.md`, `references/editorial-acceptance.md`, `docs/EDITORIAL-ORCHESTRATION.md` |

For mixed tasks combine routes only where needed. Read the actual supplied sources and skills before claiming to apply them. If inaccessible, disclose the material gap once. Use genre profiles in `profiles/` as defaults, not universal laws.

## 2. Establish the editorial contract

- Identify the requested artifact, reader, thesis or story promise, voice, length, structure and mandatory details. Preserve the author's substantive position unless evidence contradicts it; correct factual errors explicitly when material.
- For revision, privately inventory facts, numbers, units, dates, qualifiers, mechanisms and original insights. Preserve all material items; remove duplication rather than evidence. For fiction inventory viewpoint, knowledge, desire, relationships and irreversible events.
- Separate source observations, derived calculations, interpretations and forecasts. Never invent sources, quotes, data, experience, reviewer approval or access to unavailable material. Verify current consequential facts when tools and permission allow.
- Resolve conflicts in this order: factual integrity and applicable safety; explicit user requirements; primary skill's substantive structure; secondary expression constraints; optional stylistic preferences. A request for certainty does not justify false certainty.

## 3. Translate knowledge into writing decisions

For substantive analysis read `references/editorial-intelligence-practice.md` and apply only the relevant methods. Identify the decision-relevant discrepancy and rank variables by their ability to change the thesis. Reconcile source origin, scope, period and units; distinguish measured drivers, derived quantities and hypotheses. Reconstruct the mechanism from identities, actor choices and binding constraints; distinguish accounting from causality. For strategic work, examine marginal economics, stocks and flows, timing, feasible responses and feedback. Resolve conflicting sources and frameworks by checking definitions, lineage and assumptions. Integrate the strongest alternative at the disputed link. State forecast triggers, horizons and falsifying observations where material; never invent probabilities or claim mispricing without price and expectations evidence.

Preserve supported authorial judgment and voice. Map material claims to destination paragraphs and reverse-check introduced claims. For research benchmarks, use `benchmarks/editorial-quality-rc13/README.md`; keep evidence-to-thesis mappings and evaluation records outside the delivered article.

## 4. Build the argument or story before polishing

For nonfiction, lead with a defensible judgment. Give each section a distinct question and contribution. Each paragraph inherits a relevant premise, adds a distinct contribution and advances the argument; remove it only if no evidence, reasoning or necessary bridge is lost. Connect observation → mechanism → affected actor → measurable consequence → condition that would change the conclusion. Name the actual constraint, incentive, balance-sheet item, institution or technical dependency; do not substitute abstract labels for explanations. Test the strongest plausible competing explanation when it changes the judgment. Keep necessary uncertainty adjacent to the affected inference, not repeated in every paragraph.

For fiction, connect desire and available information to choice, action, cost and changed state. Let subsequent scenes inherit consequences. Use dialogue, concrete detail, interiority and exposition according to their function. Preserve purposeful repetition and emotional continuity; do not force every scene into a fixed beat formula.

For fusion, identify the primary skill's anchors and secondary constraints separately. Translate each relevant abstract rule into a concrete decision in the actual prose. Resolve tensions before drafting; inspect transitions and verify both sets of requirements afterward. Do not append a second competing article or mechanically insert every technique.

## 5. Draft and revise in order

1. Write the complete artifact in the requested structure and language. Each paragraph must contribute a fact, mechanism, comparison, consequence, scene change or necessary transition.
2. Audit substance: exact figures, periods, denominators, attribution, causal direction, missing evidence, scope and factual retention. Distinguish observed outcomes from future scenarios.
3. Audit progression: remove paragraphs that merely paraphrase the thesis; merge repeated qualifications; preserve useful counterarguments and evidence. Do not lengthen a rewrite unless necessary to satisfy the brief.
4. Audit expression: replace empty emphasis, stock transitions, symmetrical slogans, abstract nouns without actors and generic conclusions with precise language. Vary syntax according to meaning. Apply strict banned-word constraints when requested, preserving quotations, names and necessary technical terms.
5. Re-read the revised artifact against the contract. Repair meaning drift, lost facts, contradictory transitions and broken scene continuity before delivery.

## 6. Deliver

Return the complete fused article or story by default. Keep internal ledgers, scores and audit transcripts separate unless requested. Honor requested citation format; never fabricate citations or omit attribution needed for accuracy. If a material fact cannot be verified, qualify or omit the claim rather than presenting it as established. End with the actual implication, decision, unresolved variable or story consequence, not a generic moral.

## 7. Optional executable assurance

Use `node scripts/anti-slop-catalog.js scan --file draft.md --profile fiction --output report.json` with the appropriate profile for lexical candidates. Use the existing release workflow for formal authorization; see `docs/LEGACY-SKILL-INSTRUCTIONS.md` and `docs/RC7-SKILL.md` for historical commands. Never bypass historical gates or equate a signature, lexical scan, test count or runtime parity with semantic truth or independent editorial quality. Do not require formal release artifacts for ordinary writing requests.
