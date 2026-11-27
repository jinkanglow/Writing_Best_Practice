import {sha256} from './core.js';
import {auditClaimEvidenceReview} from './claim-evidence-review.js';
const valid=x=>typeof x==='string'&&x.trim().length>0;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const hash=x=>sha256(JSON.stringify(x));
const dimensions=['negationScope','causalDirection','forecastConditions'];
/** A reviewer-attested inference contract, not a semantic entailment engine. */
export async function auditInferenceReview({root,records,links,allowedHosts,claims,reviews=[],inferences=[],inferenceReviews=[]}){
 if(!Array.isArray(inferences)||!Array.isArray(inferenceReviews))throw Error('Inference arrays required');
 const evidence=await auditClaimEvidenceReview({root,records,links,allowedHosts,claims,reviews});
 const claimIds=new Set(claims.map(c=>c.id)), seen=new Set(), decisions=new Map(),findings=[...evidence.findings],rows=[];
 for(const r of inferenceReviews){
  if(!object(r)||!valid(r.inferenceId)||decisions.has(r.inferenceId)||!valid(r.reviewer)||!valid(r.rationale)||!['APPROVE','REJECT'].includes(r.decision)||!dimensions.every(d=>['CHECKED','NOT_APPLICABLE'].includes(r[d])))throw Error('Invalid or duplicate inference review');
  decisions.set(r.inferenceId,r);
 }
 for(const i of inferences){
  if(!object(i)||!valid(i.id)||seen.has(i.id)||!valid(i.claimId)||!claimIds.has(i.claimId)||!valid(i.statement)||!valid(i.evidenceRationale)||!dimensions.every(d=>object(i[d])&&typeof i[d].applicable==='boolean'&&valid(i[d].explanation)))throw Error('Invalid inference declaration');
  seen.add(i.id);const r=decisions.get(i.id),issues=[];
  if(!r)issues.push('INFERENCE_REVIEW_MISSING');
  else{
   if(r.decision==='REJECT')issues.push('INFERENCE_REJECTED');
   for(const d of dimensions){if(i[d].applicable&&r[d]!=='CHECKED')issues.push(`REVIEW_REQUIRED_${d.toUpperCase()}`);if(!i[d].applicable&&r[d]!=='NOT_APPLICABLE')issues.push(`REVIEW_SCOPE_MISMATCH_${d.toUpperCase()}`);}
  }
  rows.push({id:i.id,claimId:i.claimId,issues,review:r??null});
  for(const code of issues)findings.push({code,inferenceId:i.id});
 }
 for(const id of decisions.keys())if(!seen.has(id))throw Error('Inference review references unknown inference');
 const unreviewedClaims=claims.filter(c=>!inferences.some(i=>i.claimId===c.id));
 for(const c of unreviewedClaims)findings.push({code:'CLAIM_INFERENCE_INVENTORY_MISSING',claimId:c.id});
 const blocked=evidence.status==='BLOCKED'||findings.some(f=>f.code==='INFERENCE_REJECTED');
 const payload={schemaVersion:'6.5',status:blocked?'BLOCKED':findings.length||evidence.status!=='READY_FOR_HUMAN_REVIEW'?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',evidenceReportHash:evidence.reportHash,inferencesHash:hash(inferences),inferenceReviewsHash:hash(inferenceReviews),rows,findings,limitations:['Reviewer attestations do not prove semantic entailment or causality','The inference inventory is editor-declared and may omit claims','Reviewer identity and source publisher authenticity are not independently verified']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyInferenceReview(inputs,report){const expected=await auditInferenceReview(inputs);if(!object(report)||JSON.stringify(report)!==JSON.stringify(expected))throw Error('Inference review report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
