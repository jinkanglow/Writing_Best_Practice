import {sha256,proposePatch,applyPatch} from './core.js';
import {prepareParagraphRevision,verifyParagraphPlan,auditParagraphRevision} from './craft-paragraph.js';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const meaningful=s=>typeof s==='string'&&s.trim().length>0;
const signals=[
 ['number',/\d+(?:[.,]\d+)*(?:\s*(?:%|％|亿元|万元|美元|RM|USD|bp|bps|个百分点))?/gu],
 ['negation',/\b(?:not|never|no|without|cannot)\b|不是|不能|不会|没有|尚未|无法|并非/giu],
 ['uncertainty',/\b(?:may|might|could|likely|estimated|forecast|assuming)\b|可能|预计|估计|假设|如果|或许|大约/giu],
 ['attribution',/\b(?:according to|reported by|cited by)\b|根据|据[^，。]{1,30}披露|来源[:：]/giu]
];
const signature=s=>Object.fromEntries(signals.map(([id,re])=>[id,[...s.matchAll(re)].map(m=>m[0])]));
export function prepareParagraphExecution(text,plan,reviews){
 verifyParagraphPlan(text,plan);
 auditParagraphRevision(text,plan,reviews);
 const byId=new Map(reviews.map(r=>[r.id,r]));
 const proposals=plan.paragraphs.filter(p=>['REVISE','REMOVE'].includes(byId.get(p.id)?.decision)).map(p=>{
  const r=byId.get(p.id),replacementText=r.decision==='REMOVE'?'':r.proposedText;
  if(typeof replacementText!=='string')throw new Error('Missing proposedText');
  const patch=proposePatch(text,{startOffset:p.startByte,endOffset:p.endByte,replacementText});
  const oldSignals=signature(p.text),newSignals=signature(replacementText);
  const changes=Object.keys(oldSignals).filter(k=>!same(oldSignals[k],newSignals[k]));
  return {id:p.id,decision:r.decision,patch,reviewer:r.reviewer,rationale:r.rationale,removalJustification:r.removalJustification??null,protectedChanges:changes,status:'NEEDS_APPROVAL'};
 });
 return {schemaVersion:'7.2',documentHash:sha256(text),planHash:sha256(JSON.stringify(plan)),reviewHash:sha256(JSON.stringify(reviews)),status:'NEEDS_APPROVAL',proposals,limitations:['Proposals are not automatically approved','Protected signals are lexical heuristics, not semantic equivalence','A successful patch is not editorial or factual release approval']};
}
export function executeParagraphExecution(text,plan,reviews,proposal,decisions=[]){
 const expected=prepareParagraphExecution(text,plan,reviews);
 if(!same(expected,proposal))throw new Error('Stale or tampered execution proposal');
 if(!Array.isArray(decisions))throw new Error('Expected decision array');
 const ids=new Set(proposal.proposals.map(p=>p.id)),seen=new Set(),approved=new Set(),rejected=[];
 for(const d of decisions){
  if(!d||!ids.has(d.id)||seen.has(d.id))throw new Error('Unknown or duplicate decision');
  seen.add(d.id);
  if(!['APPROVE','REJECT'].includes(d.decision)||!meaningful(d.reviewer)||!meaningful(d.rationale))throw new Error('Incomplete approval decision');
  const p=proposal.proposals.find(x=>x.id===d.id);
  if(d.decision==='APPROVE'){
   if(p.protectedChanges.length)throw new Error(`Protected signals changed in ${d.id}; revise proposal and obtain independent fact review before applying`);
   if(p.decision==='REMOVE')throw new Error(`Paragraph removal requires independent content integrity review: ${d.id}`);
   approved.add(d.id);
  }else rejected.push(d.id);
 }
 let revised=text;
 for(const p of [...proposal.proposals].filter(p=>approved.has(p.id)).sort((a,b)=>b.patch.startOffset-a.patch.startOffset)){
  const current=proposePatch(revised,{startOffset:p.patch.startOffset,endOffset:p.patch.endOffset,replacementText:p.patch.replacementText});
  if(current.expectedTextHash!==p.patch.expectedTextHash)throw new Error('Patch precondition mismatch');
  revised=applyPatch(revised,current);
 }
 const pending=proposal.proposals.filter(p=>!seen.has(p.id)).map(p=>p.id);
 return {schemaVersion:'7.2',beforeHash:sha256(text),afterHash:sha256(revised),proposalHash:sha256(JSON.stringify(proposal)),decisionsHash:sha256(JSON.stringify(decisions)),status:pending.length||rejected.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RECHECK',applied:[...approved],rejected,pending,revisedText:revised,limitations:['No semantic equivalence guarantee','Independent fact, voice and final release checks remain required']};
}
export function verifyParagraphExecution(text,plan,reviews,proposal,decisions,report){
 const expected=executeParagraphExecution(text,plan,reviews,proposal,decisions);
 if(!same(expected,report))throw new Error('Paragraph execution report mismatch');
 return {status:'REPORT_RECOMPUTED',afterHash:expected.afterHash};
}
