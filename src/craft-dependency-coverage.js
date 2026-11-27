import {sha256} from './core.js';
import {prepareEvidenceBound,auditEvidenceBound} from './craft-evidence-bound.js';
import {prepareParagraphRevision} from './craft-paragraph.js';
const hash=x=>sha256(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const valid=x=>typeof x==='string'&&x.trim().length>0;
const patterns=[
 ['NUMERIC',/(?:\b\d+(?:[.,]\d+)*(?:\s?%|\s?(?:million|billion|trillion|bp|bps))?\b)/giu],
 ['CAUSAL',/\b(?:because|therefore|thus|consequently|drives?|causes?|results? in|leads? to|由于|因此|导致|推动|意味着)\b|(?:由于|因此|导致|推动|意味着)/giu],
 ['CERTAINTY',/\b(?:always|never|certainly|proves?|guarantees?|must)\b|(?:必然|证明|保证|一定|绝不)/giu],
 ['ATTRIBUTION',/\b(?:according to|reported by|data from|research shows)\b|(?:根据|数据显示|报告指出)/giu]
];
/** Candidate discovery is lexical triage, never a claim extraction or truth judgment. */
export function prepareDependencyCoverage(text,{profile='analytical-nonfiction'}={}){
 const paragraphs=prepareParagraphRevision(text,{profile}).paragraphs;
 const candidates=[];
 for(const p of paragraphs){
  for(const [kind,re] of patterns){re.lastIndex=0;for(const match of p.text.matchAll(re)){
   const quote=match[0],offset=match.index;
   const id=`candidate-${candidates.length+1}`;
   candidates.push({id,paragraphId:p.id,paragraphHash:p.hash,kind,quote,offset,context:p.text.slice(Math.max(0,offset-65),Math.min(p.text.length,offset+quote.length+65))});
  }}
 }
 return {schemaVersion:'7.9',documentHash:sha256(text),profile,candidates,paragraphs:paragraphs.map(p=>({id:p.id,hash:p.hash})),limitations:['Lexical candidates include false positives and miss implicit claims','No automated factual truth, semantic entailment, or complete dependency discovery']};
}
export function auditDependencyCoverage(text,plan,records,decisions=[]){
 if(!same(plan,prepareDependencyCoverage(text,{profile:plan?.profile})))throw Error('Stale or modified coverage plan');
 if(!Array.isArray(decisions))throw Error('Expected coverage decisions array');
 const evidencePlan=prepareEvidenceBound(text,{profile:plan.profile});
 const evidence=auditEvidenceBound(text,evidencePlan,records);
 const issues=[],pending=[];
 const claims=new Map(records.claims.map(c=>[c.id,c]));
 const sources=new Set(records.sources.map(s=>s.id));
 const linked=new Set(records.links.filter(l=>l.kind==='SUPPORTS'&&sources.has(l.sourceId)).map(l=>l.claimId));
 const decisionMap=new Map();
 for(const d of decisions){
  if(!d||!valid(d.candidateId)||decisionMap.has(d.candidateId)||!['LINK','NOT_A_CLAIM','NEEDS_SOURCE'].includes(d.decision)||!valid(d.reviewer)||!valid(d.rationale))throw Error('Invalid or duplicate coverage decision');
  decisionMap.set(d.candidateId,d);
  if(!plan.candidates.some(c=>c.id===d.candidateId))issues.push({code:'ORPHAN_DECISION',candidateId:d.candidateId});
 }
 for(const c of plan.candidates){
  const d=decisionMap.get(c.id);
  if(!d){pending.push({code:'CANDIDATE_UNREVIEWED',candidateId:c.id});continue;}
  if(d.decision==='NEEDS_SOURCE'){pending.push({code:'SOURCE_RESEARCH_REQUIRED',candidateId:c.id});continue;}
  if(d.decision==='LINK'){
   const claim=claims.get(d.claimId);
   if(!claim||claim.paragraphId!==c.paragraphId||!claim.quote.includes(c.quote)||!linked.has(d.claimId))issues.push({code:'INVALID_CANDIDATE_CLAIM_LINK',candidateId:c.id,claimId:d.claimId??null});
  }
 }
 for(const claim of records.claims){
  if(!linked.has(claim.id))pending.push({code:'CLAIM_WITHOUT_SUPPORT',claimId:claim.id});
  if(['INFERENCE','MECHANISM','RESPONSE','CONCLUSION'].includes(claim.type)&&(!Array.isArray(claim.dependsOn)||!claim.dependsOn.length))pending.push({code:'DEPENDENCY_UNDECLARED',claimId:claim.id});
 }
 // Registered cycles cannot establish a valid independent evidentiary foundation.
 const visiting=new Set(),visited=new Set(),cycles=new Set();
 const visit=id=>{if(visiting.has(id)){cycles.add(id);return;}if(visited.has(id))return;visiting.add(id);for(const dep of claims.get(id)?.dependsOn??[]){if(claims.has(dep))visit(dep);}visiting.delete(id);visited.add(id);};
 for(const id of claims.keys())visit(id);
 for(const id of [...cycles].sort())issues.push({code:'REASONING_CYCLE',claimId:id});
 if(evidence.status==='BLOCKED')issues.push({code:'EVIDENCE_BOUND_BLOCKED'});
 else if(evidence.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push({code:'EVIDENCE_BOUND_INCOMPLETE'});
 const status=issues.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'7.9',documentHash:sha256(text),planHash:hash(plan),recordsHash:hash(records),decisionsHash:hash(decisions),evidenceReportHash:evidence.reportHash,status,issues,pending,counts:{candidates:plan.candidates.length,reviewed:decisionMap.size,claims:claims.size},limitations:['All candidate dismissals are human assertions','Lexical coverage cannot guarantee all implicit claims are found','Valid registered links do not prove evidence supports a claim']};
 return {...payload,reportHash:hash(payload)};
}
export function verifyDependencyCoverage(text,plan,records,decisions,report){const expected=auditDependencyCoverage(text,plan,records,decisions);if(!same(expected,report))throw Error('Coverage report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
