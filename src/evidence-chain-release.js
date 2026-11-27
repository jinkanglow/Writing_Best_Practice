import {sha256} from './core.js';
import {auditAcquisitionEvidenceChain} from './acquisition-evidence-chain.js';
import {evaluateFinalGate} from './final-gate.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const valid=x=>typeof x==='string'&&x.trim().length>0;
/** Require an explicitly declared, nonempty critical-fact inventory and verified source links. */
export async function auditEvidenceChainRelease({root,records,links,allowedHosts,requiredFacts}){
 if(!Array.isArray(requiredFacts)||!requiredFacts.length||requiredFacts.some(x=>!obj(x)||!valid(x.id)||!valid(x.reason)||!valid(x.reviewer)))throw Error('Explicit nonempty critical fact inventory with id, reason, reviewer required');
 const ids=requiredFacts.map(x=>x.id);if(new Set(ids).size!==ids.length)throw Error('Duplicate critical fact ID');
 const chain=await auditAcquisitionEvidenceChain({root,records,links,allowedHosts});
 const bound=new Set(chain.bindings.map(x=>x.factId));
 const declared=new Set(ids),findings=[...chain.findings];
 for(const id of ids)if(!bound.has(id))findings.push({code:'CRITICAL_FACT_UNLINKED',factId:id});
 for(const id of bound)if(!declared.has(id))findings.push({code:'UNDECLARED_FACT_LINK',factId:id});
 const payload={schemaVersion:'6.3',status:chain.status==='BLOCKED'?'BLOCKED':findings.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',chainHash:chain.reportHash,requiredFactsHash:sha256(JSON.stringify(requiredFacts)),requiredCount:ids.length,verifiedCount:ids.filter(x=>bound.has(x)).length,findings,limitations:['Completeness depends on the editor-declared inventory','Evidence excerpts do not prove semantic support for a claim','Reviewers and source publisher identity are not independently authenticated']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export async function verifyEvidenceChainRelease(inputs,report){const expected=await auditEvidenceChainRelease(inputs);if(!obj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Evidence chain release report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
/** Async wrapper retains the existing synchronous final-gate API for legacy callers. */
export async function evaluateFinalGateWithEvidenceChain(inputs){
 const base=evaluateFinalGate(inputs);
 const required=inputs.requireEvidenceChain===true;
 const audit=inputs.evidenceChain===null||inputs.evidenceChain===undefined?null:await auditEvidenceChainRelease(inputs.evidenceChain);
 const blockers=[...base.blockers],pending=[...base.pending];
 if(required&&!audit)pending.push('EVIDENCE_CHAIN_REQUIRED');
 if(audit?.status==='BLOCKED')blockers.push('EVIDENCE_CHAIN_BLOCKED');
 else if(audit&&audit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('EVIDENCE_CHAIN_INCOMPLETE');
 const {reportHash:_hash,...rest}=base;
 const payload={...rest,schemaVersion:'6.3',status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE',blockers,pending,requireEvidenceChain:required,evidenceChainHash:audit?.reportHash??null,limitations:[...base.limitations,'Critical fact inventory is editor-declared, not exhaustively discovered']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export async function verifyFinalGateWithEvidenceChain(inputs,report){const expected=await evaluateFinalGateWithEvidenceChain(inputs);if(!obj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Final gate evidence-chain report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
