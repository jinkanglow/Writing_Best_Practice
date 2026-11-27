import {sourceDigest,sourceContains} from './editorial-evidence-session.js';
import {sha256,parseMarkdown} from './core.js';
import {auditEditorialIntelligence} from './editorial-intelligence.js';
import {auditUnifiedRelease} from './craft-unified-release.js';
const hash=x=>sha256(JSON.stringify(x));
const norm=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const nonempty=s=>typeof s==='string'&&s.trim().length>0;
export function extractClaimCandidates(text){
 if(!nonempty(text))throw Error('Document required');
 return parseMarkdown(text).nodes.filter(n=>['prose','list_item'].includes(n.kind)).flatMap(n=>Array.from(n.maskedText.matchAll(/[^.!?。！？\n]+(?:[.!?。！？]+|$)/gu)).filter(m=>m[0].trim()).map(m=>({line:n.startLine,quote:m[0].trim(),id:hash([n.startLine,m.index,m[0]])})));
}
export async function auditEditorialOrchestration({text,plan,rules,catalog,policy,evidence={},release=null}){
 const base=auditEditorialIntelligence(text,plan,rules,catalog,policy),pending=[],blockers=[],findings=[];
 const wait=(code,id)=>pending.push({code,id}),block=(code,id)=>blockers.push({code,id});
 const candidates=extractClaimCandidates(text),sources=new Map(plan.sources.map(s=>[s.id,s]));
 const sourceKeys=new Map(plan.sources.map(s=>[s.id,sourceDigest(JSON.stringify(norm(s.text)))]));
 const lineage=new Map(base.graph.map(g=>[g.claimId,g.declaredRoots.map(r=>sourceKeys.get(r))]));
 for(const g of base.graph){const distinct=new Set(lineage.get(g.claimId));if(g.declaredRoots.length>distinct.size)findings.push({code:'DUPLICATE_ROOT_CONTENT',id:g.claimId});}
 const basis=hash({text,plan:{...plan,review:undefined},candidates,evidence:{...evidence,review:undefined},rules,catalog,policy});
 const review=evidence.review;
 const valid=review?.basis===basis&&nonempty(review.reviewer)&&nonempty(review.author)&&review.reviewer!==review.author&&review.author===plan.review?.author;
 if(!valid)wait('BOUND_EDITOR_REVIEW_REQUIRED','document');
 for(const c of candidates){const d=valid&&review.candidates?.[c.id];if(!d||!nonempty(d.reason)||!['claim','nonclaim'].includes(d.kind))wait('CANDIDATE_UNREVIEWED',c.id);else if(d.kind==='claim'&&(!Array.isArray(d.claimIds)||!d.claimIds.length||d.claimIds.some(id=>!plan.claims.some(p=>p.id===id&&p.line===c.line&&c.quote.includes(p.anchor)))))block('CLAIM_MAPPING_INVALID',c.id);}
 for(const c of plan.claims){if(!c.sources.length)continue;for(const id of c.sources){const e=evidence.support?.[c.id]?.[id];if(!e||!nonempty(e.quote)||!sourceContains(sources.get(id).text,e.quote)){block('SOURCE_QUOTE_MISSING',c.id+':'+id);continue;}const d=valid&&review.entailment?.[c.id]?.[id];if(!d||!nonempty(d.reason)||!['supports','partial','contradicts','irrelevant'].includes(d.decision))wait('ENTAILMENT_REVIEW_REQUIRED',c.id+':'+id);else if(d.decision!=='supports')block('ENTAILMENT_NOT_SUPPORTED',c.id+':'+id);}}
 for(const s of plan.sources){const d=valid&&review.lineage?.[s.id];if(!d||!nonempty(d.reason)||d.contentHash!==sourceKeys.get(s.id)||d.decision!=='confirmed')wait('SOURCE_LINEAGE_REVIEW_REQUIRED',s.id);}
 for(const c of plan.contributions){const a=evidence.artifacts?.[c.id];if(!a||!nonempty(a.content)||a.hash!==sha256(a.content)){block('CONTRIBUTION_ARTIFACT_INVALID',c.id);continue;}const d=valid&&review.contributions?.[c.id];if(!d||!nonempty(d.reason)||d.artifactHash!==a.hash||d.decision!=='confirmed')wait('CONTRIBUTION_REVIEW_REQUIRED',c.id);}
 for(const f of findings){const d=valid&&review.findings?.[f.id];if(!d||!nonempty(d.reason)||d.decision!=='acknowledged')wait(f.code,f.id);}
 const q=valid&&review.progression;if(!q||!nonempty(q.reason)||q.decision!=='approved')wait('ARGUMENT_PROGRESSION_REVIEW_REQUIRED','document');
 blockers.push(...base.blockers);pending.push(...base.pending);
 let legacy=null;if(!release)wait('UNIFIED_RELEASE_REQUIRED','document');else if(release.text!==text)block('RELEASE_DOCUMENT_MISMATCH','document');else{legacy=await auditUnifiedRelease({...release,required:['workflow','evidence','coverage','coherence',...(release.before!=null?['structure']:[])],requireLegacy:true});blockers.push(...legacy.blockers);pending.push(...legacy.pending);if(legacy.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')wait('UNIFIED_RELEASE_NOT_READY','document');}
 const payload={version:1,basis,candidates,findings,baseHash:base.reportHash,releaseHash:legacy?.reportHash??null,blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW'};return {...payload,reportHash:hash(payload)};
}
export async function verifyEditorialOrchestration(inputs,report){if(JSON.stringify(await auditEditorialOrchestration(inputs))!==JSON.stringify(report))throw Error('Report mismatch');return {status:'VERIFIED'};}
