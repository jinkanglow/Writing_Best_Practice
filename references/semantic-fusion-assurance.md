# Semantic fusion assurance (v10.8)

Read the primary skill and every constraint skill before drafting. Extract directives with source offsets; review unparsed lines rather than treating them as irrelevant. The extractor recognizes imperative English and Chinese prefixes, not arbitrary natural language. Register scope and canonical targets manually. Review alias collisions and resolve conflicts with a concrete draft passage. Integrity rules cannot be waived by style preferences.

## Fiction
Register each independent initiating event with a passage and rationale. Connect later scenes to earlier causes and verify the emotional change is motivated. A reachable graph is not proof that all necessary causes are present. Do not manufacture edges merely to pass a check.

## Nonfiction
Each section must add evidence, a mechanism, a calculation, or a necessary recap. Bind evidence to a registered claim, source quotation and source hash. Repeating the same quotation is not new evidence. A different quotation is only a candidate for new evidence; check whether it actually changes the conclusion. Preserve material qualifications and remove repeated defensive language. Deliver the integrated article, not the internal review ledger.

## Independent benchmark
Keep synthetic tests separate from real revisions. Record permission, locator, author, reviewer, both texts, preference and rationale. Sign the JSON record excluding signature using Ed25519; the operator supplies a trusted reviewer public key separately. A valid signature establishes possession of the key, not independence, permission or literary quality. Never count synthetic signatures as independent real reviews.

## Execution
`npm run editorial:v108 -- audit input.json` produces a report. `verify input.json report.json` recomputes it. Exit 0 means ready for independent review or report verified, 3 incomplete, 4 blocked, 2 invalid input. Existing v10.7 checks remain mandatory. Full nonfiction success-path qualification remains outstanding.
