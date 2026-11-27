import {sha256} from './core.js';
import {auditCIDiagnostics} from './craft-ci-diagnostics.js';
const hash=x=>sha256(JSON.stringify(x));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const valid=x=>x&&typeof x==='object'&&!Array.isArray(x);
const key=x=>hash([x.stage??null,x.code,x.source,x.message]);
export function prepareRepairPlan(diagnostics){
 if(!valid(diagnostics)||!Array.isArray(diagnostics.items)||!diagnostics.reportHash||!diagnostics.documentHash)throw Error('Invalid diagnostics');
 const tasks=diagnostics.items.map((item,index)=>({id:`repair-${index+1}-${key(item).slice(0,12)}`,issueKey:key(item),stage:item.stage??null,code:item.code,problem:item.message,action:item.action,location:item.location,acceptance:['The same diagnostic must be absent in a fresh audit','The reviewer must supply a specific repair description and evidence','A different issue introduced by the repair is not automatically approved']}));
 const payload={schemaVersion:'8.6',baselineDocumentHash:diagnostics.documentHash,diagnosticsHash:diagnostics.reportHash,tasks};
 return {...payload,planHash:hash(payload)};
}
export async function auditRepair({baseline,plan,currentInputs,decisions=[],file='article.md'}){
 if(!valid(baseline)||!valid(plan)||!Array.isArray(decisions))throw Error('Invalid repair input');
 if(!equal(prepareRepairPlan(baseline),plan))throw Error('Repair plan mismatch');
 const current=await auditCIDiagnostics(currentInputs,{file});
 const original=new Set(baseline.items.map(key));
 const remaining=new Set(current.items.map(key));
 const known=new Set(plan.tasks.map(x=>x.id));
 const ids=new Set();
 for(const d of decisions){if(!valid(d)||!known.has(d.taskId)||ids.has(d.taskId))throw Error('Invalid or duplicate repair decision');ids.add(d.taskId);}
 const tasks=plan.tasks.map(task=>{
  const d=decisions.find(x=>x.taskId===task.id);
  const persists=remaining.has(task.issueKey);
  let status='OPEN',reason=persists?'ISSUE_STILL_PRESENT':'REVIEW_MISSING';
  if(d){
   if(!['CLOSE','DEFER','REJECT'].includes(d.decision))throw Error('Invalid repair decision');
   if(d.decision==='REJECT'){status='BLOCKED';reason='REVIEW_REJECTED';}
   else if(d.decision==='DEFER'){status='OPEN';reason='DEFERRED';}
   else if(persists){status='OPEN';reason='ISSUE_STILL_PRESENT';}
   else if(![d.reviewer,d.description,d.evidence].every(x=>typeof x==='string'&&x.trim().length>=3)){status='OPEN';reason='REPAIR_EVIDENCE_MISSING';}
   else {status='CLOSED';reason='VERIFIED_ABSENT_AND_REVIEWED';}
  }
  return {taskId:task.id,status,reason};
 });
 const introduced=current.items.filter(x=>!original.has(key(x))).map(x=>({stage:x.stage,code:x.code,message:x.message}));
 const status=tasks.some(x=>x.status==='BLOCKED')?'BLOCKED':tasks.some(x=>x.status!=='CLOSED')||introduced.length||current.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW'?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'8.6',baselineHash:baseline.reportHash,planHash:plan.planHash,currentDocumentHash:current.documentHash,currentDiagnosticsHash:current.reportHash,status,tasks,introduced,limitations:['Issue identity uses registered diagnostic code and message; changed wording may appear as a new issue','A closed repair does not independently establish factual accuracy or publication approval']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyRepair(input,report){const expected=await auditRepair(input);if(!equal(expected,report))throw Error('Repair report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
