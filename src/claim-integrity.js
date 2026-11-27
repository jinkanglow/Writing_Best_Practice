import {sha256} from './core.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const types=new Set(['thesis','fact','qualification','causal','conclusion','character_state','attribution']);
const decisions=new Set(['approve','reject']);
function validate(before,claims){
 if(!obj(claims)||!Array.isArray(claims.claims)||!claims.claims.length)throw Error('Nonempty claims inventory required');
 if(claims.beforeHash!==sha256(before))throw Error('Claims inventory stale');
 const seen=new Set();
 for(const c of claims.claims){
  if(!obj(c)||typeof c.id!=='string'||!c.id.trim()||seen.has(c.id)||!types.has(c.type)||typeof c.quote!=='string'||!c.quote.trim())throw Error('Invalid or duplicate claim');
  seen.add(c.id);
  if(!before.includes(c.quote))throw Error(`Claim quote not found: ${c.id}`);
  if(c.occurrence!==undefined&&(!Number.isSafeInteger(c.occurrence)||c.occurrence<0))throw Error('Invalid occurrence');
  const occurrences=before.split(c.quote).length-1;
  if(occurrences!==1&&c.occurrence===undefined)throw Error(`Ambiguous quote: ${c.id}; supply occurrence`);
  if(c.occurrence!==undefined&&c.occurrence>=occurrences)throw Error('Occurrence out of range');
 }
}
function compute(before,after,claims,review){
 validate(before,claims);
 if(review!==null&&(!obj(review)||review.beforeHash!==sha256(before)||review.afterHash!==sha256(after)||review.inventoryHash!==sha256(JSON.stringify(claims))||!Array.isArray(review.decisions)))throw Error('Review hashes or format invalid');
 const seen=new Set();
 for(const d of review?.decisions??[]){if(!obj(d)||!claims.claims.some(c=>c.id===d.claimId)||seen.has(d.claimId)||!decisions.has(d.action)||typeof d.reviewer!=='string'||!d.reviewer.trim()||typeof d.reason!=='string'||!d.reason.trim())throw Error('Invalid or duplicate review decision');seen.add(d.claimId);}
 const findings=claims.claims.map(c=>{
  const present=after.includes(c.quote);
  const d=review?.decisions.find(x=>x.claimId===c.id);
  const status=present?'TEXT_PRESENT':d?.action==='reject'?'REJECTED':d?.action==='approve'?'APPROVED_CHANGE':'REVIEW_REQUIRED';
  return {claimId:c.id,type:c.type,quoteHash:sha256(c.quote),status,reviewer:d?.reviewer??null};
 });
 const status=findings.some(x=>x.status==='REJECTED')?'BLOCKED':findings.some(x=>x.status==='REVIEW_REQUIRED')?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'3.8',beforeHash:sha256(before),afterHash:sha256(after),inventoryHash:sha256(JSON.stringify(claims)),reviewHash:review?sha256(JSON.stringify(review)):null,status,findings,limitations:['Declared quotes only; no automatic claim extraction','Text presence is not semantic equivalence','Reviewer decisions are not factual verification']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export const auditClaims=(before,after,claims,review=null)=>compute(before,after,claims,review);
export function verifyClaimAudit(before,after,claims,review,report){const expected=compute(before,after,claims,review);if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Claim audit differs from recomputed result');return {status:'CLAIM_AUDIT_RECOMPUTED',reportHash:expected.reportHash};}
