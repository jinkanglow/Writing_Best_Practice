# Machine-readable writing contracts

Skill prose is instructional and cannot be treated as a verified machine contract. A skill may declare exactly one `writing-contract` JSON fenced block. Requirements have a unique ID, obligation (`must`, `must_not`, `should`, `may`), exact value, and an array of scope identifiers. A scope `*` intersects every scope. Conflict detection is syntactic only. For semantic requirements, mark review needed in human guidance; do not mislabel them verified.
