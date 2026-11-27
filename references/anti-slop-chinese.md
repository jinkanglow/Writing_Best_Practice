# Chinese-language anti-slop

## Editorial purpose
Inspect formulaic openings, false profundity, unsupported causal language and repeated four-character clusters.

## Detection protocol
1. Identify the passage and its function before judging the wording.
2. Mark the smallest span responsible for the issue.
3. Record what evidence, scene state or reader inference would be lost by editing.
4. Assign `suggest`, `review_required`, or `block` only according to the active profile.
5. Re-read the surrounding passage after revision; check that meaning and voice survive.

## Failure example (invented for instruction)
> 这标志着行业迎来前所未有的深刻变革。

## Revision procedure
Describe who changed what, when and under which constraint.

## Counterexample / exception
Conventional idioms can be appropriate in dialogue or quoted material.

## Acceptance criteria
- The revised passage preserves every supported fact, character decision and mandatory anchor.
- The issue has been addressed with a concrete edit or an explicit reviewer decision.
- No new factual claim, quote, statistic, experience or source has been invented.
- The edit is justified by function and context, not by a claimed AI-authorship probability.

## Verification boundary
A deterministic tool may identify literal patterns and structural counts. It cannot establish author identity, literary merit, genuine lived experience or factual truth without appropriate evidence and human review.
