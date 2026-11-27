import {sourceDigest,sourceContains,sourceLocation} from './editorial-evidence-session.js';
import {sha256} from './core.js';
import {auditMetricReconciliation} from './metric-reconciliation.js';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const filled=x=>typeof x==='string'&&x.trim().length>0;
const hash=x=>sha256(JSON.stringify(x));
/** Deterministic, editor-supplied evidence cross-reference. Never authenticates a source. */
export function auditReconciliationEvidence({observations,bridges,sources,evidence}){
 if(!Array.isArray(sources)||!Array.isArray(evidence))throw Error('Expected sources and evidence arrays');
 const reconciliation=auditMetricReconciliation({observations,bridges});
 const findings=[];const add=(code,level,bridgeId,adjustmentId,detail={})=>findings.push({code,level,bridgeId,adjustmentId,...detail});
 const sourceMap=new Map(),evidenceMap=new Map();
 for(const s of sources){if(!object(s)||!filled(s.id)||sourceMap.has(s.id)||!filled(s.text))throw Error('Invalid or duplicate source');sourceMap.set(s.id,s);}
 for(const e of evidence){if(!object(e)||!filled(e.id)||evidenceMap.has(e.id))throw Error('Invalid or duplicate evidence record');evidenceMap.set(e.id,e);}
 const obsMap=new Map(observations.map(o=>[o.id,o]));const used=new Set();const rows=[];
 for(const b of bridges){const from=obsMap.get(b.fromId),to=obsMap.get(b.toId);for(const a of b.adjustments??[]){
  const context=[b.id,a.id];const e=evidenceMap.get(a.evidenceId);
  if(!e){add('EVIDENCE_ID_NOT_FOUND','BLOCK',...context);continue;}
  used.add(e.id);const s=sourceMap.get(e.sourceId);
  if(!s){add('EVIDENCE_SOURCE_NOT_FOUND','BLOCK',...context);continue;}
  if(!filled(e.quote)||!sourceContains(s.text,e.quote)){add('EVIDENCE_QUOTE_NOT_FOUND','BLOCK',...context);continue;}
  if(sourceLocation(s.text,e.quote).first!==sourceLocation(s.text,e.quote).last){add('EVIDENCE_QUOTE_AMBIGUOUS','PENDING',...context);continue;}
  if(!filled(e.sourceHash)||e.sourceHash!==sourceDigest(s.text)){add('EVIDENCE_SOURCE_HASH_MISMATCH','BLOCK',...context);continue;}
  if(!filled(e.amount)||e.amount!==a.amount){add('EVIDENCE_AMOUNT_MISMATCH','BLOCK',...context);continue;}
  // Numeric boundary prevents 20.25 from matching 120.25 or 20.250.
  const escaped=e.amount.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!new RegExp(`(^|[^\\d.])${escaped}(?![\\d.])`).test(e.quote)){add('EVIDENCE_AMOUNT_NOT_IN_QUOTE','PENDING',...context);}
  for(const field of ['entity','metric','period','unit']){
   if(!filled(e[field])){add('EVIDENCE_DIMENSION_UNDOCUMENTED','PENDING',...context,{field});continue;}
   if(from&&to&&from.fact[field]===to.fact[field]&&e[field]!==from.fact[field])add('EVIDENCE_DIMENSION_MISMATCH','BLOCK',...context,{field,expected:from.fact[field],actual:e[field]});
   else if(from&&to&&from.fact[field]!==to.fact[field]&&e[field]!==from.fact[field]&&e[field]!==to.fact[field])add('EVIDENCE_DIMENSION_MISMATCH','BLOCK',...context,{field});
  }
  if(!filled(e.reviewer)||!filled(e.rationale))add('EVIDENCE_REVIEW_UNDOCUMENTED','PENDING',...context);
  rows.push({bridgeId:b.id,adjustmentId:a.id,evidenceId:e.id,sourceId:s.id,sourceHash:sourceDigest(s.text),quoteHash:sha256(e.quote)});
 }}
 for(const e of evidence)if(!used.has(e.id))add('UNUSED_EVIDENCE_RECORD','PENDING',null,null,{evidenceId:e.id});
 const blockers=findings.filter(f=>f.level==='BLOCK').length,pending=findings.filter(f=>f.level==='PENDING').length;
 const payload={schemaVersion:'5.9',inputHash:hash({observations,bridges,sources,evidence}),reconciliationHash:reconciliation.reportHash,status:reconciliation.status==='BLOCKED'||blockers?'BLOCKED':reconciliation.status==='INCOMPLETE'||pending?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',findings,rows,blockers,pending,limitations:['Source content, metadata and reviewer identity are editor-supplied and unauthenticated','Matching a number in an excerpt does not prove accounting validity or semantic support','No automatic OCR, original filing retrieval, currency conversion or accounting-standard verification']};
 return {...payload,reportHash:hash(payload)};
}
export function verifyReconciliationEvidence(inputs,report){const expected=auditReconciliationEvidence(inputs);if(!object(report)||JSON.stringify(report)!==JSON.stringify(expected))throw Error('Reconciliation evidence report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
