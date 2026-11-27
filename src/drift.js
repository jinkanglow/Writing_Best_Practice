import {createHash} from 'node:crypto';
import {evaluateBenchmark} from './benchmark.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const kinds=new Set(['thesis_reversal','fact_addition','fact_removal','causal_inversion','character_state_conflict']);
const labels=new Set(['violation','no_violation']);
const predictions=new Set(['violation','no_violation','abstain']);
const required=(s,name)=>{if(typeof s!=='string'||!s.trim())throw new Error(`Missing ${name}`);return s;};
export function validateDriftCases(cases){
 if(!Array.isArray(cases)||!cases.length)throw new Error('Nonempty drift cases required');
 const ids=new Set();
 return cases.map(c=>{
  if(!obj(c)||ids.has(c.id))throw new Error('Invalid or duplicate drift case');
  required(c.id,'case id');ids.add(c.id);
  required(c.before,'before');required(c.after,'after');
  if(!kinds.has(c.kind)||!labels.has(c.gold))throw new Error(`Invalid drift kind or gold: ${c.id}`);
  if(!obj(c.goldEvidence)||!['before','after'].includes(c.goldEvidence.side)||typeof c.goldEvidence.quote!=='string'||!c.goldEvidence.quote.trim()||!(c.goldEvidence.side==='before'?c.before:c.after).includes(c.goldEvidence.quote))throw new Error(`Ungrounded gold evidence: ${c.id}`);
  if(!obj(c.annotation)||!Array.isArray(c.annotation.reviewers)||new Set(c.annotation.reviewers).size<2||c.annotation.reviewers.some(r=>typeof r!=='string'||!r.trim())||c.annotation.method!=='independent_consensus')throw new Error(`Missing independent-consensus declaration: ${c.id}`);
  return {id:c.id,kind:c.kind,beforeHash:hash(c.before),afterHash:hash(c.after),gold:c.gold};
 });
}
export function prepareDriftTasks(cases){
 const validated=validateDriftCases(cases);
 return {schemaVersion:'2.7',status:'PREPARED',tasks:cases.map((c,i)=>({id:c.id,kind:c.kind,before:c.before,after:c.after,beforeHash:validated[i].beforeHash,afterHash:validated[i].afterHash})),limitations:['Gold labels are excluded from prediction tasks','Reviewer independence is declared, not authenticated']};
}
export function evaluateDrift(cases,predictionEnvelope){
 const validated=validateDriftCases(cases);
 if(!obj(predictionEnvelope)||predictionEnvelope.schemaVersion!=='2.7'||!Array.isArray(predictionEnvelope.predictions)||!obj(predictionEnvelope.provider)||!required(predictionEnvelope.provider.name,'provider name')||!required(predictionEnvelope.provider.model,'model name'))throw new Error('Invalid prediction envelope');
 const expected=new Map(validated.map((c,i)=>[c.id,{...c,source:cases[i]}]));
 const seen=new Set(),rows=[],errors=[];
 for(const p of predictionEnvelope.predictions){
  if(!obj(p)||!expected.has(p.id)||seen.has(p.id)||!predictions.has(p.prediction))throw new Error('Invalid, unknown or duplicate prediction');
  seen.add(p.id);const c=expected.get(p.id);
  if(p.beforeHash!==c.beforeHash||p.afterHash!==c.afterHash)throw new Error(`Stale prediction: ${p.id}`);
  if(p.prediction!=='abstain'){
   if(!obj(p.evidence)||!['before','after'].includes(p.evidence.side)||typeof p.evidence.quote!=='string'||!p.evidence.quote.trim()||!(p.evidence.side==='before'?c.source.before:c.source.after).includes(p.evidence.quote))throw new Error(`Ungrounded prediction evidence: ${p.id}`);
  } else if(p.evidence!==undefined)throw new Error('Abstention must not claim supporting evidence');
  rows.push({id:p.id,category:c.kind,gold:c.gold,prediction:p.prediction});
  if(p.prediction==='abstain'||p.prediction!==c.gold)errors.push({id:p.id,kind:c.kind,gold:c.gold,prediction:p.prediction,type:p.prediction==='abstain'?'ABSTAIN':p.prediction==='violation'?'FALSE_POSITIVE':'FALSE_NEGATIVE',goldEvidence:c.source.goldEvidence,predictionEvidence:p.evidence??null});
 }
 for(const c of validated)if(!seen.has(c.id)){
  rows.push({id:c.id,category:c.kind,gold:c.gold,prediction:'abstain'});
  errors.push({id:c.id,kind:c.kind,gold:c.gold,prediction:'abstain',type:'MISSING_PREDICTION',goldEvidence:expected.get(c.id).source.goldEvidence,predictionEvidence:null});
 }
 const metrics=evaluateBenchmark(rows);
 return {schemaVersion:'2.7',status:seen.size===cases.length?'EVALUATED':'INCOMPLETE',provider:predictionEnvelope.provider,metrics,errors,missingPredictions:cases.length-seen.size,limitations:['Self-declared annotator independence is not independently verified','Quote existence is not semantic entailment','Synthetic examples do not measure real-world model accuracy']};
}
