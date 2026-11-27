import {auditSourceConflicts} from './source-conflicts.js';
import {auditReconciliationEvidence} from './reconciliation-evidence.js';
import {auditMetricReconciliation} from './metric-reconciliation.js';
import {assureClaimAwareRewrite} from './claim-aware-rewrite.js';
import {sha256} from './core.js';
import {auditFactCoverage} from './fact-coverage.js';
import {auditGranularFactCoverage} from './fact-granular.js';
import {auditFactEvidence} from './fact-evidence.js';
import {auditClaims} from './claim-integrity.js';
import {auditArgumentGraph} from './argument-graph.js';
import {evaluateEditorialRelease} from './editorial-release.js';
import {verifyRevisionAcceptance,acceptRevision} from './revision-acceptance.js';
import {validateSkillContract,fuseContracts} from './contracts.js';
import {verifyContract} from './verification.js';

/** All declared inputs are mandatory; missing acceptance is not silently waived. */
export function evaluateFinalGate({before,after,anchors,inventory,acceptance,plan,planDecisions,rules,editorialDecisions=null,anchorDecisions=null,contractReport=null,primary=null,constraint=null,claims=null,claimReview=null,argumentGraph=null,argumentReview=null,claimAwareRewrite=null,factCoverage=null,granularFactCoverage=null,requireGranularCoverage=false,factEvidence=null,requireFactEvidence=false,sourceConflicts=null,requireSourceConflicts=false,metricReconciliation=null,requireMetricReconciliation=false,reconciliationEvidence=null,requireReconciliationEvidence=false}){
  if(!acceptance||!plan||!planDecisions||!rules)throw Error('Acceptance report, revision plan, decisions and rules required');
  const recomputed=acceptRevision({before,plan,decisions:planDecisions,rules,anchors,primary,constraint});
  if(recomputed.revisedText!==after||recomputed.reportHash!==acceptance.reportHash)throw Error('Acceptance recomputation mismatch');
  const acceptanceIntegrity=verifyRevisionAcceptance(acceptance,before,after);
  const editorial=evaluateEditorialRelease(before,after,anchors,inventory,{decisions:editorialDecisions,review:anchorDecisions,contractReport});
  const blockers=[],pending=[];
  if(acceptance.status==='BLOCKED')blockers.push('REVISION_ACCEPTANCE_BLOCKED');
  else if(acceptance.status!=='READY_FOR_HUMAN_REVIEW')pending.push('REVISION_ACCEPTANCE_NOT_READY');
  if(editorial.status==='BLOCKED')blockers.push('EDITORIAL_RELEASE_BLOCKED');
  else if(editorial.status!=='READY_FOR_HUMAN_RELEASE')pending.push('EDITORIAL_RELEASE_INCOMPLETE');
  let skill=null;
  if(primary!==null||constraint!==null){
    if(!primary||!constraint)throw Error('Both primary and constraint skill contracts are required');
    validateSkillContract(primary);validateSkillContract(constraint);
    const fusion=fuseContracts(primary,constraint);
    if(fusion.status==='BLOCKED'){
      blockers.push('SKILL_FUSION_CONFLICT');skill={fusionStatus:fusion.status};
    }else{
      const checked=verifyContract(after,{version:'1.6',requirements:fusion.requirements});
      skill={fusionStatus:fusion.status,verificationStatus:checked.status,report:checked};
      if(checked.status==='FAIL')blockers.push('SKILL_CONTRACT_FAILED');
      else if(checked.status!=='PASS')pending.push('SKILL_CONTRACT_UNVERIFIED');
    }
  }else pending.push('SKILL_CONTRACTS_NOT_PROVIDED');
  let claimAudit=null,graphAudit=null;
  if(claims!==null){claimAudit=auditClaims(before,after,claims,claimReview);if(claimAudit.status==='BLOCKED')blockers.push('CLAIM_INTEGRITY_BLOCKED');else if(claimAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('CLAIM_INTEGRITY_INCOMPLETE');}
  if(argumentGraph!==null){graphAudit=auditArgumentGraph(before,after,argumentGraph,argumentReview);if(graphAudit.status==='BLOCKED')blockers.push('ARGUMENT_GRAPH_BLOCKED');else if(graphAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('ARGUMENT_GRAPH_INCOMPLETE');}
  let rewriteAssurance=null;
  if(claimAwareRewrite!==null){
    if(claimAwareRewrite.before!==before||claimAwareRewrite.after!==after)throw Error('Claim-aware rewrite documents differ from final gate');
    rewriteAssurance=assureClaimAwareRewrite(claimAwareRewrite);
    if(rewriteAssurance.status==='BLOCKED')blockers.push('CLAIM_AWARE_REWRITE_BLOCKED');
    else if(rewriteAssurance.status!=='READY_FOR_HUMAN_REVIEW')pending.push('CLAIM_AWARE_REWRITE_INCOMPLETE');
  }
  let factCoverageAudit=null;
  if(factCoverage!==null){
    if(factCoverage.before!==before||factCoverage.after!==after)throw Error('Fact coverage documents differ from final gate');
    factCoverageAudit=auditFactCoverage(factCoverage);
    if(factCoverageAudit.status==='BLOCKED')blockers.push('FACT_COVERAGE_BLOCKED');
    else if(factCoverageAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('FACT_COVERAGE_INCOMPLETE');
  }
  let granularCoverageAudit=null;
  if(requireGranularCoverage&&granularFactCoverage===null)pending.push('GRANULAR_FACT_COVERAGE_REQUIRED');
  if(granularFactCoverage!==null){
    if(granularFactCoverage.before!==before||granularFactCoverage.after!==after)throw Error('Granular coverage documents differ from final gate');
    granularCoverageAudit=auditGranularFactCoverage(granularFactCoverage);
    if(granularCoverageAudit.status==='BLOCKED')blockers.push('GRANULAR_FACT_COVERAGE_BLOCKED');
    else if(granularCoverageAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('GRANULAR_FACT_COVERAGE_INCOMPLETE');
  }
  let factEvidenceAudit=null;
  if(requireFactEvidence&&factEvidence===null)pending.push('FACT_EVIDENCE_REQUIRED');
  if(factEvidence!==null){
    if(factEvidence.before!==before||factEvidence.after!==after)throw Error('Fact evidence documents differ from final gate');
    factEvidenceAudit=auditFactEvidence(factEvidence);
    if(factEvidenceAudit.status==='BLOCKED')blockers.push('FACT_EVIDENCE_BLOCKED');
    else if(factEvidenceAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('FACT_EVIDENCE_INCOMPLETE');
  }
  let sourceConflictAudit=null;
  if(requireSourceConflicts&&sourceConflicts===null)pending.push('SOURCE_CONFLICT_AUDIT_REQUIRED');
  if(sourceConflicts!==null){
    sourceConflictAudit=auditSourceConflicts(sourceConflicts);
    if(sourceConflictAudit.status==='BLOCKED')blockers.push('SOURCE_CONFLICT_AUDIT_BLOCKED');
    else if(sourceConflictAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('SOURCE_CONFLICT_AUDIT_INCOMPLETE');
  }
  let metricReconciliationAudit=null;
  if(requireMetricReconciliation&&metricReconciliation===null)pending.push('METRIC_RECONCILIATION_REQUIRED');
  if(metricReconciliation!==null){
    metricReconciliationAudit=auditMetricReconciliation(metricReconciliation);
    if(metricReconciliationAudit.status==='BLOCKED')blockers.push('METRIC_RECONCILIATION_BLOCKED');
    else if(metricReconciliationAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('METRIC_RECONCILIATION_INCOMPLETE');
  }
  let reconciliationEvidenceAudit=null;
  if(requireReconciliationEvidence&&reconciliationEvidence===null)pending.push('RECONCILIATION_EVIDENCE_REQUIRED');
  if(reconciliationEvidence!==null){
    reconciliationEvidenceAudit=auditReconciliationEvidence(reconciliationEvidence);
    if(reconciliationEvidenceAudit.status==='BLOCKED')blockers.push('RECONCILIATION_EVIDENCE_BLOCKED');
    else if(reconciliationEvidenceAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('RECONCILIATION_EVIDENCE_INCOMPLETE');
    if(metricReconciliation!==null&&sha256(JSON.stringify({observations:metricReconciliation.observations,bridges:metricReconciliation.bridges}))!==sha256(JSON.stringify({observations:reconciliationEvidence.observations,bridges:reconciliationEvidence.bridges})))blockers.push('RECONCILIATION_EVIDENCE_INPUT_DIVERGENCE');
  }
  const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE';
  const payload={schemaVersion:'3.9',status,beforeHash:sha256(before),afterHash:sha256(after),anchorsHash:sha256(JSON.stringify(anchors)),inventoryHash:sha256(JSON.stringify(inventory)),acceptanceHash:acceptance.reportHash,planHash:sha256(JSON.stringify(plan)),planDecisionsHash:sha256(JSON.stringify(planDecisions)),rulesHash:sha256(JSON.stringify(rules)),acceptanceIntegrity:acceptanceIntegrity.status,editorialReportHash:editorial.reportHash,claimAuditHash:claimAudit?.reportHash??null,argumentGraphAuditHash:graphAudit?.reportHash??null,claimAwareRewriteHash:rewriteAssurance?.reportHash??null,factCoverageHash:factCoverageAudit?.reportHash??null,granularFactCoverageHash:granularCoverageAudit?.reportHash??null,requireGranularCoverage,factEvidenceHash:factEvidenceAudit?.reportHash??null,requireFactEvidence,sourceConflictAuditHash:sourceConflictAudit?.reportHash??null,requireSourceConflicts,metricReconciliationAuditHash:metricReconciliationAudit?.reportHash??null,requireMetricReconciliation,reconciliationEvidenceAuditHash:reconciliationEvidenceAudit?.reportHash??null,requireReconciliationEvidence,skill,blockers,pending,limitations:['Acceptance report integrity is not independent proof of the report creator or its inputs','Literal skill checks do not prove semantic compliance','A passing gate never authorizes publication']};
  return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export function verifyFinalGate(inputs,report){
  const expected=evaluateFinalGate(inputs);
  if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Final gate report mismatch');
  return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};
}
