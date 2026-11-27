# Draft-bound multi-skill fusion

Before drafting, record the primary skill and each constraint skill separately. Translate each mandatory anchor into a specific scene or analytical mechanism. Record conflicts and their resolution; never waive factual integrity for style. A personal habit list is a valid constraint source. Review coverage explicitly, including conflicts not detected by the software.

For fiction, track each character's prior emotional state, motive, action, consequence and next state. A change without an intervening cause needs revision. A bridge must be supported by the story, not just a label. Direct dialogue or interiority can be appropriate when it belongs to the character. Romance beat timing is profile-specific, not universal.

For nonfiction, give each unit a distinct contribution, causal mechanism and claim IDs. Reuse a claim only when its new function warrants repetition. Bind claims to the existing evidence pipeline; do not invent reporting or data. Preserve material qualifications and consolidate repetitive disclaimers. A new wording is not a new argument.

Record each style exception with its exact draft span, anchor, rule and rationale. Integrity rules cannot be waived. Reviewers must check the substance of exceptions and the completeness of the registered constraints. Draft spans use zero-based JavaScript UTF-16 offsets. Any change invalidates the review basis.

Run `node scripts/editorial-v106.js audit input.json` and verify the resulting report using `verify input.json report.json`. Exit 0 means ready for independent review, not publication authorization; 3 means incomplete, 4 blocked, 2 invalid input. Fiction uses the fusion gate; nonfiction also invokes the v10.5 editorial chain. Reviewer names are declared, not authenticated. The synthetic example intentionally has no approval.

Deliver the complete fused article by default, not the audit trail. Keep internal planning and editorial records separate.
