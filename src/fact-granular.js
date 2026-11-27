import {sha256} from './core.js';
import {auditFinancialFacts} from './financial-facts.js';
const digest=x=>sha256(JSON.stringify(x));
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
// Intentionally a candidate detector, not a semantic fact extractor.
const pattern=/(?:\b(?:USD|MYR|RM|EUR|GBP|NT\$|HK\$|US\$)\s*\d[\d,.]*(?:\s*(?:亿|万|million|billion))?\b|\d[\d,.]*\s*(?:%|％|个百分点|bp|bps|亿元|万元|亿美元|亿港元|亿新台币|美元|人民币|RM|USD|MYR|倍|亿|万)|\b(?:EPS|P\/E|YoY|QoQ)\b|同比|环比|净流出|营收|毛利率|净利润|经营现金流|市值|预测|预计|指引)/giu;
const startByte=(s,n)=>Buffer.byteLength(s.slice(0,n));
export function discoverFactCandidates(text){
 if(typeof text!=='string')throw Error('Expected document text');
 const found=[];let inFence=false,offset=0;
 for(const line of text.split('\n')){
  if(/^\s*(```|~~~)/u.test(line)){inFence=!inFence;offset+=line.length+1;continue;}
  if(inFence||/^\s*>/u.test(line)){offset+=line.length+1;continue;}
  // Markdown table cells are included; each independent signal is a separate candidate.
  for(const m of line.matchAll(pattern)){
   const start=offset+m.index,end=start+m[0].length;
   found.push({id:`c${found.length+1}`,startByte:startByte(text,start),endByte:startByte(text,end),quote:m[0],line:1+text.slice(0,start).split('\n').length-1,context:line.trim()});
  }
  offset+=line.length+1;
 }
 return found;
}
function inspectSide(text,inventory,attestations,side){
 if(!isObj(inventory)||inventory.documentHash!==sha256(text)||!Array.isArray(inventory.facts))throw Error(`Invalid ${side} inventory binding`);
 if(!Array.isArray(attestations))throw Error(`Expected ${side} candidate attestations`);
 const candidates=discoverFactCandidates(text),byId=new Map(),factIds=new Set(inventory.facts.map(f=>f.id));
 for(const a of attestations){
  if(!isObj(a)||typeof a.candidateId!=='string'||byId.has(a.candidateId)||!['covered','no-financial-fact'].includes(a.action)||typeof a.reviewer!=='string'||!a.reviewer.trim()||typeof a.rationale!=='string'||!a.rationale.trim())throw Error(`Invalid or duplicate ${side} candidate attestation`);
  if(a.action==='covered'&&(!Array.isArray(a.factIds)||!a.factIds.length||new Set(a.factIds).size!==a.factIds.length||a.factIds.some(id=>!factIds.has(id))))throw Error(`Invalid ${side} fact IDs`);
  if(a.action==='no-financial-fact'&&a.factIds?.length)throw Error(`Contradictory ${side} candidate attestation`);
  byId.set(a.candidateId,a);
 }
 for(const id of byId.keys())if(!candidates.some(c=>c.id===id))throw Error(`Unknown ${side} candidate ${id}`);
 const pending=[],conflicts=[],covered=[],dismissed=[];
 for(const c of candidates){
  const a=byId.get(c.id);
  if(!a){pending.push(c.id);continue;}
  if(a.action==='no-financial-fact'){dismissed.push(c.id);continue;}
  const anchored=a.factIds.some(id=>{
   const fact=inventory.facts.find(f=>f.id===id);
   const pos=text.indexOf(fact.quote),end=pos+fact.quote.length;
   const byteStart=startByte(text,pos),byteEnd=startByte(text,end);
   return c.startByte>=byteStart&&c.endByte<=byteEnd;
  });
  if(!anchored)conflicts.push({candidateId:c.id,reason:'FACT_QUOTE_DOES_NOT_ENCLOSE_CANDIDATE'});
  else covered.push(c.id);
 }
 return {candidates,covered,dismissed,pending,conflicts,coverageRate:candidates.length?(covered.length+dismissed.length)/candidates.length:1};
}
/** Candidate-level editorial attestations, not proof of exhaustive fact extraction. */
export function auditGranularFactCoverage({before,after,beforeInventory,afterInventory,review=[],beforeCandidateAttestations=[],afterCandidateAttestations=[]}){
 const facts=auditFinancialFacts({before,after,beforeInventory,afterInventory,review});
 const left=inspectSide(before,beforeInventory,beforeCandidateAttestations,'before');
 const right=inspectSide(after,afterInventory,afterCandidateAttestations,'after');
 const blockers=[...left.conflicts.map(x=>`BEFORE_${x.reason}`),...right.conflicts.map(x=>`AFTER_${x.reason}`)];
 if(facts.status==='BLOCKED')blockers.push('FACT_CHANGE_REJECTED');
 const pending=[];
 if(facts.status==='INCOMPLETE')pending.push('FACT_CHANGE_REVIEW_INCOMPLETE');
 if(left.pending.length||right.pending.length)pending.push('CANDIDATES_NOT_ATTESTED');
 const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'5.3',status,beforeHash:sha256(before),afterHash:sha256(after),factAuditHash:facts.reportHash,attestationsHash:digest({beforeCandidateAttestations,afterCandidateAttestations}),beforeCoverage:left,afterCoverage:right,blockers,pending,limitations:['Lexical candidates are not complete financial fact extraction','A dismissed candidate may still contain a material fact','Editor supplied tuples and attestations are not independent evidence','Markdown table cells are scanned but cross-line relationships are not reconstructed','Reviewer identity is not authenticated']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyGranularFactCoverage(inputs,report){const expected=auditGranularFactCoverage(inputs);if(!isObj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Granular fact coverage report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
