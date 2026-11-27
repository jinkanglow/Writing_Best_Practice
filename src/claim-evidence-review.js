import {sha256} from './core.js';
import {auditAcquisitionEvidenceChain} from './acquisition-evidence-chain.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const str=x=>typeof x==='string'&&x.trim().length>0;
const fields=['entity','metric','value','unit','period','condition'];
const hash=x=>sha256(JSON.stringify(x));
/** Compare editor-declared claim fields against verified source excerpts. A match is not semantic entailment. */
export async function auditClaimEvidenceReview({root,records,links,allowedHosts,claims,reviews=[]}){
 if(!Array.isArray(claims)||!claims.length||!Array.isArray(reviews))throw Error('Nonempty claims and review array required');
 const chain=await auditAcquisitionEvidenceChain({root,records,links,allowedHosts});
 const verified=new Map(chain.bindings.map(b=>[b.id,b]));
 const linkMap=new Map(links.map(l=>[l.id,l]));
 const ids=new Set(),findings=[...chain.findings],rows=[],reviewMap=new Map();
 for(const r of reviews){if(!obj(r)||!str(r.claimId)||reviewMap.has(r.claimId)||!str(r.reviewer)||!str(r.rationale)||!['APPROVE','REJECT'].includes(r.decision))throw Error('Invalid or duplicate claim review');reviewMap.set(r.claimId,r);}
 for(const c of claims){
  if(!obj(c)||!str(c.id)||ids.has(c.id)||!str(c.linkId)||!obj(c.fields)||!obj(c.evidenceFields))throw Error('Invalid or duplicate claim');
  ids.add(c.id);
  if(!fields.every(f=>str(c.fields[f])))throw Error('Every claim field must be explicitly declared');
  const b=verified.get(c.linkId),l=linkMap.get(c.linkId),issues=[];
  if(!b||!l||b.factId!==c.id)issues.push('UNVERIFIED_OR_MISMATCHED_EVIDENCE_LINK');
  for(const f of fields){
   const ev=c.evidenceFields[f];
   if(!str(ev)){issues.push(`UNMAPPED_${f.toUpperCase()}`);continue;}
   if(!l?.quote.includes(ev))issues.push(`EVIDENCE_FIELD_NOT_IN_EXCERPT_${f.toUpperCase()}`);
   if(c.fields[f]!==ev)issues.push(`CLAIM_EVIDENCE_DIFFER_${f.toUpperCase()}`);
  }
  const r=reviewMap.get(c.id);
  if(r?.decision==='REJECT')issues.push('REVIEW_REJECTED');
  rows.push({claimId:c.id,linkId:c.linkId,issues,review:r?{decision:r.decision,reviewer:r.reviewer,rationale:r.rationale}:null});
  for(const code of issues)findings.push({code,claimId:c.id});
 }
 for(const id of reviewMap.keys())if(!ids.has(id))throw Error('Review refers to unknown claim');
 const blocked=findings.some(f=>['REVIEW_REJECTED','UNVERIFIED_OR_MISMATCHED_EVIDENCE_LINK'].includes(f.code))||chain.status==='BLOCKED';
 const payload={schemaVersion:'6.4',status:blocked?'BLOCKED':findings.length||rows.some(r=>!r.review)?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',chainHash:chain.reportHash,claimsHash:hash(claims),reviewsHash:hash(reviews),rows,findings,limitations:['Field equality and literal presence do not establish semantic entailment','Claims and evidence fields are editor declared','Approval records do not authenticate reviewer identity','Negation scope, accounting meaning, and inference validity require independent review']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyClaimEvidenceReview(inputs,report){const expected=await auditClaimEvidenceReview(inputs);if(!obj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Claim evidence review report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
