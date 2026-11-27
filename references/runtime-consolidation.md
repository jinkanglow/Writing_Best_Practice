# Runtime consolidation

The v11.1 path removes two redundant internal report recomputations. Public verification still recomputes independently. A request-local cache shares exact source digests and quote membership checks across the v10.4, v10.8, v11.0 and orchestration stages. It never caches semantic approval. Cache counters cover only these instrumented operations, not all evidence checks. Findings with matching code, ID, origin and detail are grouped with occurrence counts. Historical stage dependencies remain.

## Identity policy

The operator supplies registry, evaluation date, authority public keys and signed attestations. An attestation binds purpose `reviewer-identity-v11.1`, reviewer ID, SHA256 of canonical SPKI PEM (`keyHash`), identityRef, method, issuer, from and until. Sign JSON serialization of those fields with the issuer's Ed25519 key; append base64 signature. This verifies an authority's assertion, not real identity or independence. Do not accept authorities from the article author without independent trust provisioning. Never store private keys in the repository.

## Benchmark qualification

Reject duplicate before/after pairs, verify review signatures and identity attestations. A declared real case requires locator and permission. Qualified declared cases are not independently verified cases. No real editorial dataset is supplied in this release. The full nonfiction success path remains unqualified; do not bypass legacy blockers to manufacture a passing fixture.
