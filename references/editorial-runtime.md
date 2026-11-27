# Unified editorial runtime

Input: `legacy` is the v10.9 input; `directiveCoverage` contains one row per parsed directive (`id`, `directiveId`, `decision`, `reason`). Map to a same-skill directive with compatible polarity. Unparsed lines may be classified as non-directive with a reason. Conditions still require editorial judgment.

Operator policy: `registry` uses v10.9 registry entries; `at` is the evaluation timestamp. Keep this policy outside author control. Audit returns `body`, which the authorized reviewer signs as UTF-8 JSON of `{...body, reviewer: reviewerId}` using Ed25519. Supply `approval: {reviewer, signature}` (base64). The signature binds the draft, input, registry and evaluation time. The operator must supply a current trusted evaluation time and independently establish identity and independence. Never ship private keys.

Evidence diagnostics verify exact quote and source hash, then report missing numeric tokens for review. They do not prove entailment. The inherited review chain remains authoritative for blockers and pending findings. `REVIEW_AUTHORIZED` means the recorded checks and signature passed, not that the article is objectively correct.

Benchmark input: array of `{id, origin, record}` with a v10.9 signed benchmark record. Real origin is declared; signature verification does not establish real-world provenance. Synthetic cases must never count as independent editorial evidence.

Exit codes: 0 completed, 2 malformed input, 3 incomplete, 4 blocked. Benchmark results must be inspected individually.
