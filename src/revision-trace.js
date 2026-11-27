import {sha256,analyze,validateRules} from './core.js';
import {verifyRevisionPlan,executeRevisionPlan} from './revision-plan.js';
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const signature=f=>JSON.stringify([f.ruleId,f.severity,f.match]);
function subtract(a,b){const counts=new Map();for(const x of b)counts.set(signature(x),(counts.get(signature(x))??0)+1);return a.filter(x=>{const k=signature(x),n=counts.get(k)??0;if(n){counts.set(k,n-1);return false;}return true;});}
function make(before,plan,decisions,rules){
 validateRules(rules);verifyRevisionPlan(before,plan);
 if(plan.rulesHash!==sha256(JSON.stringify(rules)))throw Error('Rule set does not match revision plan');
 const run=executeRevisionPlan(before,plan,decisions);
 const baseline=analyze(before,rules).findings,after=analyze(run.revisedText,rules).findings;
 const resolved=subtract(baseline,after),introduced=subtract(after,baseline);
 const applied=new Set(run.results.filter(x=>x.status==='APPLIED').map(x=>x.taskId));
 const tasks=plan.tasks.map(t=>{
  const outcome=run.results.find(x=>x.taskId===t.id);
  const originalResolved=resolved.some(f=>f.ruleId===t.ruleId&&f.match===t.source.quote);
  const disposition=!outcome?'PENDING':outcome.status==='REJECTED'?'REJECTED':originalResolved?'RESOLVED_BY_SIGNATURE':'NOT_RESOLVED';
  return {taskId:t.id,ruleId:t.ruleId,disposition,sourceQuoteHash:t.source.quoteHash};
 });
 const status=introduced.some(f=>f.severity==='error')?'BLOCKED':run.pending.length||introduced.length||tasks.some(t=>t.disposition!=='RESOLVED_BY_SIGNATURE')?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'3.7',beforeHash:sha256(before),afterHash:sha256(run.revisedText),planHash:plan.planHash,decisionsHash:sha256(JSON.stringify(decisions)),rulesHash:sha256(JSON.stringify(rules)),status,tasks,introduced:introduced.map(f=>({ruleId:f.ruleId,severity:f.severity,match:f.match})),appliedCount:applied.size,limitations:['Signature disappearance does not prove a task was causally resolved','Unchanged signatures can move to different positions','This report does not verify semantic equivalence or factual accuracy']};
 return {...payload,traceHash:sha256(JSON.stringify(payload)),revisedText:run.revisedText};
}
export function traceRevision(before,plan,decisions,rules){return make(before,plan,decisions,rules);}
export function verifyRevisionTrace(before,after,plan,decisions,rules,report){
 if(!isObj(report)||typeof report.traceHash!=='string')throw Error('Invalid revision trace');
 const expected=make(before,plan,decisions,rules);
 if(after!==expected.revisedText)throw Error('Revised document differs from executed decisions');
 const {revisedText,...expectedReport}=expected;
 if(JSON.stringify(report)!==JSON.stringify(expectedReport))throw Error('Revision trace differs from recomputed result');
 return {status:'TRACE_RECOMPUTED',traceHash:expected.traceHash};
}
