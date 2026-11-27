# Skill Fusion: end-to-end operating guide

**Activation:** “融合这两个技能”, “skill融合”, “把X规范应用到Y故事里”, “以X为主框架套用Y的语言标准”.

1. Identify the primary structural skill and secondary language skill (or personal habit list). Ask for missing documents only when the structural requirements cannot be extracted.
2. Read each skill separately. Produce a numbered anchor ledger and scoped constraint ledger. Keep source wording distinguishable from your interpretation.
3. Register contradictions. Primary controls scene position/function; secondary controls expression; coherent characterization overrides mechanical style restrictions. Unresolved contradictions block drafting.
4. Map each anchor to a specific scene and consequential action. Add prior setup and future payoff; avoid generic object insertion.
5. Use `examples/fusion/romance-plan.json` as a JSON format example. Run `node scripts/fusion-plan.js audit --plan FILE --output REPORT`.
6. Draft by scenes. At emotional state changes, ask structural necessity, character specificity, and emotional legibility. Do not treat these questions as binary proof.
7. Scan the entire work for repeated reactions and repeated paragraph functions. Use `references/fusion-anti-slop.md`; preserve intentional motifs.
8. Audit both skill layers after revision. Report what is machine-checked and what remains an editorial judgment.

**Error handling:** CLI returns exit 2 for malformed input; exit 4 for a structurally blocked plan; exit 0 for a structurally complete plan or verified report. Do not interpret exit 0 as artistic approval.

**Source-informed craft:** Narrative timing, character transformation, language rhythm, point of view, selective telling, practical drafting, revision, and the distinction between scene and summary inform the workflow. These are adapted editorial practices, not excerpts or a reproduction of any uploaded source.
