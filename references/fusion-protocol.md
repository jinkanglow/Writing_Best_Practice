# Organic Skill Fusion — Editorial Operating Protocol

**Scope:** Fiction and narrative prose, with optional nonfiction adaptations. **Trigger:** `融合这两个技能`, `skill融合`, `把X规范应用到Y故事里`, `以X为主框架套用Y的语言标准`. An individual writer's bad-habit list can be a constraint skill. **Do not treat a style list as a second plot outline.**

## 0. Source authority and boundaries

- **Primary (A):** defines narrative purpose, required events, character relationships, causal arc, emotional movement, and non-negotiable scene functions.
- **Constraint (B):** defines language texture, lexical and syntactic warnings, scene-specific details, information density, and patterns of false profundity.
- **Fusion is translation, not stacking.** Every A anchor needs a concrete expression compatible with B *before drafting*.
- Explicit user requirements outrank either skill. Safety, factual integrity, and coherent characterization cannot be sacrificed to satisfy a stylistic prohibition.
- Preserve legitimate dialogue, exposition, interiority, repetition, punctuation, and deliberate abstraction when they perform a demonstrable narrative function. Anti-slop heuristics are not universal laws.

## 1. Decompose separately before prose

For A, record each **anchor ID**, required event, causal purpose, relevant characters, prior setup, emotional state before/after, scene location or narrative range, and whether the anchor is mandatory. Ask: what happens; why these people; where does emotion turn; which scene cannot be removed without changing causality?

For B, record each **constraint ID**, exact forbidden wording if any, preferred observable forms, sentence/voice rules, context exceptions, and evidence needed to justify a violation. Ask: what language is unacceptable; what habits recur; what concrete material replaces abstraction; what makes a paragraph earned rather than merely polished?

**Do not invent precise percentage beats.** Ranges such as 45–60% or 75–85% apply only if the primary skill explicitly requires them. Plot templates are optional, not universal.

## 2. Conflict adjudication before translation

1. A determines **where and why** a scene is needed; B determines **how** to render it.
2. Preserve the anchor while finding a different expression. For a required intimacy peak, replace generic declarations with an action that violates a character's established habit.
3. When B would make dialogue, point of view, or character behavior implausible, relax B narrowly and document the exception; do not erase the character's causal logic.
4. If no feasible scene meets both, mark `BLOCKED`, name the competing requirements, and return to translation. Do not silently skip either.
5. Exact-word prohibitions are literal constraints only when explicitly absolute and scoped to authorial prose. Do not rewrite quotations, character speech, or cited source text without permission.

## 3. Translate every anchor into observable prose

For each anchor, fill **anchor → scene → observable action/dialogue/object → causal purpose → applied constraints → setup/payoff**.

| Abstract anchor | Concrete rendering strategy | Failure condition |
| --- | --- | --- |
| Intimacy increases | One character does a small, previously unthinkable act, established earlier as meaningful | Act has no prior context; arbitrary gesture |
| Core fear affects behavior | Repeat a distinctive choice, bodily reaction, or avoidance with a consequence | Narrator merely labels the fear |
| Relationship warms | Change in distance, routine, practical care, or a withheld remark | Stock romance gesture without character-specific meaning |
| External obstacle | Let incompatible coping patterns collide under real pressure | Random villain or contrived misunderstanding supplies all causality |
| Dark moment | An established flaw drives a damaging choice, followed by an earned consequence | Character behaves unlike themselves solely to reach a beat |
| Growth | Repeat a previous situation with a different consequential choice | Character says “I changed” but makes no different decision |

For nonfiction, translate **claim → concrete evidence/mechanism → counterargument → limitation**, not into fictionalized scenes. Do not invent statistics or sources to improve texture.

## 4. Draft and review at emotional transitions

Review when a scene crosses a state boundary (approach → withdrawal, trust → doubt, conflict → compromise), not mechanically after every paragraph.

Ask three *diagnostic* questions:

1. **Structural necessity:** If removed, what causality, revelation, characterization, or pacing is lost? A removable breathing-space scene can still be useful; removal alone is not proof of failure.
2. **Specificity:** Would changing the names leave the scene unchanged? If yes, inspect for missing character history, situation, voice, and consequences. Universality alone is not a defect.
3. **Emotional honesty:** Can the reader infer the feeling from actions, dialogue, perceptions, or controlled interiority? Direct narration is allowed when perspective, rhythm, or clarity justify it.

Record `PASS`, `REVISE`, or `HUMAN_REVIEW` with a quoted excerpt and a proposed local edit. The CLI cannot determine these judgments automatically.

## 5. Anti-slop without overcorrection

Six layers: lexical clichés; empty sentence claims; repeated paragraph functions; uniform scene architecture; unsupported psychological or causal explanations; low incremental information value.

- **Hard bans:** user-specified exact phrases in applicable authorial prose; handle scoped exclusions explicitly.
- **Review flags:** “真正”, “确实”, “值得深思”, “他感到”, “她意识到”, etc. These are not always wrong. Replace only when they conceal absent information, repetitive explanation, or implausible interiority.
- **Repetition:** scan across the entire manuscript for reused gestures, identical emotional responses, and repeated scene endings. Repetition can be intentional motif; test whether each occurrence changes meaning.
- **Emotional peak → grounding detail:** often effective, never compulsory. A banal object without causal or sensory relevance is itself formulaic.
- **No invented ‘AI detection’ claim:** style signals cannot establish authorship.

## 6. Final closure

Audit **A**: all mandatory anchors present; causal setup/payoff; character knowledge and motivation; emotional turn; earned rupture; behavioral change. Audit **B**: exact prohibitions within scope; varied yet intentional syntax; specific actions; repeated motifs differentiated; no empty significance inflation. Audit **fusion**: every anchor has an expression plan, every conflict has a documented decision, no style edit removes an anchor, and no structural fix introduces new generic prose.

Output: (a) anchor map, (b) constraint map, (c) conflict register, (d) translation table, (e) drafted/revised text, (f) review log, (g) unresolved issues. Never claim automated verification of artistic quality.

## Machine-checkable boundary

`node scripts/fusion-plan.js audit --plan examples/fusion/romance-plan.json --output .writing/fusion-plan-report.json`

This validates schema, mapping completeness, references, unresolved conflicts, and three-question transition records. `READY_FOR_SEMANTIC_REVIEW` is **not** approval of the story, proof of a plausible action, or certification of compliance with natural-language style rules. Verify a report with `node scripts/fusion-plan.js verify --plan ... --report ...`.
