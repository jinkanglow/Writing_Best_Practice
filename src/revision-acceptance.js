import {sha256,analyze,validateRules} from './core.js';
import {executeRevisionPlan,verifyRevisionPlan} from './revision-plan.js';
import {prepareRevisionAudit} from './revision.js';
import {validateSkillContract,fuseContracts} from './contracts.js';
import {verifyContract} from './verification.js';

const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const key=f=>`${f.ruleId}\u0000${f.severity}\u0000${f.match}`;
function frequencies(findings){const map=new Map();for(const f of findings)map.set(key(f),(map.get(key(f))||0)+1);return map;}
function checkAnchors(before,after,anchors){
 if(!Array.isArray(anchors))throw Error('anchors must be an array');
 const seen=new Set();return anchors.map(a=>{
  if(!object(a)||typeof a.id!=='string'||!a.id||seen.has(a.id)||typeof a.quote!=='string'||!a.quote)throw Error('Invalid or duplicate anchor');
  seen.add(a.id);const old=before.split(a.quote).length-1,next=after.split(a.quote).length-1;
  if(old!==1)throw Error(`Anchor must occur exactly once in original: ${a.id}`);
  return {id:a.id,originalOccurrences:old,revisedOccurrences:next,status:next===1?'TEXT_PRESENT':'REVIEW_REQUIRED'};
 });
}
export function acceptRevision({before,plan,decisions,rules,anchors=[],primary=null,constraint=null}){
 if(typeof before!=='string')throw Error('Missing original text');
 validateRules(rules);verifyRevisionPlan(before,plan);
 const execution=executeRevisionPlan(before,plan,decisions);
 const after=execution.revisedText;
 const baseline=analyze(before,rules),revised=analyze(after,rules);
 const oldCounts=frequencies(baseline.findings),newCounts=frequencies(revised.findings);
 const regressions=[];
 for(const [k,count] of newCounts){const previous=oldCounts.get(k)||0;if(count>previous){const [ruleId,severity,match]=k.split('\u0000');regressions.push({ruleId,severity,match,previous,current:count,introduced:count-previous});}}
 const anchorChecks=checkAnchors(before,after,anchors);
 let contract=null,fusion=null;
 if(primary||constraint){
  if(!primary||!constraint)throw Error('Both primary and constraint contracts required');
  validateSkillContract(primary);validateSkillContract(constraint);
  fusion=fuseContracts(primary,constraint);
  if(fusion.status!=='BLOCKED'){
   const combined={version:'1.6',requirements:fusion.requirements};
   contract=verifyContract(after,combined);
  }
 }
 const audit=prepareRevisionAudit(before,after,anchors);
 const blockers=[];const pending=[];
 if(fusion?.status==='BLOCKED')blockers.push('EXACT_SKILL_CONFLICT');
 if(revised.counts.error>0)blockers.push('UNRESOLVED_ERROR_FINDINGS');
 if(regressions.some(r=>r.severity==='error'))blockers.push('NEW_ERROR_FINDINGS');
 if(contract?.status==='FAIL')blockers.push('CONTRACT_FAILURE');
 if(execution.pending.length)pending.push('UNDECIDED_TASKS');
 if(revised.counts.warning>0)pending.push('UNRESOLVED_WARNING_FINDINGS');
 if(regressions.some(r=>r.severity!=='error'))pending.push('NEW_NONERROR_FINDINGS');
 if(anchorChecks.some(a=>a.status!=='TEXT_PRESENT'))pending.push('ANCHOR_CHANGED');
 if(contract?.status==='INCOMPLETE')pending.push('UNVERIFIED_CONTRACT_REQUIREMENTS');
 if(audit.status==='INCOMPLETE'&&anchorChecks.some(a=>a.status!=='TEXT_PRESENT'))pending.push('REVISION_AUDIT_PENDING');
 // Passing literal checks and preserved quotes do not establish semantic equivalence.
 const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'3.2',status,documentHash:sha256(before),revisedHash:sha256(after),planHash:plan.planHash,rulesHash:sha256(JSON.stringify(rules)),anchorsHash:sha256(JSON.stringify(anchors)),fusion,contract,baseline:baseline.counts,revised:revised.counts,regressions,anchorChecks,execution:{status:execution.status,results:execution.results,pending:execution.pending,patches:execution.patches},blockers,pending,limitations:['Rule regressions are counted by rule, severity and matched phrase, not semantic equivalence','Literal anchor survival does not prove meaning is preserved','READY_FOR_HUMAN_REVIEW does not authorize publication']};
 return {...payload,reportHash:sha256(JSON.stringify(payload)),revisedText:after};
}
export function verifyRevisionAcceptance(report,before,after){
 if(!object(report)||report.schemaVersion!=='3.2'||typeof report.reportHash!=='string')throw Error('Invalid acceptance report');
 const {reportHash,revisedText,...payload}=report;
 if(sha256(JSON.stringify(payload))!==reportHash)throw Error('Acceptance report checksum mismatch');
 if(sha256(before)!==report.documentHash||sha256(after)!==report.revisedHash)throw Error('Acceptance report document mismatch');
 if(revisedText!==undefined&&revisedText!==after)throw Error('Acceptance embedded revision mismatch');
 return {status:'REPORT_INTEGRITY_VERIFIED',decision:report.status,reportHash};
}
