# Integrated editorial review

1. Draft from the author's thesis, sources and contribution ledger; avoid reproducing the source's outline by default.
2. Map claims to exact anchors and canonical propositions with scope. Record source lineage and contribution methods.
3. Run `npm run intelligence:audit` (synthetic fixture intentionally exits 4 pending review), or `node scripts/editorial-intelligence.js audit --file draft.md --plan plan.json --output report.json`.
4. Review the report. Resolve duplicate claims, repeated qualifications, lexical findings and source overlap. Check source accuracy and policy separately. Update the plan after edits, including its SHA-256 document hash.
5. Record `review` with `basis` equal to the current report's `reviewBasis`, `reviewer`, `author`, `policyEvidence`, `decision` (`approved` or `rejected`) and `decisions` containing each finding ID, reason and `retain` or `reject`. Do not fabricate approval. Changes to the draft, plan or rules invalidate the review basis.
6. Run audit again, then `verify --file draft.md --plan plan.json --report report.json`. Exit 0 means ready for review or report verified, 4 means blocked/incomplete audit, 2 means invalid input. Verification is not approval. Existing release gates remain separate and mandatory when applicable.
