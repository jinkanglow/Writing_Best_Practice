import {sourceDigest,sourceContains} from './editorial-evidence-session.js';
import {sha256} from './core.js';
import {prepareParagraphRevision} from './craft-paragraph.js';
const hash=x=>sha256(JSON.stringify(x));
const valid=x=>typeof x==='string'&&x.trim().length>0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const types=['FACT','INFERENCE','MECHANISM','COUNTERARGUMENT','RESPONSE','CONCLUSION'];
export function prepareEvidenceBound(text,{profile='analytical-nonfiction'}={}){
 const p=prepareParagraphRevision(text,{profile});
 return {schemaVersion:'7.6',documentHash:sha256(text),profile,paragraphs:p.paragraphs.map(x=>({id:x.id,hash:x.hash,task:'Bind a claim quote, evidence excerpt and reasoning to this paragraph'})),status:'REVIEW_REQUIRED'};
}
/** Literal provenance and editorial decision checks, not source authentication or semantic entailment. */
export function auditEvidenceBound(text,plan,records){
 if(!same(prepareEvidenceBound(text,{profile:plan?.profile}),plan))throw Error('Stale or altered evidence plan');
 if(!records||!['sources','claims','links','reviews'].every(k=>Array.isArray(records[k])))throw Error('Expected sources, claims, links, reviews arrays');
 const paragraphs=prepareParagraphRevision(text,{profile:plan.profile}).paragraphs;
 const sources=new Map(),claims=new Map(),links=new Map(),reviews=new Map(),issues=[],pending=[];
 const add=(map,obj)=>{if(!obj||!valid(obj.id)||map.has(obj.id))throw Error('Invalid or duplicate ID');map.set(obj.id,obj);};
 for(const s of records.sources){if(!valid(s?.locator)||!valid(s?.excerpt)||!valid(s?.retrievedAt)||!valid(s?.contentHash))throw Error('Invalid source');add(sources,s);if(sourceDigest(s.excerpt)!==s.contentHash)issues.push({code:'SOURCE_HASH_MISMATCH',sourceId:s.id});}
 for(const c of records.claims){if(!types.includes(c?.type)||!valid(c?.paragraphId)||!valid(c?.quote)||!valid(c?.interpretation))throw Error('Invalid claim');add(claims,c);const p=paragraphs.find(p=>p.id===c.paragraphId);if(!p||!p.text.includes(c.quote))issues.push({code:'CLAIM_QUOTE_NOT_IN_PARAGRAPH',claimId:c.id});}
 for(const l of records.links){if(!valid(l?.claimId)||!valid(l?.sourceId)||!['SUPPORTS','CONTRADICTS','QUALIFIES'].includes(l?.kind)||!valid(l?.excerptQuote)||!valid(l?.reasoning))throw Error('Invalid link');add(links,l);const s=sources.get(l.sourceId);if(!claims.has(l.claimId)||!s||!sourceContains(s.excerpt,l.excerptQuote))issues.push({code:'UNRESOLVED_EVIDENCE_LINK',linkId:l.id});}
 for(const r of records.reviews){if(!valid(r?.claimId)||!valid(r?.reviewer)||!valid(r?.rationale)||!['APPROVE','REJECT'].includes(r?.decision)||reviews.has(r.claimId))throw Error('Invalid or duplicate review');reviews.set(r.claimId,r);if(!claims.has(r.claimId))issues.push({code:'ORPHAN_REVIEW',claimId:r.claimId});if(r.decision==='REJECT')issues.push({code:'EDITOR_REJECTED',claimId:r.claimId});}
 for(const c of claims.values()){
  const edges=[...links.values()].filter(l=>l.claimId===c.id);
  if(!edges.some(l=>l.kind==='SUPPORTS'))pending.push({code:'SUPPORT_MISSING',claimId:c.id});
  if(!reviews.has(c.id))pending.push({code:'REVIEW_MISSING',claimId:c.id});
  if(edges.some(l=>l.kind==='CONTRADICTS')&&!valid(c.conflictResolution))issues.push({code:'CONTRADICTION_UNRESOLVED',claimId:c.id});
  if(['INFERENCE','MECHANISM','RESPONSE','CONCLUSION'].includes(c.type)){
   if(!Array.isArray(c.dependsOn)||!c.dependsOn.length)pending.push({code:'REASONING_DEPENDENCY_MISSING',claimId:c.id});
   else for(const id of c.dependsOn)if(!claims.has(id)||id===c.id)issues.push({code:'INVALID_REASONING_DEPENDENCY',claimId:c.id,dependsOn:id});
  }
 }
 for(const p of paragraphs)if(![...claims.values()].some(c=>c.paragraphId===p.id))pending.push({code:'PARAGRAPH_UNMAPPED',paragraphId:p.id});
 const status=issues.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'7.6',documentHash:sha256(text),planHash:hash(plan),recordsHash:hash(records),status,issues,pending,counts:{paragraphs:paragraphs.length,sources:sources.size,claims:claims.size,links:links.size,reviews:reviews.size},limitations:['Source excerpts and dates are editor-supplied, not independently authenticated','Literal matches and editorial assertions do not prove truth or entailment','Undeclared sources and contradictions cannot be detected']};
 return {...payload,reportHash:hash(payload)};
}
export function verifyEvidenceBound(text,plan,records,report){const expected=auditEvidenceBound(text,plan,records);if(!same(expected,report))throw Error('Evidence-bound report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
