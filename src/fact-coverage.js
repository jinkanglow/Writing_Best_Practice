import {sha256} from './core.js';
import {auditFinancialFacts} from './financial-facts.js';
const digest=x=>sha256(JSON.stringify(x));
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const signal=/(?:\d[\d,.]*\s*(?:%|％|个百分点|亿元|万元|美元|人民币|RM|USD|MYR|bp|倍|亿|万)|同比|环比|增长|下降|利润|营收|收入|净流出|EPS|毛利率|市值|股价|预测|预计|指引|收益率)/iu;
export function discoverFactUnits(text){
 const units=[];let cursor=0;
 for(const line of text.split('\n')){
  const trimmed=line.trim();
  if(trimmed&&!/^\s*(?:```|~~~|#|>|\|)/u.test(line)){
   const start=cursor+line.indexOf(trimmed);
   units.push({id:`u${units.length+1}`,startByte:Buffer.byteLength(text.slice(0,start)),endByte:Buffer.byteLength(text.slice(0,start+trimmed.length)),quote:trimmed,signal:signal.test(trimmed)});
  }
  cursor+=line.length+1;
 }
 return units;
}
function assess(text,inventory,attestations,side){
 if(!isObj(inventory)||inventory.documentHash!==sha256(text)||!Array.isArray(inventory.facts))throw Error(`Invalid ${side} inventory binding`);
 if(!Array.isArray(attestations))throw Error(`Expected ${side} attestations`);
 const units=discoverFactUnits(text),byId=new Map();
 for(const a of attestations){
  if(!isObj(a)||typeof a.unitId!=='string'||byId.has(a.unitId)||!['covered','no-financial-fact'].includes(a.action)||typeof a.reviewer!=='string'||!a.reviewer.trim()||typeof a.rationale!=='string'||!a.rationale.trim())throw Error(`Invalid or duplicate ${side} attestation`);
  byId.set(a.unitId,a);
 }
 for(const id of byId.keys())if(!units.some(u=>u.id===id))throw Error(`Unknown ${side} unit ${id}`);
 const unreviewed=[],uncovered=[],conflicts=[],covered=[];
 for(const u of units){
  const registered=inventory.facts.filter(f=>u.quote.includes(f.quote));
  const a=byId.get(u.id);
  if(!a){if(u.signal||registered.length)unreviewed.push(u.id);continue;}
  if(a.action==='covered'){
   if(!registered.length)conflicts.push({unitId:u.id,reason:'COVERED_WITHOUT_REGISTERED_FACT'});
   else covered.push(u.id);
  }else if(registered.length)conflicts.push({unitId:u.id,reason:'NO_FACT_CONTRADICTS_REGISTERED_FACT'});
  else if(u.signal)uncovered.push(u.id);
 }
 for(const f of inventory.facts){const matches=units.filter(u=>u.quote.includes(f.quote));if(matches.length!==1)conflicts.push({factId:f.id,reason:'FACT_NOT_BOUND_TO_SINGLE_UNIT'});}
 return {units,covered,unreviewed,uncovered,conflicts,signalUnits:units.filter(u=>u.signal).length};
}
/** Editor-attested line coverage, not automated proof of complete fact extraction. */
export function auditFactCoverage({before,after,beforeInventory,afterInventory,review=[],beforeAttestations=[],afterAttestations=[]}){
 const facts=auditFinancialFacts({before,after,beforeInventory,afterInventory,review});
 const left=assess(before,beforeInventory,beforeAttestations,'before'),right=assess(after,afterInventory,afterAttestations,'after');
 const blockers=[...left.conflicts.map(x=>`BEFORE_${x.reason}`),...right.conflicts.map(x=>`AFTER_${x.reason}`)];
 if(facts.status==='BLOCKED')blockers.push('FACT_CHANGE_REJECTED');
 const pending=[];
 if(facts.status==='INCOMPLETE')pending.push('FACT_CHANGE_REVIEW_INCOMPLETE');
 if(left.unreviewed.length||right.unreviewed.length)pending.push('SIGNAL_UNITS_UNREVIEWED');
 if(left.uncovered.length||right.uncovered.length)pending.push('SIGNAL_UNITS_WITHOUT_FACTS');
 const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'5.2',status,beforeHash:sha256(before),afterHash:sha256(after),factAuditHash:facts.reportHash,attestationsHash:digest({beforeAttestations,afterAttestations}),beforeCoverage:left,afterCoverage:right,blockers:[...new Set(blockers)],pending,limitations:['Heuristic signals do not enumerate all financial facts','Line-level attestation does not prove all facts in a line were registered','Inventories are editor supplied and not independently fact-checked','Reviewers are not authenticated; readiness is not publication authorization']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyFactCoverage(inputs,report){const expected=auditFactCoverage(inputs);if(!isObj(report)||JSON.stringify(report)!==JSON.stringify(expected))throw Error('Fact coverage report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
