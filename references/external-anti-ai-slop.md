# External Anti-Slop Integration — Review-Only Adapter

## Provenance

Upstream: https://github.com/jalaalrd/anti-ai-slop-writing

Reviewed source files:
- https://raw.githubusercontent.com/jalaalrd/anti-ai-slop-writing/main/skills/anti-ai-slop-writing/SKILL.md
- https://raw.githubusercontent.com/jalaalrd/anti-ai-slop-writing/main/skills/anti-ai-slop-writing/references/banned-words.md

This repository **adapts concepts**, not the upstream text or complete banned-word inventory. Upstream identifies its project as MIT licensed; check its license and revision before redistributing verbatim copies. This integration is not an endorsement or a dependency on the upstream repository.

## Integration policy

1. Primary narrative skill owns scene anchors, character motivation, structural causality, and required outcomes.
2. This adapter supplies **secondary** lexical and presentation signals only. It must not delete primary anchors or override character-specific voice.
3. Flag empty openings, generic conclusions, marketing inflation, assistant-style openings, and stock vocabulary for review.
4. Never infer AI authorship from a match; no reliable detector is established by these heuristics.
5. Do not adopt blanket bans on passive voice, semicolons, rule-of-three, or em dashes. All can be justified by genre and rhetorical function.
6. Preserve legitimate quotations, proper names, domain-specific vocabulary, factual qualifications, and uncertainty.
7. Never invent numbers, anecdotes, quotes, names, or events to make prose sound specific.
8. At each emotional transition, evaluate whether an edit preserves the character decision and narrative consequence.

## Human review record

For every candidate: location; matched phrase; actual function in context; whether the phrase is quoted; alternative wording if needed; impact on primary anchor; reviewer decision. A candidate may be `KEEP`, `REVISE`, or `NEEDS_CONTEXT`.

## Technical boundary

`src/external-anti-slop.js` provides `auditExternalAntiSlop(text)` and `verifyExternalAntiSlop(text, report)` with deterministic, byte-addressed lexical findings. It is deliberately not a semantic classifier and cannot judge whether a passage sounds human. Use `references/fusion-anti-slop.md` for scene-level review.
