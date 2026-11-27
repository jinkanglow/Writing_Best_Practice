import {sha256} from './core.js';
import {auditCraftRevision} from './craft-drafting.js';
const meaningful=x=>typeof x==='string'&&x.trim().length>0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const questions={analytical:'Identify the new fact or mechanism, its evidence boundary, and the transition to the next claim.',narrative:'Identify the change in situation or reader understanding and the causal connection to adjacent paragraphs.'};
export function splitEditorialParagraphs(text){
 if(typeof text!=='string')throw new Error('Expected text');
 const result=[];const pattern=/(?:^|\n[ \t]*\n)([^]*?)(?=\n[ \t]*\n|$)/g;
 for(const m of text.matchAll(pattern)){
  const raw=m[1],start=m.index+m[0].indexOf(raw),trim=raw.trim();
  if(!trim||/^(?:#{1,6}\s|```|~~~|\|[- :|]+\||>)/.test(trim))continue;
  const leading=raw.indexOf(trim);const startChar=start+leading;
  const endChar=startChar+trim.length;
  result.push({id:`p-${result.length+1}`,startByte:Buffer.byteLength(text.slice(0,startChar)),endByte:Buffer.byteLength(text.slice(0,endChar)),hash:sha256(trim),text:trim});
 }
 return result;
}
export function prepareParagraphRevision(text,{profile='analytical-nonfiction'}={}){
 if(!['analytical-nonfiction','narrative-nonfiction','fiction'].includes(profile))throw new Error('Unknown profile');
 const paragraphs=splitEditorialParagraphs(text);
 return {schemaVersion:'7.1',documentHash:sha256(text),profile,status:'INCOMPLETE',paragraphs:paragraphs.map((p,i)=>({...p,previousId:paragraphs[i-1]?.id??null,nextId:paragraphs[i+1]?.id??null,questions:[profile==='analytical-nonfiction'?questions.analytical:questions.narrative,'What does this paragraph contribute that no adjacent paragraph already supplies?','What must remain unchanged if this paragraph is rewritten?'],status:'REVIEW_REQUIRED'})),limitations:['Paragraph segmentation is heuristic, not a full Markdown AST','Paragraph purpose and originality require human judgment']};
}
export function verifyParagraphPlan(text,plan){const expected=prepareParagraphRevision(text,{profile:plan?.profile});if(!same(plan,expected))throw new Error('Stale or tampered paragraph plan');return {status:'PLAN_RECOMPUTED',documentHash:expected.documentHash};}
export function auditParagraphRevision(text,plan,reviews=[]){
 verifyParagraphPlan(text,plan);
 if(!Array.isArray(reviews))throw new Error('Expected review array');
 const byId=new Map(),known=new Set(plan.paragraphs.map(p=>p.id));
 for(const r of reviews){
  if(!r||!known.has(r.id)||byId.has(r.id))throw new Error('Unknown or duplicate paragraph review');
  if(!['KEEP','REVISE','REMOVE'].includes(r.decision)||!meaningful(r.reviewer)||!meaningful(r.rationale)||!meaningful(r.contribution)||!meaningful(r.transition)||!meaningful(r.preservation))throw new Error('Incomplete paragraph review');
  if(r.decision==='REVISE'&&!meaningful(r.proposedText))throw new Error('Revision requires proposedText');
  if(r.decision==='REMOVE'&&!meaningful(r.removalJustification))throw new Error('Removal requires justification');
  byId.set(r.id,r);
 }
 const tasks=plan.paragraphs.map(p=>({id:p.id,decision:byId.get(p.id)?.decision??'PENDING',reviewer:byId.get(p.id)?.reviewer??null}));
 return {schemaVersion:'7.1',documentHash:plan.documentHash,planHash:sha256(JSON.stringify(plan)),reviewHash:sha256(JSON.stringify(reviews)),status:tasks.every(t=>t.decision==='KEEP')?'REVIEW_COMPLETE':'INCOMPLETE',tasks,limitations:['REVIEW_COMPLETE records editorial decisions only; it does not establish factual correctness','Proposed edits are never automatically applied']};
}
export function verifyParagraphAudit(text,plan,reviews,report){const expected=auditParagraphRevision(text,plan,reviews);if(!same(expected,report))throw new Error('Paragraph report mismatch');return {status:'REPORT_RECOMPUTED',documentHash:expected.documentHash};}
