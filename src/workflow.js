import {sha256, analyze, validateRules} from './core.js';
import {auditAnchorCoverage,buildReleaseEvidence,verifyReleaseEvidence} from './release-evidence.js';

const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
/** Deterministic orchestration of existing checks. No generation or semantic verification. */
export function runWritingWorkflow({before,after,anchors,inventory,rules,review=null,contractReport=null,metadata={}}){
  if(typeof before!=='string'||typeof after!=='string'||!Array.isArray(anchors)||!Array.isArray(inventory))throw Error('Workflow requires before, after, anchors and inventory');
  if(!isObj(metadata)||Object.values(metadata).some(v=>typeof v!=='string'))throw Error('Workflow metadata must contain string values');
  validateRules(rules);
  const analysis=analyze(after,rules,{file:metadata.afterFile||'<revised>'});
  const coverage=auditAnchorCoverage(before,anchors,inventory);
  const bundle=buildReleaseEvidence(before,after,anchors,inventory,{review,contractReport});
  const steps=[
    {id:'analyze',status:analysis.status==='FAIL'?'BLOCKED':analysis.status==='PASS_WITH_REVIEW'?'INCOMPLETE':'PASS',evidence:{documentHash:analysis.documentHash,findings:analysis.findings.length,errors:analysis.counts.error,warnings:analysis.counts.warning,infos:analysis.counts.info}},
    {id:'coverage',status:coverage.status==='INCOMPLETE'?'INCOMPLETE':'PASS',evidence:{beforeHash:coverage.beforeHash,covered:coverage.covered,total:coverage.total}},
    {id:'release_gate',status:bundle.gate.status==='BLOCKED'?'BLOCKED':bundle.gate.status==='INCOMPLETE'?'INCOMPLETE':'PASS',evidence:{beforeHash:bundle.gate.beforeHash,afterHash:bundle.gate.afterHash,reasons:bundle.gate.reasons}},
    {id:'bundle_integrity',status:'PASS',evidence:{bundleHash:bundle.bundleHash}}
  ];
  const status=steps.some(s=>s.status==='BLOCKED')?'BLOCKED':steps.some(s=>s.status==='INCOMPLETE')?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE';
  const payload={schemaVersion:'3.0',metadata,documentHashes:{before:sha256(before),after:sha256(after)},rulesHash:sha256(JSON.stringify(rules)),status,steps,bundle,analysis};
  return {...payload,workflowHash:sha256(JSON.stringify(payload)),limitations:['No automatic drafting, revision, semantic equivalence or fact checking','Warnings require review','Workflow hash is an integrity checksum, not a signature','READY_FOR_HUMAN_RELEASE does not authorize publication']};
}
export function verifyWritingWorkflow(report){
  if(!isObj(report)||report.schemaVersion!=='3.0'||!isObj(report.bundle)||!Array.isArray(report.steps)||!isObj(report.analysis)||!isObj(report.documentHashes))throw Error('Invalid workflow report');
  const {workflowHash,limitations,...payload}=report;
  if(typeof workflowHash!=='string'||sha256(JSON.stringify(payload))!==workflowHash)throw Error('Workflow checksum mismatch');
  verifyReleaseEvidence(report.bundle);
  if(report.documentHashes.before!==sha256(report.bundle.before)||report.documentHashes.after!==sha256(report.bundle.after)||report.analysis.documentHash!==sha256(report.bundle.after))throw Error('Workflow document hash mismatch');
  if(report.steps.length!==4||report.steps.map(s=>s.id).join(',')!=='analyze,coverage,release_gate,bundle_integrity')throw Error('Workflow stage mismatch');
  const expected=report.steps.some(s=>s.status==='BLOCKED')?'BLOCKED':report.steps.some(s=>s.status==='INCOMPLETE')?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE';
  if(report.status!==expected)throw Error('Workflow status mismatch');
  return {status:'INTEGRITY_VERIFIED',releaseStatus:report.status,workflowHash,limitations:['This validates stored checksums and consistency, not source authenticity or semantic correctness']};
}
