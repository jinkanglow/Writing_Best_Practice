# Quality Gates

- G0: parse input and validate rule schema.
- G1: detect exact same-scope hard conflicts.
- G2: deterministic literal/regex checks with source spans.
- G3: propose version-locked patches and reject stale source.
- G4: semantic causality, meaning preservation, and fact checking are **not implemented**; require manual review.

Passing G0-G3 does not imply high-quality writing. A warning means review is recommended, not automatic failure.
