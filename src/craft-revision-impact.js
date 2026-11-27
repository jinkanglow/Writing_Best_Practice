import {sha256} from './core.js';
import {verifyParagraphPlan} from './craft-paragraph.js';
import {executeParagraphExecution} from './craft-paragraph-execution.js';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const unique=a=>[...new Set(a)];

// The graph is an editor-declared relationship, not an inferred semantic dependency.
export function assessParagraphImpact(before,plan,reviews,proposal,decisions,links=[]){
 verifyParagraphPlan(before,plan);
 const execution=executeParagraphExecution(before,plan,reviews,proposal,decisions);
 if(!Array.isArray(links))throw new Error('Expected editorial link array');
 const known=new Set(plan.paragraphs.map(p=>p.id)),edges=[],keys=new Set();
 for(const link of links){
  if(!link||!known.has(link.from)||!known.has(link.to)||link.from===link.to||!['argument','evidence','conclusion','transition'].includes(link.kind))throw new Error('Invalid editorial link');
  const key=`${link.from}:${link.to}:${link.kind}`;
  if(keys.has(key))throw new Error('Duplicate editorial link');
  keys.add(key);edges.push({from:link.from,to:link.to,kind:link.kind});
 }
 const changed=new Set(execution.applied);
 const affected=new Map();
 const add=(id,reason)=>{if(!affected.has(id))affected.set(id,new Set());affected.get(id).add(reason);};
 for(const id of changed){add(id,'CHANGED');const p=plan.paragraphs.find(p=>p.id===id);if(p.previousId)add(p.previousId,'ADJACENT_TO_CHANGE');if(p.nextId)add(p.nextId,'ADJACENT_TO_CHANGE');}
 // Transitive closure on declared directed dependencies, with cycles bounded by finite IDs.
 let frontier=[...changed],visited=new Set(frontier);
 while(frontier.length){
  const next=[];
  for(const id of frontier)for(const edge of edges.filter(e=>e.from===id)){
   add(edge.to,`UPSTREAM_${edge.kind.toUpperCase()}_CHANGED`);
   if(!visited.has(edge.to)){visited.add(edge.to);next.push(edge.to);}
  }
  frontier=next;
 }
 const impacts=plan.paragraphs.filter(p=>affected.has(p.id)).map(p=>({id:p.id,originalHash:p.hash,reasons:[...affected.get(p.id)].sort(),reviewStatus:'RECHECK_REQUIRED'}));
 return {schemaVersion:'7.3',beforeHash:sha256(before),afterHash:execution.afterHash,executionHash:sha256(JSON.stringify(execution)),linksHash:sha256(JSON.stringify(links)),status:execution.status==='INCOMPLETE'?'INCOMPLETE':impacts.length?'RECHECK_REQUIRED':'NO_CHANGES',changed:[...changed].sort(),impacts,limitations:['Only editor-declared dependency edges are traversed','Adjacent paragraphs are conservatively invalidated','A recheck decision does not prove semantic or factual correctness']};
}
export function reviewParagraphImpact(before,plan,reviews,proposal,decisions,links,impact,checks=[]){
 const expected=assessParagraphImpact(before,plan,reviews,proposal,decisions,links);
 if(!same(expected,impact))throw new Error('Stale or tampered impact report');
 if(!Array.isArray(checks))throw new Error('Expected impact review array');
 const known=new Set(impact.impacts.map(i=>i.id)),seen=new Set();
 for(const check of checks){
  if(!check||!known.has(check.id)||seen.has(check.id))throw new Error('Unknown or duplicate impact review');
  seen.add(check.id);
  if(!['APPROVE','REJECT'].includes(check.decision)||!nonempty(check.reviewer)||!nonempty(check.rationale)||check.afterHash!==impact.afterHash)throw new Error('Incomplete or stale impact review');
 }
 const pending=impact.impacts.filter(i=>!seen.has(i.id)).map(i=>i.id);
 const rejected=checks.filter(c=>c.decision==='REJECT').map(c=>c.id);
 const status=rejected.length?'BLOCKED':pending.length||impact.status==='INCOMPLETE'?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 return {schemaVersion:'7.3',beforeHash:impact.beforeHash,afterHash:impact.afterHash,impactHash:sha256(JSON.stringify(impact)),checksHash:sha256(JSON.stringify(checks)),status,pending,rejected,reviewed:checks.map(c=>c.id),limitations:['Human decisions record review completion, not correctness','Independent source and release verification remains required']};
}
export function verifyParagraphImpact(before,plan,reviews,proposal,decisions,links,impact){
 if(!same(assessParagraphImpact(before,plan,reviews,proposal,decisions,links),impact))throw new Error('Impact report mismatch');
 return {status:'REPORT_RECOMPUTED',afterHash:impact.afterHash};
}
export function verifyParagraphImpactReview(before,plan,reviews,proposal,decisions,links,impact,checks,report){
 if(!same(reviewParagraphImpact(before,plan,reviews,proposal,decisions,links,impact,checks),report))throw new Error('Impact review mismatch');
 return {status:'REPORT_RECOMPUTED',afterHash:impact.afterHash};
}
