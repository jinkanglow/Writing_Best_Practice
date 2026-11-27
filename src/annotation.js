// Independent annotation and prediction joining. No model-produced labels are trusted as gold.
import {createHash} from 'node:crypto';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const sha=x=>createHash('sha256').update(x).digest('hex');
const verdicts=new Set(['violation','no_violation','uncertain']);
const predictions=new Set(['violation','no_violation','abstain']);
function unique(rows,what){if(!Array.isArray(rows)||!rows.length)throw new Error(`${what} must be a nonempty array`);const seen=new Set();for(const row of rows){if(!obj(row)||typeof row.id!=='string'||!row.id.trim()||seen.has(row.id))throw new Error(`Invalid or duplicate ${what} id`);seen.add(row.id);}return rows;}
export function prepareAnnotationCases(cases){
 unique(cases,'case');
 return {schemaVersion:'2.4',cases:cases.map(c=>{
  if(typeof c.category!=='string'||!c.category.trim()||typeof c.text!=='string'||!c.text.trim()||typeof c.ruleId!=='string'||!c.ruleId.trim())throw new Error(`Invalid case ${c.id}`);
  return {id:c.id,category:c.category,ruleId:c.ruleId,textSha256:sha(c.text),text:c.text};
 }),instructions:'Each annotator independently labels violation, no_violation, or uncertain and provides a rationale. Do not view model predictions.'};
}
export function adjudicateAnnotations(cases,annotations,{requireTwo=true}={}){
 const prepared=prepareAnnotationCases(cases);if(!Array.isArray(annotations))throw new Error('Annotations must be an array');
 const known=new Map(prepared.cases.map(c=>[c.id,c]));const grouped=new Map();const keys=new Set();
 for(const a of annotations){
  if(!obj(a)||!known.has(a.id)||typeof a.annotator!=='string'||!a.annotator.trim()||!verdicts.has(a.label)||typeof a.rationale!=='string'||!a.rationale.trim()||a.textSha256!==known.get(a.id).textSha256)throw new Error(`Invalid annotation for ${a?.id}`);
  const key=`${a.id}\0${a.annotator}`;if(keys.has(key))throw new Error('Duplicate annotation by same annotator');keys.add(key);
  const group=grouped.get(a.id)??[];group.push(a);grouped.set(a.id,group);
 }
 const resolved=[],review=[];
 for(const c of prepared.cases){
  const labels=grouped.get(c.id)??[];const distinct=new Set(labels.map(a=>a.annotator));
  const consensus=labels.length>=(requireTwo?2:1)&&distinct.size==labels.length&&labels.every(a=>a.label===labels[0].label)&&labels[0].label!=='uncertain';
  if(consensus)resolved.push({id:c.id,category:c.category,gold:labels[0].label,textSha256:c.textSha256,annotators:labels.map(a=>a.annotator)});
  else review.push({id:c.id,status:labels.length<(requireTwo?2:1)?'INSUFFICIENT_ANNOTATIONS':'NEEDS_ADJUDICATION',labels:labels.map(a=>({annotator:a.annotator,label:a.label}))});
 }
 return {schemaVersion:'2.4',status:review.length?'INCOMPLETE':'CONSENSUS_COMPLETE',resolved,review,limitations:['Agreement is not proof that the label is correct','Disputed cases require independent adjudication and must not be silently excluded from published benchmark claims']};
}
export function joinPredictions(adjudicated,predictionRows){
 if(!obj(adjudicated)||adjudicated.schemaVersion!=='2.4'||!Array.isArray(adjudicated.resolved)||!Array.isArray(adjudicated.review))throw new Error('Invalid adjudication report');
 if(adjudicated.review.length)throw new Error('Unresolved annotations: benchmark is incomplete');
 unique(predictionRows,'prediction');const map=new Map(predictionRows.map(p=>[p.id,p]));
 if(predictionRows.length!==adjudicated.resolved.length)throw new Error('Prediction count mismatch');
 return adjudicated.resolved.map(g=>{const p=map.get(g.id);if(!p||!predictions.has(p.prediction)||p.textSha256!==g.textSha256)throw new Error(`Invalid prediction or text hash for ${g.id}`);return {id:g.id,category:g.category,gold:g.gold,prediction:p.prediction};});
}
