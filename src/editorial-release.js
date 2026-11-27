import {sha256} from './core.js';
import {auditEditorialSafety} from './editorial-safety.js';
import {evaluateRevisionGate} from './release-gate.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
/** Decision inputs are assertions by reviewers, not verified semantic facts. */
export function evaluateEditorialRelease(before,after,anchors,inventory,{decisions=null,review=null,contractReport=null}={}){
 const safety=auditEditorialSafety(before,after,inventory);
 const gate=evaluateRevisionGate(before,after,anchors,{review,contractReport});
 const changed=safety.items.filter(i=>i.status==='REVIEW_REQUIRED');
 const reasons=[...gate.reasons];
 const decisionsHash=decisions===null?null:sha256(JSON.stringify(decisions));
 const byId=new Map();
 if(decisions!==null){
  if(!obj(decisions)||decisions.schemaVersion!=='3.5'||decisions.beforeHash!==safety.beforeHash||decisions.afterHash!==safety.afterHash||decisions.inventoryHash!==safety.inventoryHash||!Array.isArray(decisions.items))throw Error('Invalid or stale editorial decisions');
  for(const d of decisions.items){
   if(!obj(d)||typeof d.id!=='string'||byId.has(d.id)||!['approve','reject'].includes(d.decision)||typeof d.reviewer!=='string'||!d.reviewer.trim()||typeof d.reason!=='string'||!d.reason.trim()||!changed.some(i=>i.id===d.id))throw Error('Invalid, duplicate, or extraneous editorial decision');
   byId.set(d.id,d);
  }
 }
 for(const item of changed){
  const decision=byId.get(item.id);
  if(!decision)reasons.push({code:'EDITORIAL_REVIEW_MISSING',id:item.id});
  else if(decision.decision==='reject')reasons.push({code:'EDITORIAL_CHANGE_REJECTED',id:item.id});
 }
 if(inventory.length===0)reasons.push({code:'NO_EDITORIAL_INVENTORY'});
 const blocked=gate.status==='BLOCKED'||reasons.some(r=>r.code==='EDITORIAL_CHANGE_REJECTED');
 const status=blocked?'BLOCKED':reasons.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE';
 const payload={schemaVersion:'3.5',status,beforeHash:safety.beforeHash,afterHash:safety.afterHash,inventoryHash:safety.inventoryHash,anchorsHash:sha256(JSON.stringify(anchors)),decisionsHash,gateStatus:gate.status,changedEditorialItems:changed.map(i=>i.id),reasons,limitations:['Approval is self-declared and does not establish semantic equivalence','Unlisted qualifications and claims cannot be detected','READY_FOR_HUMAN_RELEASE requires a separate human publication decision']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export function verifyEditorialRelease(before,after,anchors,inventory,options,report){
 if(!obj(report)||report.schemaVersion!=='3.5')throw Error('Invalid editorial release report');
 const expected=evaluateEditorialRelease(before,after,anchors,inventory,options);
 if(JSON.stringify(report)!==JSON.stringify(expected))throw Error('Editorial release report mismatch');
 return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};
}
