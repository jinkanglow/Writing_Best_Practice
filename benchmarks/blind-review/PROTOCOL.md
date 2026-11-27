# Blind Editorial Comparison Protocol

This is an evaluation protocol, not evidence that a real blind study has happened.

## Study design

1. Obtain explicit rights to use real drafts and remove personal or confidential details. Record consent and provenance outside public fixtures.
2. For each original draft, produce two revisions with the same time and factual-source budget: baseline editing and plugin-assisted editing. Do not change underlying factual material between arms.
3. Randomly assign anonymized A/B labels; retain the mapping in a separate restricted file. Reviewers must not see the arm labels, tool output, or author identity.
4. Recruit at least two independent editors per pair. Declare the sample size and inclusion criteria before collecting results. No universal sample threshold is asserted.
5. Evaluate factual fidelity, unsupported additions, causal clarity, argument integrity, prose specificity, voice preservation, and editing time. Record both improvements and regressions.
6. Reconcile disagreements with a separate adjudicator; retain individual labels and rationale. Do not replace disagreement with an average and call it truth.
7. Freeze the holdout set before changing prompts or rules. Never tune the detector on holdout outcomes.
8. Report paired outcomes, sample composition, missing ratings, disagreement, confidence intervals when appropriate, and negative results. Do not claim generalization to untested genres or languages.

## Rating record

Use `rating.schema.json`. Each reviewer records source-grounded observations, not only scores. All examples shipped in this repository are demonstrations, not independently reviewed real-world cases.

## Release criterion

No quality claim is permitted without independent reviewed pairs and a predeclared decision rule. Until then status is `NOT_VALIDATED`.
