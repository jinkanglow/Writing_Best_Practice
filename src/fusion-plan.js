import {createHash} from 'node:crypto';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const allowed = new Set(['pending','resolved','blocked']);
export function auditFusionPlan(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw new TypeError('plan must be an object');
  if (plan.schemaVersion !== 1 || !nonempty(plan.primarySkill) || !nonempty(plan.constraintSkill)) throw new TypeError('schemaVersion=1 and named primary/constraint skills required');
  if (!Array.isArray(plan.anchors) || !plan.anchors.length || !Array.isArray(plan.constraints) || !Array.isArray(plan.translations) || !Array.isArray(plan.conflicts)) throw new TypeError('anchors, constraints, translations and conflicts arrays required');
  const issues = [], anchorIds = new Set(), constraintIds = new Set(), translationIds = new Set();
  for (const a of plan.anchors) {
    if (!a || !nonempty(a.id) || !nonempty(a.requirement) || !nonempty(a.function) || anchorIds.has(a.id)) issues.push({code:'INVALID_ANCHOR',id:a?.id??null});
    else anchorIds.add(a.id);
  }
  for (const c of plan.constraints) {
    if (!c || !nonempty(c.id) || !nonempty(c.rule) || !['hard','review'].includes(c.enforcement) || constraintIds.has(c.id)) issues.push({code:'INVALID_CONSTRAINT',id:c?.id??null});
    else constraintIds.add(c.id);
  }
  for (const t of plan.translations) {
    if (!t || !nonempty(t.anchorId) || !anchorIds.has(t.anchorId) || translationIds.has(t.anchorId)) { issues.push({code:'INVALID_TRANSLATION',id:t?.anchorId??null}); continue; }
    translationIds.add(t.anchorId);
    if (!nonempty(t.scene) || !nonempty(t.observableAction) || !nonempty(t.causalPurpose)) issues.push({code:'ABSTRACT_TRANSLATION',id:t.anchorId});
    if (!Array.isArray(t.constraintIds) || t.constraintIds.some(id=>!constraintIds.has(id))) issues.push({code:'UNKNOWN_CONSTRAINT',id:t.anchorId});
  }
  for (const id of anchorIds) if (!translationIds.has(id)) issues.push({code:'UNMAPPED_ANCHOR',id});
  const conflictIds = new Set();
  for (const c of plan.conflicts) {
    if (!c || !nonempty(c.id) || conflictIds.has(c.id) || !anchorIds.has(c.anchorId) || !constraintIds.has(c.constraintId) || !allowed.has(c.status)) {issues.push({code:'INVALID_CONFLICT',id:c?.id??null});continue;}
    conflictIds.add(c.id);
    if (c.status !== 'resolved') issues.push({code:'UNRESOLVED_CONFLICT',id:c.id});
    else if (!nonempty(c.resolution) || !nonempty(c.rationale)) issues.push({code:'UNJUSTIFIED_RESOLUTION',id:c.id});
  }
  if (!Array.isArray(plan.transitions)) issues.push({code:'MISSING_TRANSITIONS'});
  else for (const t of plan.transitions) if (!t || !nonempty(t.from) || !nonempty(t.to) || !nonempty(t.afterAnchorId) || !anchorIds.has(t.afterAnchorId) || !Array.isArray(t.questions) || t.questions.length !== 3 || t.questions.some(q=>!nonempty(q))) issues.push({code:'INVALID_TRANSITION',id:t?.afterAnchorId??null});
  const status = issues.length ? 'BLOCKED' : 'READY_FOR_SEMANTIC_REVIEW';
  const report = {schemaVersion:1,status,issues,anchorCount:anchorIds.size,translationCount:translationIds.size,disclaimer:'Structural completeness only; scene quality, character plausibility, emotional impact and anti-slop semantics require independent review.',planHash:hash(plan)};
  return {...report,reportHash:hash(report)};
}
export function verifyFusionPlan(plan, report) {
  const expected = auditFusionPlan(plan);
  return {status:JSON.stringify(expected)===JSON.stringify(report)?'VERIFIED':'INVALID_REPORT',expectedHash:expected.reportHash};
}
