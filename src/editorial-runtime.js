import {sourceDigest,sourceContains} from './editorial-evidence-session.js';
import {auditV109,reviewerRegistry,verifyRegisteredBenchmark} from './editorial-v109.js';
import {sha256} from './core.js';
import {verify,createPublicKey} from 'node:crypto';
const hash=x=>sha256(JSON.stringify(x));
const text=x=>typeof x==='string'&&!!x.trim();
export function verifyIdentity(registry,at,review,body){
 const trust=reviewerRegistry(registry,at);
 if(!review||!text(review.reviewer)||review.reviewer===body.author||!Object.hasOwn(trust,review.reviewer)||!text(review.signature))return false;
 return verify(null,Buffer.from(JSON.stringify({...body,reviewer:review.reviewer})),createPublicKey(trust[review.reviewer]),Buffer.from(review.signature,'base64'));
}
export function evidenceReasoning(claim,source,link){
 if(!text(claim)||!text(source)||!text(link?.quote)||!sourceContains(source,link.quote)||link.sourceHash!==sourceDigest(source))return {status:'INVALID_EVIDENCE'};
 const numbers=s=>[...s.matchAll(/\d+(?:\.\d+)?%?/g)].map(m=>m[0]);
 const missing=numbers(claim).filter(n=>!numbers(link.quote).includes(n));
 return {status:'SEMANTIC_REVIEW_REQUIRED',missingNumbers:[...new Set(missing)]};
}
export async function runEditorial(input,{registry,at}={}){
 const base=await auditV109(input.legacy),f=input.legacy.previous.previous.legacy.fusion;
 const blockers=[...base.blockers],pending=[...base.pending];
 const {approval,...payload}=input;const basis=hash(payload),body={purpose:'editorial-release-v11',basis,author:f.review?.author,draftHash:sha256(f.draft),registryHash:hash(registry),at};
 const mappings=input.directiveCoverage??[];const directives=input.legacy.previous.previous.directives;
 for(const d of base.parsed){const matches=mappings.filter(m=>m.id===d.id),m=matches[0];const target=directives.find(x=>x.id===m?.directiveId&&x.skillId===d.skillId);if(matches.length!==1||!text(m?.reason)||!(m?.decision==='mapped'&&target&&(!d.action||target.action===d.action)||m?.decision==='non-directive'&&d.status==='unparsed'))blockers.push({code:'DIRECTIVE_COVERAGE_INVALID',id:d.id});}
 for(const m of mappings)if(!base.parsed.some(d=>d.id===m.id))blockers.push({code:'UNKNOWN_DIRECTIVE',id:m.id});
 const evidence=[];if(f.mode==='nonfiction'){const q=input.legacy.previous.previous.legacy.editorial?.qualification;const release=q?.orchestration?.release, compression=q?.context?.compression; if(!compression||typeof release?.before!=='string'||release.before!==compression.before||release.text!==compression.after||release.legacy?.before!==compression.before||release.legacy?.after!==compression.after)blockers.push({code:'REVISION_BASELINE_MISMATCH'});for(const e of input.legacy.previous.evidenceLinks??[]){const claim=q?.context.compression.afterClaims.find(c=>c.id===e.claimId),source=q?.orchestration.plan.sources.find(s=>s.id===e.sourceId);const r=evidenceReasoning(claim?.anchor,source?.text,e);evidence.push({id:hash(e),...r});if(r.status==='INVALID_EVIDENCE')blockers.push({code:'EVIDENCE_INVALID',id:e.claimId});}}
 if(!verifyIdentity(registry,at,approval,body))pending.push({code:'SIGNED_RELEASE_REVIEW_REQUIRED'});
 const result={basis,body,legacyHash:base.reportHash,evidence,blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'REVIEW_AUTHORIZED'};return {...result,reportHash:hash(result)};
}
export async function verifyEditorial(input,policy,report){if(JSON.stringify(await runEditorial(input,policy))!==JSON.stringify(report))throw Error('Report mismatch');return {status:'VERIFIED'};}
export function executeBenchmark(cases,registry,at){if(!Array.isArray(cases)||!cases.length)throw Error('Cases required');const ids=new Set();const results=cases.map(c=>{if(!text(c.id)||ids.has(c.id)||!['synthetic','real'].includes(c.origin)||c.record?.id!==c.id)throw Error('Invalid case');ids.add(c.id);const result=verifyRegisteredBenchmark(c.record,registry,at);return {id:c.id,origin:c.origin,status:result.status,preference:result.status==='SIGNATURE_VERIFIED'?c.record.preference:null};});return {results,authenticatedRealRecords:results.filter(r=>r.origin==='real'&&r.status==='SIGNATURE_VERIFIED').length,independentlyVerifiedRealCases:0};}
