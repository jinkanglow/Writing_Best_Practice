// Explicit adjudication and error audit. Reviewer identity is self-declared.
import {createHash} from 'node:crypto';
import {prepareAnnotationCases, joinPredictions} from './annotation.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const labels=new Set(['violation','no_violation']);
export function resolveDisagreements(cases,initial,decisions){
 const prepared=prepareAnnotationCases(cases);
 if(!isObject(initial)||initial.schemaVersion!=='2.4'||!Array.isArray(initial.resolved)||!Array.isArray(initial.review)||!Array.isArray(decisions))throw Error('Invalid adjudication input');
 const known=new Map(prepared.cases.map(c=>[c.id,c]));
 const resolved=new Map();
 for(const r of initial.resolved){const c=known.get(r.id);if(!c||resolved.has(r.id)||r.textSha256!==c.textSha256||!labels.has(r.gold))throw Error('Invalid consensus record');resolved.set(r.id,{...r});}
 const pending=new Map();
 for(const r of initial.review){if(!known.has(r.id)||pending.has(r.id)||resolved.has(r.id))throw Error('Invalid pending review');pending.set(r.id,r);}
 if(resolved.size+pending.size!==known.size)throw Error('Missing cases in initial adjudication');
 const used=new Set(),audit=[];
 for(const d of decisions){
  if(!isObject(d)||!pending.has(d.id)||used.has(d.id)||!labels.has(d.gold)||typeof d.adjudicator!=='string'||!d.adjudicator.trim()||typeof d.rationale!=='string'||!d.rationale.trim()||d.textSha256!==known.get(d.id).textSha256)throw Error('Invalid adjudication decision');
  const original=pending.get(d.id);
  if(!Array.isArray(original.labels)||original.labels.some(a=>a.annotator===d.adjudicator))throw Error('Adjudicator must differ from original annotators');
  used.add(d.id);
  resolved.set(d.id,{id:d.id,category:known.get(d.id).category,gold:d.gold,textSha256:d.textSha256,adjudication:{adjudicator:d.adjudicator,rationale:d.rationale,originalLabels:original.labels}});
  audit.push({id:d.id,adjudicator:d.adjudicator,originalLabels:original.labels,finalLabel:d.gold,rationale:d.rationale});
 }
 const review=[...pending.values()].filter(r=>!used.has(r.id));
 return {schemaVersion:'2.4',status:review.length?'INCOMPLETE':'ADJUDICATED',resolved:prepared.cases.filter(c=>resolved.has(c.id)).map(c=>resolved.get(c.id)),review,audit,limitations:['Adjudicator identity and independence are self-declared','Decisions are not independently verified as correct']};
}
export function analyzePredictionErrors(cases,adjudicated,predictions){
 const prepared=prepareAnnotationCases(cases);
 const byId=new Map(prepared.cases.map(c=>[c.id,c]));
 if(!isObject(adjudicated)||!Array.isArray(adjudicated.resolved)||adjudicated.resolved.length!==prepared.cases.length)throw Error('Benchmark must contain all cases');
 const rows=joinPredictions(adjudicated,predictions);
 const byPred=new Map(predictions.map(p=>[p.id,p]));
 const errors=rows.filter(r=>r.gold!==r.prediction).map(r=>{
  const c=byId.get(r.id);if(!c||c.textSha256!==hash(c.text))throw Error('Case text integrity mismatch');
  const p=byPred.get(r.id);
  if(p.evidenceQuote!==undefined&&(typeof p.evidenceQuote!=='string'||!p.evidenceQuote.trim()||!c.text.includes(p.evidenceQuote)))throw Error(`Fabricated evidence quote for ${r.id}`);
  return {id:r.id,category:r.category,ruleId:c.ruleId,gold:r.gold,prediction:r.prediction,errorType:r.prediction==='abstain'?'ABSTENTION':r.gold==='violation'?'FALSE_NEGATIVE':'FALSE_POSITIVE',sourceText:c.text,textSha256:c.textSha256,evidenceQuote:p.evidenceQuote??null,modelRationale:typeof p.rationale==='string'?p.rationale:null,adjudication:adjudicated.resolved.find(x=>x.id===r.id)?.adjudication??null};
 });
 return {schemaVersion:'2.5',status:'AUDITED',total:rows.length,errorCount:errors.length,errors,limitations:['Source quotation match does not establish semantic correctness','Synthetic or self-declared labels do not establish real-world model accuracy']};
}
