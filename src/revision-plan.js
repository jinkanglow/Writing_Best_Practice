import {sha256,analyze,proposePatch,validateRules} from './core.js';
import {validateBatch,applyBatch} from './patches.js';
import {prepareRevisionAudit} from './revision.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(x);
const intersects=(a,b)=>a.startOffset<b.endOffset&&b.startOffset<a.endOffset;
function anchorsToSpans(text,anchors){
 if(!Array.isArray(anchors))throw Error('anchors must be an array');
 const spans=[];const ids=new Set();
 for(const a of anchors){
  if(!obj(a)||!validId(a.id)||ids.has(a.id)||typeof a.quote!=='string'||!a.quote)throw Error('Invalid or duplicate protected anchor');
  ids.add(a.id);const first=text.indexOf(a.quote);
  if(first<0)throw Error(`Protected anchor not found: ${a.id}`);
  if(text.indexOf(a.quote,first+1)>=0)throw Error(`Ambiguous protected anchor: ${a.id}`);
  const startOffset=Buffer.byteLength(text.slice(0,first),'utf8');
  spans.push({id:a.id,startOffset,endOffset:startOffset+Buffer.byteLength(a.quote,'utf8'),quoteHash:sha256(a.quote)});
 }
 return spans;
}
export function prepareRevisionPlan(text,rules,anchors=[]){
 if(typeof text!=='string')throw Error('Expected original text');validateRules(rules);
 const analysis=analyze(text,rules),protectedSpans=anchorsToSpans(text,anchors);
 const tasks=analysis.findings.map((f,i)=>({id:`task-${String(i+1).padStart(4,'0')}`,ruleId:f.ruleId,severity:f.severity,source:{startOffset:f.startOffset,endOffset:f.endOffset,quote:f.match,quoteHash:sha256(f.match),nodeId:f.nodeId},objective:f.explanation,scope:{startOffset:f.startOffset,endOffset:f.endOffset},status:'PROPOSED',protectedIntersection:protectedSpans.some(a=>intersects(a,f))}));
 const payload={schemaVersion:'3.1',documentHash:sha256(text),rulesHash:sha256(JSON.stringify(rules)),anchorsHash:sha256(JSON.stringify(anchors)),protectedSpans,tasks};
 return {...payload,planHash:sha256(JSON.stringify(payload)),limitations:['Only configured deterministic findings are proposed','No automatic rewriting or semantic preservation guarantee','A task is not authorization to change protected content']};
}
export function verifyRevisionPlan(text,plan){
 if(!obj(plan)||plan.schemaVersion!=='3.1'||!Array.isArray(plan.tasks)||!Array.isArray(plan.protectedSpans))throw Error('Invalid revision plan');
 if(plan.documentHash!==sha256(text))throw Error('Stale revision plan document');
 const {planHash,limitations,...payload}=plan;
 if(sha256(JSON.stringify(payload))!==planHash)throw Error('Revision plan checksum mismatch');
 const buf=Buffer.from(text,'utf8');const ids=new Set();
 for(const t of plan.tasks){
  if(!validId(t.id)||ids.has(t.id)||!obj(t.source)||!obj(t.scope))throw Error('Invalid or duplicate revision task');ids.add(t.id);
  const {startOffset:s,endOffset:e,quote,quoteHash}=t.source;
  if(!Number.isInteger(s)||!Number.isInteger(e)||s<0||e<=s||e>buf.length||buf.subarray(s,e).toString('utf8')!==quote||sha256(quote)!==quoteHash)throw Error('Revision task source mismatch');
  if(t.scope.startOffset!==s||t.scope.endOffset!==e)throw Error('Revision task scope mismatch');
 }
 return {status:'PLAN_INTEGRITY_VERIFIED',tasks:plan.tasks.length,planHash};
}
export function executeRevisionPlan(text,plan,decisions){
 verifyRevisionPlan(text,plan);
 if(!obj(decisions)||decisions.planHash!==plan.planHash||!Array.isArray(decisions.items))throw Error('Missing or stale revision decisions');
 const tasks=new Map(plan.tasks.map(t=>[t.id,t]));const seen=new Set(),patches=[],results=[];
 for(const d of decisions.items){
  if(!obj(d)||!tasks.has(d.taskId)||seen.has(d.taskId)||!['approve','reject'].includes(d.action))throw Error('Invalid or duplicate revision decision');
  seen.add(d.taskId);const task=tasks.get(d.taskId);
  if(d.action==='reject'){results.push({taskId:d.taskId,status:'REJECTED'});continue;}
  if(typeof d.replacementText!=='string'||!d.replacementText.trim())throw Error('Approved revision requires nonempty replacementText');
  if(task.protectedIntersection||plan.protectedSpans.some(a=>intersects(a,task.scope)))throw Error(`Protected content requires separate review: ${d.taskId}`);
  const p=proposePatch(text,{startOffset:task.scope.startOffset,endOffset:task.scope.endOffset,replacementText:d.replacementText});
  patches.push(p);results.push({taskId:d.taskId,status:'APPLIED'});
 }
 const pending=plan.tasks.filter(t=>!seen.has(t.id)).map(t=>t.id);
 if(patches.length)validateBatch(text,patches);
 const revisedText=patches.length?applyBatch(text,patches):text;
 const audit=prepareRevisionAudit(text,revisedText,[]);
 return {schemaVersion:'3.1',status:pending.length?'INCOMPLETE':'REVIEW_REQUIRED',documentHash:plan.documentHash,revisedHash:sha256(revisedText),planHash:plan.planHash,results,pending,patches,revisedText,auditStatus:audit.status,limitations:['Approved replacements are human-provided, not generated','REVIEW_REQUIRED is not publication approval','Protected content changes are not permitted through this executor']};
}
