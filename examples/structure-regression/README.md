# Structure regression input contract

The gate recomputes the document hash and paragraph inventory; never reuse reviews after editing the revised document.

`links.json`: `[ {"from":"p-1","to":"p-2","kind":"transition"} ]`

`checks.json`: `[ {"id":"p-1","decision":"PASS","reviewer":"editor-1","rationale":"Unique mechanism and transition checked","afterHash":"<sha256 of exact revised document>"} ]`

Every revised paragraph needs a separate check. No source or semantic verification is inferred from these records.
