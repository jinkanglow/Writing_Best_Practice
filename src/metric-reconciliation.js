import {sha256} from './core.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const str=x=>typeof x==='string'&&x.trim().length>0;
const digest=x=>sha256(JSON.stringify(x));
// Exact fixed-point arithmetic: at most six decimal places, no floating-point rounding.
function decimal(s){if(typeof s!=='string'||!/^[-+]?(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(s))throw Error('Invalid decimal: expected string with <=6 decimal places');const negative=s[0]==='-',parts=s.replace(/^[-+]/,'').split('.');let n=BigInt(parts[0])*1000000n+BigInt((parts[1]??'').padEnd(6,'0'));return negative?-n:n;}
function format(n){const sign=n<0n?'-':'';const v=n<0n?-n:n;const frac=(v%1000000n).toString().padStart(6,'0').replace(/0+$/,'');return sign+(v/1000000n).toString()+(frac?'.'+frac:'');}
const dimensions=['entity','metric','period','unit','condition','accountingBasis','consolidationScope','measurementBasis'];
/** Verifies a declared bridge between two observations, not accounting truth. */
export function auditMetricReconciliation({observations,bridges=[]}){
 if(!Array.isArray(observations)||!Array.isArray(bridges))throw Error('Invalid reconciliation inputs');
 const byId=new Map(),findings=[],rows=[];
 const add=(code,level,bridgeId,detail={})=>findings.push({code,level,bridgeId,...detail});
 for(const o of observations){if(!obj(o)||!str(o.id)||byId.has(o.id)||!obj(o.fact)||!dimensions.every(k=>str(o.fact[k]))||typeof o.fact.value!=='string')throw Error('Invalid or duplicate reconciliation observation');decimal(o.fact.value);byId.set(o.id,o);}
 const seen=new Set();
 for(const b of bridges){
  if(!obj(b)||!str(b.id)||seen.has(b.id)||!str(b.fromId)||!str(b.toId)||!Array.isArray(b.adjustments))throw Error('Invalid or duplicate reconciliation bridge');seen.add(b.id);
  const from=byId.get(b.fromId),to=byId.get(b.toId);
  if(!from||!to){add('MISSING_OBSERVATION','BLOCK',b.id);continue;}
  if(b.fromId===b.toId){add('SELF_RECONCILIATION','BLOCK',b.id);continue;}
  for(const k of ['entity','period'])if(from.fact[k]!==to.fact[k])add('INCOMPATIBLE_'+k.toUpperCase(),'BLOCK',b.id);
  const changed=dimensions.filter(k=>from.fact[k]!==to.fact[k]);
  if(changed.includes('unit'))add('UNIT_CONVERSION_NOT_SUPPORTED','BLOCK',b.id);
  if(changed.includes('metric')&&!str(b.metricMappingRationale))add('METRIC_MAPPING_UNDOCUMENTED','PENDING',b.id);
  if(changed.some(k=>['condition','accountingBasis','consolidationScope','measurementBasis'].includes(k))&&!str(b.scopeMappingRationale))add('SCOPE_MAPPING_UNDOCUMENTED','PENDING',b.id);
  if(!str(b.reviewer)||!str(b.rationale))add('REVIEW_UNDOCUMENTED','PENDING',b.id);
  let sum=decimal(from.fact.value),valid=true;const adjustmentIds=new Set();
  for(const a of b.adjustments){
   if(!obj(a)||!str(a.id)||adjustmentIds.has(a.id)||!str(a.label)||!str(a.reason)||!str(a.evidenceId)||typeof a.amount!=='string'){add('INVALID_ADJUSTMENT','BLOCK',b.id);valid=false;continue;}
   adjustmentIds.add(a.id);sum+=decimal(a.amount);
  }
  if(!b.adjustments.length&&from.fact.value!==to.fact.value)add('UNEXPLAINED_VALUE_CHANGE','PENDING',b.id);
  if(valid&&sum!==decimal(to.fact.value))add('RECONCILIATION_MISMATCH','BLOCK',b.id,{expected:to.fact.value,calculated:format(sum)});
  rows.push({bridgeId:b.id,fromId:b.fromId,toId:b.toId,changedDimensions:changed,calculated:format(sum),target:to.fact.value,adjustmentCount:b.adjustments.length});
 }
 const blockers=findings.filter(x=>x.level==='BLOCK').length,pending=findings.filter(x=>x.level==='PENDING').length;
 const payload={schemaVersion:'5.8',inputHash:digest({observations,bridges}),status:blockers?'BLOCKED':pending?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',rows,findings,blockers,pending,limitations:['Editor-supplied observations, evidence IDs and adjustments are not authenticated','No automatic accounting-standard mapping, FX conversion or unit conversion','Six-decimal fixed-point arithmetic only; reconciliation equality is not proof of financial correctness']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyMetricReconciliation(inputs,report){const expected=auditMetricReconciliation(inputs);if(!obj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Reconciliation report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
