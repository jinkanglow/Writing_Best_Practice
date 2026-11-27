import {sourceLocation} from './editorial-evidence-session.js';
import {sha256} from './core.js';

const fields=['entity','metric','value','unit','period','source','condition'];
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const digest=x=>sha256(JSON.stringify(x));
function validateInventory(inventory,text,side){
 if(!isObject(inventory)||inventory.schemaVersion!=='5.1'||inventory.documentHash!==sha256(text)||!Array.isArray(inventory.facts))throw Error(`Invalid ${side} fact inventory or document hash`);
 const ids=new Set();
 for(const f of inventory.facts){
  if(!isObject(f)||typeof f.id!=='string'||!f.id.trim()||ids.has(f.id))throw Error(`Invalid or duplicate ${side} fact ID`);
  ids.add(f.id);
  if(typeof f.quote!=='string'||!f.quote.trim()||sourceLocation(text,f.quote).nonOverlapping!==1)throw Error(`Fact ${f.id} must have one uniquely occurring source quote`);
  if(!isObject(f.tuple)||Object.keys(f.tuple).sort().join('|')!==[...fields].sort().join('|'))throw Error(`Fact ${f.id} requires exact tuple fields`);
  for(const key of fields)if(typeof f.tuple[key]!=='string')throw Error(`Invalid ${key} in ${f.id}`);
  if(!f.tuple.entity.trim()||!f.tuple.metric.trim()||!f.tuple.value.trim())throw Error(`Fact ${f.id} missing entity/metric/value`);
  // Field-to-quote grounding is a human attestation, not automatic extraction.
 }
 return new Map(inventory.facts.map(f=>[f.id,f]));
}
/** Compare editor-declared structured facts; no automatic fact extraction or truth claim. */
export function auditFinancialFacts({before,after,beforeInventory,afterInventory,review=[]}){
 if(typeof before!=='string'||typeof after!=='string')throw Error('Both document texts required');
 const a=validateInventory(beforeInventory,before,'before'),b=validateInventory(afterInventory,after,'after');
 if(!Array.isArray(review))throw Error('Expected review array');
 const changes=[];
 for(const id of [...new Set([...a.keys(),...b.keys()])].sort()){
  const old=a.get(id),next=b.get(id);
  const changedFields=old&&next?fields.filter(k=>old.tuple[k]!==next.tuple[k]):fields;
  if(!old||!next||changedFields.length)changes.push({id,type:!old?'ADDED':!next?'REMOVED':'MODIFIED',changedFields,before:old?.tuple??null,after:next?.tuple??null});
 }
 const byId=new Map();
 for(const r of review){
  if(!isObject(r)||typeof r.id!=='string'||byId.has(r.id)||!['accept','reject'].includes(r.action)||typeof r.reviewer!=='string'||!r.reviewer.trim()||typeof r.rationale!=='string'||!r.rationale.trim())throw Error('Invalid or duplicate review');
  byId.set(r.id,r);
 }
 const changedIds=new Set(changes.map(x=>x.id));
 for(const id of byId.keys())if(!changedIds.has(id))throw Error(`Review refers to unchanged or missing fact ${id}`);
 const rejected=changes.filter(c=>byId.get(c.id)?.action==='reject').map(c=>c.id);
 const pending=changes.filter(c=>!byId.has(c.id)).map(c=>c.id);
 const status=rejected.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'5.1',status,beforeHash:sha256(before),afterHash:sha256(after),beforeInventoryHash:digest(beforeInventory),afterInventoryHash:digest(afterInventory),reviewHash:digest(review),changes,rejected,pending,limitations:['Inventories are supplied by editors, not extracted or independently verified','Matching IDs and tuple fields do not prove factual correctness or complete coverage','Quoted text uniqueness binds a location but does not prove the declared tuple is accurate','Reviewer identity is not authenticated; approval is not release authorization']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyFinancialFacts(inputs,report){
 const expected=auditFinancialFacts(inputs);
 if(!isObject(report)||JSON.stringify(report)!==JSON.stringify(expected))throw Error('Financial fact report mismatch');
 return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};
}
