import {sha256} from './core.js';
import {auditInferenceDependencies} from './inference-dependency.js';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const hash=x=>sha256(JSON.stringify(x));
/** Review attestations are not evidence of truth or actual falsification. */
export async function auditCounterarguments(inputs){
 const {inferences,counterarguments,counterargumentReviews}=inputs;
 if(!Array.isArray(inferences)||!Array.isArray(counterarguments)||!Array.isArray(counterargumentReviews))throw Error('Counterargument and review arrays required');
 const upstream=await auditInferenceDependencies(inputs);
 const ids=new Set(inferences.map(x=>x.id)), entries=new Map(),reviews=new Map();
 for(const entry of counterarguments){
  if(!object(entry)||!nonempty(entry.inferenceId)||!ids.has(entry.inferenceId)||entries.has(entry.inferenceId)||!Array.isArray(entry.alternatives)||entry.alternatives.length===0||!Array.isArray(entry.falsifiers)||entry.falsifiers.length===0)throw Error('Invalid or duplicate counterargument declaration');
  const seen=new Set();
  for(const a of entry.alternatives){
   if(!object(a)||!nonempty(a.id)||!nonempty(a.explanation)||!nonempty(a.discriminatingEvidence)||seen.has(a.id))throw Error('Invalid or duplicate alternative');
   seen.add(a.id);
  }
  seen.clear();
  for(const f of entry.falsifiers){
   if(!object(f)||!nonempty(f.id)||!nonempty(f.condition)||!nonempty(f.observable)||!nonempty(f.consequence)||seen.has(f.id))throw Error('Invalid or duplicate falsifier');
   seen.add(f.id);
  }
  entries.set(entry.inferenceId,entry);
 }
 for(const review of counterargumentReviews){
  if(!object(review)||!nonempty(review.inferenceId)||!ids.has(review.inferenceId)||reviews.has(review.inferenceId)||!nonempty(review.reviewer)||!nonempty(review.rationale)||!['APPROVE','REJECT'].includes(review.decision)||!Array.isArray(review.alternativeReviews)||!Array.isArray(review.falsifierReviews))throw Error('Invalid or duplicate counterargument review');
  reviews.set(review.inferenceId,review);
 }
 const findings=[],rows=[];
 for(const inference of inferences){
  const entry=entries.get(inference.id),review=reviews.get(inference.id),issues=[];
  if(!entry)issues.push('COUNTERARGUMENT_DECLARATION_MISSING');
  if(!review)issues.push('COUNTERARGUMENT_REVIEW_MISSING');
  if(entry&&review){
   const check=(expected,actual,kind)=>{
    const seen=new Set();
    for(const r of actual){
     if(!object(r)||!nonempty(r.id)||seen.has(r.id)||!nonempty(r.rationale)||!['CONSIDERED','UNRESOLVED','REJECTED'].includes(r.decision)||!expected.some(x=>x.id===r.id))throw Error(`Invalid or duplicate ${kind} review`);
     seen.add(r.id);
     if(r.decision==='UNRESOLVED')issues.push(`${kind}_UNRESOLVED`);
     if(r.decision==='REJECTED')issues.push(`${kind}_REVIEW_REJECTED`);
    }
    for(const e of expected)if(!seen.has(e.id))issues.push(`${kind}_REVIEW_MISSING`);
   };
   check(entry.alternatives,review.alternativeReviews,'ALTERNATIVE');
   check(entry.falsifiers,review.falsifierReviews,'FALSIFIER');
   if(review.decision==='REJECT')issues.push('COUNTERARGUMENT_REJECTED');
  }
  const status=issues.some(x=>x.includes('REJECTED'))?'BLOCKED':issues.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
  rows.push({inferenceId:inference.id,status,issues});
  for(const code of issues)findings.push({inferenceId:inference.id,code});
 }
 const blocked=upstream.status==='BLOCKED'||rows.some(x=>x.status==='BLOCKED');
 const payload={schemaVersion:'6.7',status:blocked?'BLOCKED':upstream.status!=='READY_FOR_HUMAN_REVIEW'||findings.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',dependencyReportHash:upstream.reportHash,counterargumentsHash:hash(counterarguments),counterargumentReviewsHash:hash(counterargumentReviews),rows,findings,limitations:['Competing explanations and falsifiers are editor-declared and may be incomplete','Review labels do not establish logical validity, evidence quality, or actual falsification','Reviewer identity is not independently authenticated']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyCounterarguments(inputs,report){const expected=await auditCounterarguments(inputs);if(!object(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Counterargument report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
