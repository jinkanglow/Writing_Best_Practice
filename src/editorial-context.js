import {sha256} from './core.js';
import {auditCompression} from './editorial-compression.js';
import {auditEditorialOrchestration} from './editorial-orchestration.js';
const hash=x=>sha256(JSON.stringify(x));
const nonempty=x=>typeof x==='string'&&!!x.trim();
const norm=x=>x.normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');
const fields=['entity','period','metric','unit','condition','relation'];
export function auditContext(input){
 const {compression,contexts,qualifications,review}=input;
 const base=auditCompression(compression), blockers=[...base.blockers],pending=[...base.pending],pairs=[],novelty=[];
 const block=(code,id)=>blockers.push({code,id}),wait=(code,id)=>pending.push({code,id});
 const basis=hash({compression,contexts,qualifications});
 const valid=review?.basis===basis&&nonempty(review.author)&&nonempty(review.reviewer)&&review.author!==review.reviewer&&review.author===compression.review?.author;
 const approved=(group,id,decision)=>valid&&review[group]?.[id]?.decision===decision&&nonempty(review[group][id].reason);
 const all=[...compression.beforeClaims.map(c=>['before',c]),...compression.afterClaims.map(c=>['after',c])];
 if(!contexts||!Array.isArray(qualifications))throw Error('Contexts and qualifications required');
 for(const [side,c] of all){const x=contexts[side]?.[c.id];if(!x||fields.some(k=>!nonempty(x[k])))block('CONTEXT_MISSING',side+':'+c.id);}
 const key=(side,c)=>{const x=contexts[side]?.[c.id];return x&&fields.every(k=>nonempty(x[k]))?JSON.stringify(fields.map(k=>norm(x[k]))):null};
 for(const c of compression.beforeClaims){const target=compression.afterClaims.find(x=>x.id===compression.mapping[c.id]);if(target&&key('before',c)!==key('after',target))block('CONTEXT_DRIFT',c.id);}
 const list=compression.afterClaims;
 for(let i=0;i<list.length;i++){const c=list[i];const earlier=list.slice(0,i);const comparisons=[];for(const p of earlier){const same=key('after',c)!==null&&key('after',c)===key('after',p)&&['scope','kind','polarity','modality'].every(k=>norm(c[k])===norm(p[k]));if(!same)continue;const id=hash([p.id,c.id]);const decision=review?.pairs?.[id]?.decision;const accepted=['distinct','retain-repeat'].includes(decision)&&approved('pairs',id,decision);pairs.push({id,claims:[p.id,c.id],exactProposition:norm(p.proposition)===norm(c.proposition),decision:accepted?decision:'pending'});comparisons.push(id);if(!accepted)wait('CONTEXT_EQUIVALENCE_REVIEW',id);}
 const d=review?.novelty?.[c.id];const accepted=approved('novelty',c.id,'new')||approved('novelty',c.id,'necessary-repeat');if(!accepted||!nonempty(d?.contribution))wait('NOVELTY_REVIEW',c.id);novelty.push({id:c.id,section:c.section,comparisons,decision:accepted?d.decision:'pending'});}
 const ids=new Set();for(const q of qualifications){if(!nonempty(q.id)||ids.has(q.id)||!nonempty(q.beforeQuote)||!compression.before.includes(q.beforeQuote)||!['material','stylistic'].includes(q.kind)||!compression.beforeClaims.some(c=>c.id===q.claimId)){block('QUALIFICATION_INVALID',q.id);continue;}ids.add(q.id);const target=compression.afterClaims.find(c=>c.id===compression.mapping[q.claimId]);if(q.kind==='material'&&(!nonempty(q.afterQuote)||!target?.anchor.includes(q.afterQuote)))block('MATERIAL_QUALIFICATION_LOST',q.id);if(!approved('qualifications',q.id,q.kind==='material'?'preserved':'safe-to-consolidate'))wait('QUALIFICATION_REVIEW',q.id);}
 if(!approved('coverage','document','complete'))wait('QUALIFICATION_AND_CLAIM_COVERAGE_REVIEW','document');
 const payload={version:1,basis,baseHash:base.reportHash,pairs,novelty,blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_UNIFIED_REVIEW'};return {...payload,reportHash:hash(payload)};
}
export async function auditContextRelease({context,orchestration}){const c=auditContext(context),blockers=[...c.blockers],pending=[...c.pending];let o=null;if(!orchestration)pending.push({code:'ORCHESTRATION_REQUIRED'});else if(orchestration.text!==context.compression.after)blockers.push({code:'DOCUMENT_MISMATCH'});else{ if(orchestration.release?.before!=null&&orchestration.release.before!==context.compression.before)blockers.push({code:'REVISION_BASELINE_MISMATCH'}); o=await auditEditorialOrchestration(orchestration);blockers.push(...o.blockers);pending.push(...o.pending);if(o.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push({code:'ORCHESTRATION_NOT_READY'}); }const payload={version:1,contextHash:c.reportHash,orchestrationHash:o?.reportHash??null,blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW'};return {...payload,reportHash:hash(payload)};}
export async function verifyContextRelease(input,report){if(JSON.stringify(await auditContextRelease(input))!==JSON.stringify(report))throw Error('Report mismatch');return {status:'VERIFIED'};}
