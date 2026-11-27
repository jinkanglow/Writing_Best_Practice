import {sha256} from './core.js';
import {inspectAvoidAITiers} from './avoid-ai-tiers.js';
import {detectAvoidAI} from './avoid-ai-writing.js';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const hash=x=>sha256(JSON.stringify(x));
const key=f=>`${f.startByte}:${f.endByte}:${f.quote}`;
function findings(text,options){
 const a=detectAvoidAI(text,{context:options.context});
 const b=inspectAvoidAITiers(text,options);
 const map=new Map();
 for(const f of [...a.findings,...b.findings]){
  const k=key(f),prev=map.get(k);
  if(!prev)map.set(k,{startByte:f.startByte,endByte:f.endByte,quote:f.quote,signals:[f.id]});
  else if(!prev.signals.includes(f.id))prev.signals.push(f.id);
 }
 return [...map.values()].sort((a,b)=>a.startByte-b.startByte||a.endByte-b.endByte);
}
function checkOptions(options){
 if(!object(options)||typeof options.context!=='string'||typeof options.voice!=='string')throw Error('Explicit context and voice required');
}
export function prepareAvoidAIRevision(text,options){
 checkOptions(options);
 const matches=findings(text,options);
 const tasks=matches.map((f,i)=>({...f,id:`ai-${String(i+1).padStart(4,'0')}`,quoteHash:sha256(f.quote),status:'PROPOSED'}));
 const payload={schemaVersion:'4.5',documentHash:sha256(text),options,tasks};
 return {...payload,planHash:hash(payload),limitations:['Signals are editorial heuristics, not AI authorship evidence','No replacements generated or approved automatically','Quoted text and protected claims require independent review']};
}
export function verifyAvoidAIRevision(text,plan){
 if(!object(plan)||plan.schemaVersion!=='4.5'||!object(plan.options)||!Array.isArray(plan.tasks))throw Error('Invalid plan');
 const expected=prepareAvoidAIRevision(text,plan.options);
 if(JSON.stringify(expected)!==JSON.stringify(plan))throw Error('Stale or modified Avoid AI plan');
 return {status:'VERIFIED',planHash:expected.planHash};
}
export function executeAvoidAIRevision(text,plan,decisions,{protectedQuotes=[]}={}){
 verifyAvoidAIRevision(text,plan);
 if(!object(decisions)||decisions.planHash!==plan.planHash||!Array.isArray(decisions.items))throw Error('Missing or stale decisions');
 if(!Array.isArray(protectedQuotes)||protectedQuotes.some(q=>typeof q!=='string'||!q))throw Error('Invalid protected quotes');
 const protectedSpans=protectedQuotes.map(q=>{
  const pos=text.indexOf(q);if(pos<0||text.indexOf(q,pos+1)>=0)throw Error('Protected quote missing or ambiguous');
  const s=Buffer.byteLength(text.slice(0,pos),'utf8');return {start:s,end:s+Buffer.byteLength(q,'utf8')};
 });
 const byId=new Map(plan.tasks.map(t=>[t.id,t])),seen=new Set(),patches=[],results=[];
 for(const d of decisions.items){
  if(!object(d)||!byId.has(d.taskId)||seen.has(d.taskId)||!['approve','reject'].includes(d.action))throw Error('Invalid or duplicate decision');
  seen.add(d.taskId);const t=byId.get(d.taskId);
  if(d.action==='reject'){results.push({taskId:d.taskId,status:'REJECTED'});continue;}
  if(typeof d.replacementText!=='string'||!d.replacementText.trim()||typeof d.reviewer!=='string'||!d.reviewer.trim()||typeof d.rationale!=='string'||!d.rationale.trim())throw Error('Approval requires replacement, reviewer and rationale');
  if(protectedSpans.some(p=>t.startByte<p.end&&p.start<t.endByte))throw Error('Protected quote intersects approved change');
  patches.push({start:t.startByte,end:t.endByte,replacement:d.replacementText,taskId:t.id});
  results.push({taskId:t.id,status:'APPLIED'});
 }
 patches.sort((a,b)=>a.start-b.start);
 for(let i=1;i<patches.length;i++)if(patches[i].start<patches[i-1].end)throw Error('Overlapping approved changes');
 let revised=Buffer.from(text,'utf8');
 for(const p of [...patches].reverse())revised=Buffer.concat([revised.subarray(0,p.start),Buffer.from(p.replacement),revised.subarray(p.end)]);
 const after=revised.toString('utf8');
 if(!revised.equals(Buffer.from(after,'utf8')))throw Error('Invalid UTF-8 patch boundaries');
 for(const q of protectedQuotes)if(!after.includes(q))throw Error('Protected quote was lost');
 const remaining=findings(after,plan.options),pending=plan.tasks.filter(t=>!seen.has(t.id)).map(t=>t.id);
 const status=pending.length||results.some(r=>r.status==='REJECTED')||remaining.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'4.5',status,beforeHash:sha256(text),afterHash:sha256(after),planHash:plan.planHash,decisionsHash:hash(decisions),protectedQuotesHash:hash(protectedQuotes),results,pending,remaining,limitations:['Lexical recheck does not prove semantic preservation','Reviewer identity is a supplied label, not authenticated','READY_FOR_HUMAN_REVIEW is not publication approval']};
 return {...payload,reportHash:hash(payload),revisedText:after};
}
export function verifyAvoidAIExecution(before,after,plan,decisions,protectedQuotes,report){
 const {revisedText,...expected}=executeAvoidAIRevision(before,plan,decisions,{protectedQuotes});
 if(revisedText!==after||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Revision report mismatch');
 return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};
}
