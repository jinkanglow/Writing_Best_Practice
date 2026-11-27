# Editorial acceptance and release

## Editorial purpose
Separate deterministic checks, semantic reviewer decisions and externally verified evidence.

## Detection protocol
1. Identify the passage and its function before judging the wording.
2. Mark the smallest span responsible for the issue.
3. Record what evidence, scene state or reader inference would be lost by editing.
4. Assign `suggest`, `review_required`, or `block` only according to the active profile.
5. Re-read the surrounding passage after revision; check that meaning and voice survive.

## Failure example (invented for instruction)
> A regex pass is presented as proof of narrative credibility.

## Revision procedure
Report the exact checks executed, unresolved risks and required human decisions.

## Counterexample / exception
A narrow formatting-only task may need only deterministic validation.

## Acceptance criteria
- The revised passage preserves every supported fact, character decision and mandatory anchor.
- The issue has been addressed with a concrete edit or an explicit reviewer decision.
- No new factual claim, quote, statistic, experience or source has been invented.
- The edit is justified by function and context, not by a claimed AI-authorship probability.

## Verification boundary
A deterministic tool may identify literal patterns and structural counts. It cannot establish author identity, literary merit, genuine lived experience or factual truth without appropriate evidence and human review.
