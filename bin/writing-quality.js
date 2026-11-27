#!/usr/bin/env node
import {executeIncrementalAudit,verifyIncrementalExecution} from '../src/craft-incremental-executor.js';
import {auditIncremental,verifyIncremental} from '../src/craft-incremental.js';
import {auditUnifiedRelease,verifyUnifiedRelease} from '../src/craft-unified-release.js';
import {auditUnifiedPipeline,verifyUnifiedPipeline} from '../src/craft-unified-pipeline.js';
import {prepareDependencyCoverage,auditDependencyCoverage,verifyDependencyCoverage} from '../src/craft-dependency-coverage.js';
import {auditSourceChangeImpact,verifySourceChangeImpact} from '../src/craft-source-change.js';
import {auditCraftSourceProvenance,verifyCraftSourceProvenance} from '../src/craft-source-provenance.js';
import {prepareEvidenceBound,auditEvidenceBound,verifyEvidenceBound} from '../src/craft-evidence-bound.js';
import {prepareCoherenceReview,auditCoherence,verifyCoherence} from '../src/craft-coherence.js';
import {auditStructureRegression,verifyStructureRegression} from '../src/craft-structure-regression.js';
import {evaluateFinalGateWithCraftImpact,verifyFinalGateWithCraftImpact} from '../src/craft-impact-release.js';
import {assessParagraphImpact,reviewParagraphImpact,verifyParagraphImpact,verifyParagraphImpactReview} from '../src/craft-revision-impact.js';
import {prepareParagraphExecution,executeParagraphExecution,verifyParagraphExecution} from '../src/craft-paragraph-execution.js';
import {prepareParagraphRevision,verifyParagraphPlan,auditParagraphRevision,verifyParagraphAudit} from '../src/craft-paragraph.js';
import {prepareCraftDraft,verifyCraftDraft,auditCraftRevision,verifyCraftRevision} from '../src/craft-drafting.js';
import {prepareCraftWorkflow,auditCraftWorkflow,verifyCraftWorkflow} from '../src/craft-workflow.js';
import {prepareCraftReview,auditCraftReview,verifyCraftReview} from '../src/craft-contract.js';
import {auditCounterarguments,verifyCounterarguments} from '../src/counterargument-review.js';
import {evaluateFinalGateWithCounterarguments,verifyFinalGateWithCounterarguments} from '../src/counterargument-release.js';
import {auditInferenceDependencies,verifyInferenceDependencies} from '../src/inference-dependency.js';
import {evaluateFinalGateWithDependencies,verifyFinalGateWithDependencies} from '../src/dependency-release.js';
import {auditInferenceReview,verifyInferenceReview} from '../src/inference-review.js';
import {evaluateFinalGateWithInference,verifyFinalGateWithInference} from '../src/inference-release.js';
import {auditClaimEvidenceReview,verifyClaimEvidenceReview} from '../src/claim-evidence-review.js';
import {auditEvidenceChainRelease,verifyEvidenceChainRelease,evaluateFinalGateWithEvidenceChain,verifyFinalGateWithEvidenceChain} from '../src/evidence-chain-release.js';
import {auditAcquisitionEvidenceChain,verifyAcquisitionEvidenceChain} from '../src/acquisition-evidence-chain.js';
import {acquireSource,verifyAcquiredSource} from '../src/source-acquisition.js';
import {auditSourceSnapshots,verifySourceSnapshots} from '../src/source-snapshot.js';
import {auditReconciliationEvidence,verifyReconciliationEvidence} from '../src/reconciliation-evidence.js';
import {auditMetricReconciliation,verifyMetricReconciliation} from '../src/metric-reconciliation.js'
import {auditSourceConflicts,verifySourceConflicts} from '../src/source-conflicts.js';
import {auditSourceGovernance,verifySourceGovernance} from '../src/source-governance.js';
import {auditFactEvidence,verifyFactEvidence} from '../src/fact-evidence.js';
import {auditGranularFactCoverage,verifyGranularFactCoverage,discoverFactCandidates} from '../src/fact-granular.js';
import {sha256} from '../src/core.js';
import {auditFactCoverage,verifyFactCoverage} from '../src/fact-coverage.js';
import {auditFinancialFacts,verifyFinancialFacts} from '../src/financial-facts.js';
import {prepareEditorialCorpus,adjudicateEditorialCorpus,verifyEditorialCorpus} from '../src/editorial-corpus.js';
import {evaluateRewriteRiskBenchmark,verifyRewriteRiskBenchmark} from '../src/rewrite-risk-benchmark.js';
import {auditRewriteRisks,verifyRewriteRisks} from '../src/rewrite-risk.js';
import {assureClaimAwareRewrite,verifyClaimAwareRewrite} from '../src/claim-aware-rewrite.js';
import {prepareAvoidAIRevision,verifyAvoidAIRevision,executeAvoidAIRevision,verifyAvoidAIExecution} from '../src/avoid-ai-revision.js';
import {inspectAvoidAITiers,verifyAvoidAITiers} from '../src/avoid-ai-tiers.js';
import {detectAvoidAI,verifyAvoidAI} from '../src/avoid-ai-writing.js';
import {prepareGraphExtraction,validateGraphProposal,approveGraphProposal} from '../src/graph-extraction.js';
import {auditArgumentGraph,verifyArgumentGraph} from '../src/argument-graph.js'
import {auditClaims,verifyClaimAudit} from '../src/claim-integrity.js';
import {traceRevision,verifyRevisionTrace} from '../src/revision-trace.js';
import {evaluateFinalGate,verifyFinalGate} from '../src/final-gate.js';
import {evaluateEditorialRelease,verifyEditorialRelease} from '../src/editorial-release.js';
import {auditEditorialSafety,verifyEditorialSafety} from '../src/editorial-safety.js';
import {inspectStyle,DEFAULT_STYLE_POLICY} from '../src/style-signals.js';
import {attributeRegressions} from '../src/regression-attribution.js';
import {acceptRevision,verifyRevisionAcceptance} from '../src/revision-acceptance.js';
import {prepareRevisionPlan,verifyRevisionPlan,executeRevisionPlan} from '../src/revision-plan.js';
import {runWritingWorkflow,verifyWritingWorkflow} from '../src/workflow.js';
import {auditAnchorCoverage,buildReleaseEvidence,verifyReleaseEvidence} from '../src/release-evidence.js';
import {evaluateRevisionGate} from '../src/release-gate.js';
import {prepareDriftTasks,evaluateDrift} from '../src/drift.js';
import {prepareRevisionAudit, reviewRevisionAudit} from '../src/revision.js';
import {resolveDisagreements, analyzePredictionErrors} from '../src/review-analysis.js';
import { prepareAnnotationCases, adjudicateAnnotations, joinPredictions } from '../src/annotation.js';
import { runLocalProvider } from '../src/local-provider.js';
import { prepareProviderRequest, verifyProviderResponse } from '../src/provider.js';
import { verifyBenchmarkProvenance } from '../src/provenance.js';
import { evaluateBenchmark, readBenchmarkJSONL } from '../src/benchmark.js';
import { prepareSemanticTasks, verifySemanticTasks, verifyProtectedPatches } from '../src/assurance.js';
import { prepareEvidenceReview, verifyEvidenceReview } from '../src/evidence.js';
import { extractRequirementCandidates } from '../src/extraction.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { analyze, validateRules, fuse, loadJSON, saveJSON, proposePatch, applyPatch } from '../src/core.js';
import { loadSkillContract, fuseContracts } from '../src/contracts.js';
import { applyBatch } from '../src/patches.js';
import { verifyContract, compileReviewedCandidates } from '../src/verification.js';
const [command, ...args] = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const positional = args.filter((x, i) => !x.startsWith('--') && !args[i - 1]?.startsWith('--'));
const fail = (message, code = 2) => { console.error(`Error: ${message}`); process.exit(code); };
async function main() {
  if(command==='craft' && ['incremental-execute','incremental-execute-verify'].includes(positional[0])){
    if(!flag('file')||!flag('manifest')||!flag('secret-file'))fail('Expected --file, --manifest and --secret-file');
    const text=await readFile(flag('file'),'utf8'),manifest=await loadJSON(flag('manifest'));
    const before=flag('before')?await readFile(flag('before'),'utf8'):null;
    const previous=flag('previous')?await loadJSON(flag('previous')):null;
    const secret=(await readFile(flag('secret-file'),'utf8')).trim();
    const inputs={text,before,profile:manifest.profile??'analytical-nonfiction',required:manifest.required,stages:manifest.stages};
    const options={secret,previous,compareFull:flag('compare-full')==='true'};
    const verify=positional[0]==='incremental-execute-verify';
    if(verify&&!flag('report'))fail('Expected --report');
    const result=verify?await verifyIncrementalExecution(inputs,options,await loadJSON(flag('report'))):await executeIncrementalAudit(inputs,options);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    if(flag('cache-output')&&!verify){await mkdir(dirname(resolve(flag('cache-output'))),{recursive:true});await saveJSON(flag('cache-output'),result.cache);}
    console.log(JSON.stringify(result,null,2));
    if(!verify&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }

  if(command==='craft' && ['incremental-audit','incremental-verify'].includes(positional[0])){
    if(!flag('file')||!flag('manifest'))fail('Expected --file and --manifest');
    const text=await readFile(flag('file'),'utf8'),manifest=await loadJSON(flag('manifest'));
    const before=flag('before')?await readFile(flag('before'),'utf8'):null;
    const previous=flag('previous')?await loadJSON(flag('previous')):null;
    const inputs={text,before,profile:manifest.profile??'analytical-nonfiction',required:manifest.required,stages:manifest.stages,previous};
    const verify=positional[0]==='incremental-verify';
    if(verify&&!flag('report'))fail('Expected --report');
    const result=verify?await verifyIncremental(inputs,await loadJSON(flag('report'))):await auditIncremental(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    if(flag('cache-output')&&!verify){await mkdir(dirname(resolve(flag('cache-output'))),{recursive:true});await saveJSON(flag('cache-output'),result.cacheRecord);}
    console.log(JSON.stringify(result,null,2));
    if(!verify&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }

  if(command==='craft' && ['release-audit','release-verify'].includes(positional[0])){
    if(!flag('file')||!flag('manifest'))fail('Expected --file and --manifest');
    const text=await readFile(flag('file'),'utf8'),manifest=await loadJSON(flag('manifest'));
    const before=flag('before')?await readFile(flag('before'),'utf8'):null;
    const inputs={text,before,profile:manifest.profile??'analytical-nonfiction',required:manifest.required,stages:manifest.stages,legacy:manifest.legacy??null,requireLegacy:manifest.requireLegacy??false};
    const verify=positional[0]==='release-verify';
    if(verify&&!flag('report'))fail('Expected --report');
    const result=verify?await verifyUnifiedRelease(inputs,await loadJSON(flag('report'))):await auditUnifiedRelease(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(!verify&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }

  if(command==='craft' && ['pipeline-audit','pipeline-verify'].includes(positional[0])){
    if(!flag('file')||!flag('manifest'))fail('Expected --file and --manifest');
    const text=await readFile(flag('file'),'utf8');
    const manifest=await loadJSON(flag('manifest'));
    const before=flag('before')?await readFile(flag('before'),'utf8'):null;
    const inputs={text,before,profile:manifest.profile??'analytical-nonfiction',required:manifest.required,stages:manifest.stages};
    const verify=positional[0]==='pipeline-verify';
    if(verify&&!flag('report'))fail('Expected --report');
    const result=verify?await verifyUnifiedPipeline(inputs,await loadJSON(flag('report'))):await auditUnifiedPipeline(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(!verify&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }

  if(command==='craft' && ['coverage-prepare','coverage-audit','coverage-verify'].includes(positional[0])){
    const sub=positional[0];if(!flag('file'))fail('Expected --file');
    const text=await readFile(flag('file'),'utf8');
    if(sub!=='coverage-prepare'&&(!flag('plan')||!flag('records')))fail('Expected --plan and --records');
    const plan=sub==='coverage-prepare'?null:await loadJSON(flag('plan'));
    const records=sub==='coverage-prepare'?null:await loadJSON(flag('records'));
    const decisions=flag('decisions')?await loadJSON(flag('decisions')):[];
    if(sub==='coverage-verify'&&!flag('report'))fail('Expected --report');
    const result=sub==='coverage-prepare'?prepareDependencyCoverage(text,{profile:flag('profile','analytical-nonfiction')}):sub==='coverage-audit'?auditDependencyCoverage(text,plan,records,decisions):verifyDependencyCoverage(text,plan,records,decisions,await loadJSON(flag('report')));
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(sub==='coverage-audit'&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }
  if(command==='craft' && ['source-change-audit','source-change-verify'].includes(positional[0])){
    for(const key of ['file','plan','records','root','baseline','current'])if(!flag(key))fail(`Expected --${key}`);
    const inputs={text:await readFile(flag('file'),'utf8'),plan:await loadJSON(flag('plan')),records:await loadJSON(flag('records')),root:flag('root'),baseline:await loadJSON(flag('baseline')),current:await loadJSON(flag('current')),reviews:flag('reviews')?await loadJSON(flag('reviews')):[],acquisitions:flag('acquisitions')?await loadJSON(flag('acquisitions')):[],allowedHosts:flag('allowed-hosts')?flag('allowed-hosts').split(','):[]};
    const verify=positional[0]==='source-change-verify';if(verify&&!flag('report'))fail('Expected --report');
    const result=verify?await verifySourceChangeImpact(inputs,await loadJSON(flag('report'))):await auditSourceChangeImpact(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(!verify&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }
  if(command==='craft' && ['source-provenance-audit','source-provenance-verify'].includes(positional[0])){
    for(const key of ['file','plan','records','root','manifest'])if(!flag(key))fail(`Expected --${key}`);
    const inputs={text:await readFile(flag('file'),'utf8'),plan:await loadJSON(flag('plan')),records:await loadJSON(flag('records')),root:flag('root'),manifest:await loadJSON(flag('manifest')),acquisitions:flag('acquisitions')?await loadJSON(flag('acquisitions')):[],allowedHosts:flag('allowed-hosts')?flag('allowed-hosts').split(','):[]};
    const sub=positional[0];if(sub==='source-provenance-verify'&&!flag('report'))fail('Expected --report');
    const result=sub==='source-provenance-audit'?await auditCraftSourceProvenance(inputs):await verifyCraftSourceProvenance(inputs,await loadJSON(flag('report')));
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(sub==='source-provenance-audit'&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }
  if(command==='craft' && ['evidence-prepare','evidence-audit','evidence-verify'].includes(positional[0])){
    if(!flag('file'))fail('Expected --file');
    const text=await readFile(flag('file'),'utf8'),sub=positional[0];let result;
    if(sub==='evidence-prepare')result=prepareEvidenceBound(text,{profile:flag('profile','analytical-nonfiction')});
    else{
      if(!flag('plan')||!flag('records'))fail('Expected --plan and --records');
      const plan=await loadJSON(flag('plan')),records=await loadJSON(flag('records'));
      result=sub==='evidence-audit'?auditEvidenceBound(text,plan,records):verifyEvidenceBound(text,plan,records,await loadJSON(flag('report')));
    }
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(sub==='evidence-audit'&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }
  if(command==='craft' && ['coherence-prepare','coherence-audit','coherence-verify'].includes(positional[0])){
    if(!flag('file'))fail('Expected --file');
    const text=await readFile(flag('file'),'utf8');
    const sub=positional[0];let result;
    if(sub==='coherence-prepare')result=prepareCoherenceReview(text,{profile:flag('profile','analytical-nonfiction')});
    else{
      if(!flag('plan')||!flag('entries'))fail('Expected --plan and --entries');
      const plan=await loadJSON(flag('plan')),entries=await loadJSON(flag('entries'));
      if(sub==='coherence-audit')result=auditCoherence(text,plan,entries);
      else{if(!flag('report'))fail('Expected --report');result=verifyCoherence(text,plan,entries,await loadJSON(flag('report')));}
    }
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(sub==='coherence-audit'&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }
  if(command==='craft' && ['structure-audit','structure-verify'].includes(positional[0])){
    if(!flag('before')||!flag('after'))fail('Expected --before and --after');
    const before=await readFile(flag('before'),'utf8'),after=await readFile(flag('after'),'utf8');
    const options={profile:flag('profile','analytical-nonfiction'),links:flag('links')?await loadJSON(flag('links')):[],checks:flag('checks')?await loadJSON(flag('checks')):[]};
    const result=positional[0]==='structure-audit'?auditStructureRegression(before,after,options):verifyStructureRegression(before,after,options,await loadJSON(flag('report')));
    if(flag('output'))await saveJSON(flag('output'),result);
    console.log(JSON.stringify(result,null,2));
    if(positional[0]==='structure-audit'&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
    return;
  }
  if(command==='craft' && ['impact-audit','impact-verify','impact-review','impact-review-verify'].includes(positional[0])){
    for(const key of ['file','plan','reviews','proposal','decisions','links'])if(!flag(key))fail(`Expected --${key}`);
    const text=await readFile(flag('file'),'utf8');
    const [plan,reviews,proposal,decisions,links]=await Promise.all(['plan','reviews','proposal','decisions','links'].map(k=>loadJSON(flag(k))));
    const sub=positional[0];let result;
    if(sub==='impact-audit')result=assessParagraphImpact(text,plan,reviews,proposal,decisions,links);
    else{
      if(!flag('impact'))fail('Expected --impact');
      const impact=await loadJSON(flag('impact'));
      if(sub==='impact-verify')result=verifyParagraphImpact(text,plan,reviews,proposal,decisions,links,impact);
      else{
        if(!flag('checks'))fail('Expected --checks');
        const checks=await loadJSON(flag('checks'));
        if(sub==='impact-review')result=reviewParagraphImpact(text,plan,reviews,proposal,decisions,links,impact,checks);
        else{if(!flag('report'))fail('Expected --report');result=verifyParagraphImpactReview(text,plan,reviews,proposal,decisions,links,impact,checks,await loadJSON(flag('report')));}
      }
    }
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(['impact-audit','impact-review'].includes(sub)&&['INCOMPLETE','BLOCKED','RECHECK_REQUIRED'].includes(result.status))process.exitCode=4;
    return;
  }
  if(command==='craft' && ['paragraph-propose','paragraph-apply','paragraph-apply-verify'].includes(positional[0])){
    if(!flag('file')||!flag('plan')||!flag('reviews'))fail('Expected --file, --plan and --reviews');
    const text=await readFile(flag('file'),'utf8'),plan=await loadJSON(flag('plan')),reviews=await loadJSON(flag('reviews'));
    const sub=positional[0];let result;
    if(sub==='paragraph-propose')result=prepareParagraphExecution(text,plan,reviews);
    else{
      if(!flag('proposal')||!flag('decisions'))fail('Expected --proposal and --decisions');
      const proposal=await loadJSON(flag('proposal')),decisions=await loadJSON(flag('decisions'));
      if(sub==='paragraph-apply-verify'){
        if(!flag('report'))fail('Expected --report');
        result=verifyParagraphExecution(text,plan,reviews,proposal,decisions,await loadJSON(flag('report')));
      }else{
        result=executeParagraphExecution(text,plan,reviews,proposal,decisions);
        if(flag('after')){await mkdir(dirname(resolve(flag('after'))),{recursive:true});await writeFile(flag('after'),result.revisedText);}
      }
    }
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(sub==='paragraph-apply'&&result.status==='INCOMPLETE')process.exitCode=4;
    return;
  }
  if(command==='craft' && ['paragraph-prepare','paragraph-verify','paragraph-audit','paragraph-audit-verify'].includes(positional[0])){
    if(!flag('file'))fail('Expected --file');
    const text=await readFile(flag('file'),'utf8'),sub=positional[0];
    let result;
    if(sub==='paragraph-prepare')result=prepareParagraphRevision(text,{profile:flag('profile','analytical-nonfiction')});
    else{
      if(!flag('plan'))fail('Expected --plan');
      const plan=await loadJSON(flag('plan'));
      if(sub==='paragraph-verify')result=verifyParagraphPlan(text,plan);
      else{
        if(!flag('reviews'))fail('Expected --reviews');
        const reviews=await loadJSON(flag('reviews'));
        if(sub==='paragraph-audit-verify'){
          if(!flag('report'))fail('Expected --report');
          result=verifyParagraphAudit(text,plan,reviews,await loadJSON(flag('report')));
        }else result=auditParagraphRevision(text,plan,reviews);
      }
    }
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(sub==='paragraph-audit'&&result.status==='INCOMPLETE')process.exitCode=4;
    return;
  }
  if(command==='craft' && ['draft-prepare','draft-verify','revision-audit','revision-verify'].includes(positional[0])){
    if(!flag('file'))fail('Expected --file');
    const before=await readFile(flag('file'),'utf8');
    let result;
    if(positional[0]==='draft-prepare'){
      const brief=flag('brief')?await loadJSON(flag('brief')):{};
      result=await prepareCraftDraft(before,{profile:flag('profile','analytical-nonfiction'),brief});
    }else{
      if(!flag('plan'))fail('Expected --plan');
      const plan=await loadJSON(flag('plan'));
      if(positional[0]==='draft-verify')result=await verifyCraftDraft(before,plan);
      else{
        if(!flag('after')||!flag('reviews'))fail('Expected --after and --reviews');
        const after=await readFile(flag('after'),'utf8'),reviews=await loadJSON(flag('reviews'));
        if(positional[0]==='revision-verify'){
          if(!flag('report'))fail('Expected --report');
          result=await verifyCraftRevision(before,after,plan,reviews,await loadJSON(flag('report')));
        }else result=await auditCraftRevision(before,after,plan,reviews);
      }
    }
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;
    else if(result.status==='INCOMPLETE'&&positional[0]==='revision-audit')process.exitCode=4;
    return;
  }
  if(command==='craft' && ['workflow-prepare','workflow-audit','workflow-verify'].includes(positional[0])){
    if(!flag('file'))fail('Expected --file');
    const content=await readFile(flag('file'),'utf8');
    if(positional[0]==='workflow-prepare'){
      const brief=flag('brief')?await loadJSON(flag('brief')):{};
      const result=await prepareCraftWorkflow(content,{profile:flag('profile','analytical-nonfiction'),brief});
      if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
      console.log(JSON.stringify(result,null,2));return;
    }
    if(!flag('plan')||!flag('reviews'))fail('Expected --plan and --reviews');
    const plan=await loadJSON(flag('plan')),reviews=await loadJSON(flag('reviews'));
    if(positional[0]==='workflow-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(await verifyCraftWorkflow(content,plan,reviews,await loadJSON(flag('report'))),null,2));return;
    }
    const result=await auditCraftWorkflow(content,plan,reviews);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='NEEDS_REVISION')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='craft' && ['prepare','audit','verify'].includes(positional[0])){
    if(!flag('file'))fail('Expected --file');
    const content=await readFile(flag('file'),'utf8');
    if(positional[0]==='prepare'){
      const result=await prepareCraftReview(content,{profile:flag('profile','analytical-nonfiction')});
      if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
      console.log(JSON.stringify(result,null,2));return;
    }
    if(!flag('plan')||!flag('reviews'))fail('Expected --plan and --reviews');
    const plan=await loadJSON(flag('plan')),reviews=await loadJSON(flag('reviews'));
    if(positional[0]==='verify'){
      if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(await verifyCraftReview(content,plan,reviews,await loadJSON(flag('report'))),null,2));return;
    }
    const result=await auditCraftReview(content,plan,reviews);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='NEEDS_REVISION')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['counterarguments-audit','counterarguments-verify'].includes(positional[0])){
    for(const f of ['root','records','links','allow-hosts','claims','inferences','dependencies','counterarguments','counterargument-reviews'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={root:flag('root'),records:await loadJSON(flag('records')),links:await loadJSON(flag('links')),allowedHosts:flag('allow-hosts').split(',').map(x=>x.trim()),claims:await loadJSON(flag('claims')),reviews:flag('reviews')?await loadJSON(flag('reviews')):[],inferences:await loadJSON(flag('inferences')),inferenceReviews:flag('inference-reviews')?await loadJSON(flag('inference-reviews')):[],dependencies:await loadJSON(flag('dependencies')),counterarguments:await loadJSON(flag('counterarguments')),counterargumentReviews:await loadJSON(flag('counterargument-reviews'))};
    if(positional[0]==='counterarguments-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(await verifyCounterarguments(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=await auditCounterarguments(inputs);if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['dependencies-audit','dependencies-verify'].includes(positional[0])){
    for(const f of ['root','records','links','allow-hosts','claims','inferences','dependencies'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={root:flag('root'),records:await loadJSON(flag('records')),links:await loadJSON(flag('links')),allowedHosts:flag('allow-hosts').split(',').map(x=>x.trim()),claims:await loadJSON(flag('claims')),reviews:flag('reviews')?await loadJSON(flag('reviews')):[],inferences:await loadJSON(flag('inferences')),inferenceReviews:flag('inference-reviews')?await loadJSON(flag('inference-reviews')):[],dependencies:await loadJSON(flag('dependencies'))};
    if(positional[0]==='dependencies-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(await verifyInferenceDependencies(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=await auditInferenceDependencies(inputs);if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['inference-audit','inference-verify'].includes(positional[0])){
    for(const f of ['root','records','links','allow-hosts','claims','inferences'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={root:flag('root'),records:await loadJSON(flag('records')),links:await loadJSON(flag('links')),allowedHosts:flag('allow-hosts').split(',').map(x=>x.trim()),claims:await loadJSON(flag('claims')),reviews:flag('reviews')?await loadJSON(flag('reviews')):[],inferences:await loadJSON(flag('inferences')),inferenceReviews:flag('inference-reviews')?await loadJSON(flag('inference-reviews')):[]};
    if(positional[0]==='inference-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(await verifyInferenceReview(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=await auditInferenceReview(inputs);if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['claim-evidence-audit','claim-evidence-verify'].includes(positional[0])){
    for(const f of ['root','records','links','allow-hosts','claims'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={root:flag('root'),records:await loadJSON(flag('records')),links:await loadJSON(flag('links')),allowedHosts:flag('allow-hosts').split(',').map(s=>s.trim()),claims:await loadJSON(flag('claims')),reviews:flag('reviews')?await loadJSON(flag('reviews')):[]};
    if(positional[0]==='claim-evidence-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(await verifyClaimEvidenceReview(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=await auditClaimEvidenceReview(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['chain-release','chain-release-verify'].includes(positional[0])){
    for(const f of ['root','records','links','allow-hosts','required-facts'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={root:flag('root'),records:await loadJSON(flag('records')),links:await loadJSON(flag('links')),allowedHosts:flag('allow-hosts').split(',').map(s=>s.trim()),requiredFacts:await loadJSON(flag('required-facts'))};
    if(positional[0]==='chain-release-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(await verifyEvidenceChainRelease(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=await auditEvidenceChainRelease(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['chain-audit','chain-verify'].includes(positional[0])){
    for(const f of ['root','records','links','allow-hosts'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={root:flag('root'),records:await loadJSON(flag('records')),links:await loadJSON(flag('links')),allowedHosts:flag('allow-hosts').split(',').map(s=>s.trim())};
    if(positional[0]==='chain-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(await verifyAcquisitionEvidenceChain(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=await auditAcquisitionEvidenceChain(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;return;
  }
  if(command==='avoid-ai' && ['source-fetch','source-fetch-verify'].includes(positional[0])){
    if(!flag('root')||!flag('allow-hosts'))fail('Expected --root and --allow-hosts');
    const allowedHosts=flag('allow-hosts').split(',').map(s=>s.trim());
    if(positional[0]==='source-fetch-verify'){
      if(!flag('record'))fail('Expected --record');
      console.log(JSON.stringify(await verifyAcquiredSource({root:flag('root'),record:await loadJSON(flag('record')),allowedHosts}),null,2));return;
    }
    if(!flag('entry')||!flag('output'))fail('Expected --entry and --output');
    const record=await acquireSource({root:flag('root'),entry:await loadJSON(flag('entry')),allowedHosts,maxBytes:Number(flag('max-bytes','10000000')),timeoutMs:Number(flag('timeout-ms','15000'))});
    await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),record);
    console.log(JSON.stringify(record,null,2));return;
  }

  if(command==='avoid-ai' && ['snapshot-audit','snapshot-verify'].includes(positional[0])){
    if(!flag('root')||!flag('manifest'))fail('Expected --root and --manifest');
    const inputs={root:flag('root'),entries:await loadJSON(flag('manifest'))};
    if(positional[0]==='snapshot-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(await verifySourceSnapshots(inputs,await loadJSON(flag('report'))),null,2));return;
    }
    const result=await auditSourceSnapshots(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;return;
  }

  if(command==='avoid-ai' && ['reconcile-evidence-audit','reconcile-evidence-verify'].includes(positional[0])){
    for(const f of ['observations','bridges','sources','evidence'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={observations:await loadJSON(flag('observations')),bridges:await loadJSON(flag('bridges')),sources:await loadJSON(flag('sources')),evidence:await loadJSON(flag('evidence'))};
    if(positional[0]==='reconcile-evidence-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(verifyReconciliationEvidence(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=auditReconciliationEvidence(inputs);if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['reconcile-audit','reconcile-verify'].includes(positional[0])){
    for(const f of ['observations','bridges'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={observations:await loadJSON(flag('observations')),bridges:await loadJSON(flag('bridges'))};
    if(positional[0]==='reconcile-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(verifyMetricReconciliation(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=auditMetricReconciliation(inputs);if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['conflicts-audit','conflicts-verify'].includes(positional[0])){
    for(const f of ['sources','observations'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={sources:await loadJSON(flag('sources')),observations:await loadJSON(flag('observations')),resolutions:flag('resolutions')?await loadJSON(flag('resolutions')):[]};
    if(positional[0]==='conflicts-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(verifySourceConflicts(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=auditSourceConflicts(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['source-audit','source-verify'].includes(positional[0])){
    for(const f of ['before-facts','after-facts','sources','before-links','after-links'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={beforeInventory:await loadJSON(flag('before-facts')),afterInventory:await loadJSON(flag('after-facts')),sources:await loadJSON(flag('sources')),beforeLinks:await loadJSON(flag('before-links')),afterLinks:await loadJSON(flag('after-links')),policy:{requirePrimary:flag('require-primary')==='true'}};
    if(positional[0]==='source-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(verifySourceGovernance(inputs,await loadJSON(flag('report'))),null,2));return;}
    const result=auditSourceGovernance(inputs);if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['evidence-audit','evidence-verify'].includes(positional[0])){
    for(const f of ['before','after','before-facts','after-facts','sources','before-links','after-links'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={before:await readFile(flag('before'),'utf8'),after:await readFile(flag('after'),'utf8'),beforeInventory:await loadJSON(flag('before-facts')),afterInventory:await loadJSON(flag('after-facts')),sources:await loadJSON(flag('sources')),beforeLinks:await loadJSON(flag('before-links')),afterLinks:await loadJSON(flag('after-links')),review:flag('review')?await loadJSON(flag('review')):[],sourceGovernancePolicy:flag('require-source-governance')==='true'?{requirePrimary:flag('require-primary')==='true'}:null};
    if(positional[0]==='evidence-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyFactEvidence(inputs,await loadJSON(flag('report'))),null,2));return;
    }
    const result=auditFactEvidence(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && positional[0]==='candidates'){
    if(!flag('file'))fail('Expected --file');
    const content=await readFile(flag('file'),'utf8');
    const result={schemaVersion:'5.3',documentHash:sha256(content),candidates:discoverFactCandidates(content)};
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));return;
  }
  if(command==='avoid-ai' && ['granular-audit','granular-verify'].includes(positional[0])){
    for(const f of ['before','after','before-facts','after-facts','before-candidate-attestations','after-candidate-attestations'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={before:await readFile(flag('before'),'utf8'),after:await readFile(flag('after'),'utf8'),beforeInventory:await loadJSON(flag('before-facts')),afterInventory:await loadJSON(flag('after-facts')),review:flag('review')?await loadJSON(flag('review')):[],beforeCandidateAttestations:await loadJSON(flag('before-candidate-attestations')),afterCandidateAttestations:await loadJSON(flag('after-candidate-attestations'))};
    if(positional[0]==='granular-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyGranularFactCoverage(inputs,await loadJSON(flag('report'))),null,2));return;
    }
    const result=auditGranularFactCoverage(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['coverage-audit','coverage-verify'].includes(positional[0])){
    for(const f of ['before','after','before-facts','after-facts','before-attestations','after-attestations'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={before:await readFile(flag('before'),'utf8'),after:await readFile(flag('after'),'utf8'),beforeInventory:await loadJSON(flag('before-facts')),afterInventory:await loadJSON(flag('after-facts')),review:flag('review')?await loadJSON(flag('review')):[],beforeAttestations:await loadJSON(flag('before-attestations')),afterAttestations:await loadJSON(flag('after-attestations'))};
    if(positional[0]==='coverage-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyFactCoverage(inputs,await loadJSON(flag('report'))),null,2));return;
    }
    const result=auditFactCoverage(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['facts-audit','facts-verify'].includes(positional[0])){
    for(const f of ['before','after','before-facts','after-facts'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={before:await readFile(flag('before'),'utf8'),after:await readFile(flag('after'),'utf8'),beforeInventory:await loadJSON(flag('before-facts')),afterInventory:await loadJSON(flag('after-facts')),review:flag('review')?await loadJSON(flag('review')):[]};
    if(positional[0]==='facts-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyFinancialFacts(inputs,await loadJSON(flag('report'))),null,2));return;
    }
    const result=auditFinancialFacts(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='avoid-ai' && ['corpus-prepare','corpus-adjudicate','corpus-verify'].includes(positional[0])){
    const op=positional[0];let result;
    if(op==='corpus-prepare'){
      if(!flag('cases'))fail('Expected --cases');
      result=prepareEditorialCorpus(await loadJSON(flag('cases')));
    }else{
      for(const f of ['corpus','reviews','decisions'])if(!flag(f))fail(`Expected --${f}`);
      const inputs=[await loadJSON(flag('corpus')),await loadJSON(flag('reviews')),await loadJSON(flag('decisions'))];
      if(op==='corpus-verify'){
        if(!flag('report'))fail('Expected --report');
        result=verifyEditorialCorpus(...inputs,await loadJSON(flag('report')));
      }else result=adjudicateEditorialCorpus(...inputs);
    }
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));return;
  }
  if(command==='avoid-ai' && ['benchmark','benchmark-verify'].includes(positional[0])){
    if(!flag('dataset'))fail('Expected --dataset');
    const dataset=await loadJSON(flag('dataset'));
    const options={context:flag('context','cn-explanatory'),voice:flag('voice','chinese-explanatory')};
    if(positional[0]==='benchmark-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyRewriteRiskBenchmark(dataset,options,await loadJSON(flag('report'))),null,2));return;
    }
    const report=evaluateRewriteRiskBenchmark(dataset,options);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),report);}
    console.log(JSON.stringify(report,null,2));
    if(flag('min-recall')){
      const min=Number(flag('min-recall'));
      if(!Number.isFinite(min)||min<0||min>1)fail('Invalid --min-recall');
      if(report.metrics.recall===null||report.metrics.recall<min)process.exitCode=4;
    }
    return;
  }
  if(command==='avoid-ai' && ['risk-audit','risk-verify'].includes(positional[0])){
    for(const f of ['before','after','plan','decisions'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={before:await readFile(flag('before'),'utf8'),after:await readFile(flag('after'),'utf8'),plan:await loadJSON(flag('plan')),decisions:await loadJSON(flag('decisions')),protectedQuotes:flag('protected')?await loadJSON(flag('protected')):[]};
    if(positional[0]==='risk-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyRewriteRisks(inputs,await loadJSON(flag('report'))),null,2));return;
    }
    const report=auditRewriteRisks(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),report);}
    console.log(JSON.stringify(report,null,2));
    if(report.status==='REVIEW_REQUIRED')process.exitCode=4;return;
  }

  if(command==='avoid-ai' && ['assure','assure-verify'].includes(positional[0])){
    for(const f of ['before','after','plan','decisions','claims','argument-graph'])if(!flag(f))fail(`Expected --${f}`);
    const inputs={before:await readFile(flag('before'),'utf8'),after:await readFile(flag('after'),'utf8'),plan:await loadJSON(flag('plan')),decisions:await loadJSON(flag('decisions')),protectedQuotes:flag('protected')?await loadJSON(flag('protected')):[],claims:await loadJSON(flag('claims')),claimReview:flag('claim-review')?await loadJSON(flag('claim-review')):null,argumentGraph:await loadJSON(flag('argument-graph')),argumentReview:flag('argument-review')?await loadJSON(flag('argument-review')):null,claimAwareRewrite:flag('rewrite-assurance-input')?await loadJSON(flag('rewrite-assurance-input')):null,factCoverage:flag('fact-coverage-input')?await loadJSON(flag('fact-coverage-input')):null,granularFactCoverage:flag('granular-fact-coverage-input')?await loadJSON(flag('granular-fact-coverage-input')):null,requireGranularCoverage:flag('require-granular-coverage')==='true',factEvidence:flag('fact-evidence-input')?await loadJSON(flag('fact-evidence-input')):null,requireFactEvidence:flag('require-fact-evidence')==='true',sourceConflicts:flag('source-conflicts-input')?await loadJSON(flag('source-conflicts-input')):null,requireSourceConflicts:flag('require-source-conflicts')==='true',metricReconciliation:flag('metric-reconciliation-input')?await loadJSON(flag('metric-reconciliation-input')):null,requireMetricReconciliation:flag('require-metric-reconciliation')==='true',reconciliationEvidence:flag('reconciliation-evidence-input')?await loadJSON(flag('reconciliation-evidence-input')):null,requireReconciliationEvidence:flag('require-reconciliation-evidence')==='true'};
    if(positional[0]==='assure-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyClaimAwareRewrite(inputs,await loadJSON(flag('report'))),null,2));return;
    }
    const report=assureClaimAwareRewrite(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),report);}
    console.log(JSON.stringify(report,null,2));
    if(report.status==='BLOCKED')process.exitCode=1;else if(report.status==='INCOMPLETE')process.exitCode=4;return;
  }

  if(command==='avoid-ai' && ['plan','plan-verify','apply','apply-verify'].includes(positional[0])){
    const mode=positional[0],file=flag('file');if(!file)fail('Expected --file');
    const before=await readFile(file,'utf8');
    if(mode==='plan'){
      const options={context:flag('context','blog'),voice:flag('voice','professional')};
      const result=prepareAvoidAIRevision(before,options);
      if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
      console.log(JSON.stringify(result,null,2));return;
    }
    if(!flag('plan'))fail('Expected --plan');
    const plan=await loadJSON(flag('plan'));
    if(mode==='plan-verify'){console.log(JSON.stringify(verifyAvoidAIRevision(before,plan),null,2));return;}
    if(!flag('decisions'))fail('Expected --decisions');
    const decisions=await loadJSON(flag('decisions'));
    const protectedQuotes=flag('protected')?await loadJSON(flag('protected')):[];
    if(mode==='apply-verify'){
      if(!flag('after')||!flag('report'))fail('Expected --after and --report');
      console.log(JSON.stringify(verifyAvoidAIExecution(before,await readFile(flag('after'),'utf8'),plan,decisions,protectedQuotes,await loadJSON(flag('report'))),null,2));return;
    }
    if(!flag('output')||!flag('report'))fail('Expected --output and --report');
    if(new Set([file,flag('output'),flag('report')].map(x=>resolve(x))).size!==3)fail('Output paths must be distinct');
    const {revisedText,...report}=executeAvoidAIRevision(before,plan,decisions,{protectedQuotes});
    await mkdir(dirname(resolve(flag('report'))),{recursive:true});await saveJSON(flag('report'),report);
    await mkdir(dirname(resolve(flag('output'))),{recursive:true});await writeFile(flag('output'),revisedText,{flag:'wx'});
    console.log(JSON.stringify({status:report.status,report:flag('report'),output:flag('output'),remaining:report.remaining.length},null,2));
    if(report.status==='INCOMPLETE')process.exitCode=4;return;
  }

  if(command==='graph' && ['prepare','validate','approve'].includes(positional[0])){
    const source=flag('before'),out=flag('output');if(!source)fail('Expected --before');
    const before=await readFile(source,'utf8');let result;
    if(positional[0]==='prepare')result=prepareGraphExtraction(before);
    if(positional[0]==='validate'){
      if(!flag('request')||!flag('proposal'))fail('Expected --request and --proposal');
      result=validateGraphProposal(before,await loadJSON(flag('request')),await loadJSON(flag('proposal')));
    }
    if(positional[0]==='approve'){
      if(!flag('validation')||!flag('decisions'))fail('Expected --validation and --decisions');
      result=approveGraphProposal(before,await loadJSON(flag('validation')),await loadJSON(flag('decisions')));
    }
    if(out){await mkdir(dirname(resolve(out)),{recursive:true});await saveJSON(out,result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='INCOMPLETE'||result.status==='REVIEW_REQUIRED')process.exitCode=4;
    if(result.status==='BLOCKED')process.exitCode=1;return;
  }

  if(command==='revision' && ['graph-audit','graph-verify'].includes(positional[0])){
    const b=flag('before'),a=flag('after'),g=flag('graph');if(!b||!a||!g)fail('Expected --before, --after and --graph');
    const before=await readFile(b,'utf8'),after=await readFile(a,'utf8'),graph=await loadJSON(g),review=flag('review')?await loadJSON(flag('review')):null;
    if(positional[0]==='graph-verify'){if(!flag('report'))fail('Expected --report');console.log(JSON.stringify(verifyArgumentGraph(before,after,graph,review,await loadJSON(flag('report'))),null,2));return;}
    const result=auditArgumentGraph(before,after,graph,review);if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }

  if(command==='revision' && ['claims-audit','claims-verify'].includes(positional[0])){
    const b=flag('before'),a=flag('after'),inventory=flag('claims');
    if(!b||!a||!inventory)fail('Expected --before, --after and --claims');
    const before=await readFile(b,'utf8'),after=await readFile(a,'utf8'),claims=await loadJSON(inventory),review=flag('review')?await loadJSON(flag('review')):null;
    if(positional[0]==='claims-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyClaimAudit(before,after,claims,review,await loadJSON(flag('report'))),null,2));return;
    }
    const result=auditClaims(before,after,claims,review);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }

  if(command==='revision' && ['trace','trace-verify'].includes(positional[0])){
    const file=flag('before'),planFile=flag('plan'),decisionsFile=flag('decisions'),rulesFile=flag('rules','rules/anti-slop.json');
    if(!file||!planFile||!decisionsFile)fail('Expected --before, --plan and --decisions');
    const before=await readFile(file,'utf8'),plan=await loadJSON(planFile),decisions=await loadJSON(decisionsFile),rules=await loadJSON(rulesFile);
    if(positional[0]==='trace-verify'){
      if(!flag('after')||!flag('report'))fail('Expected --after and --report');
      console.log(JSON.stringify(verifyRevisionTrace(before,await readFile(flag('after'),'utf8'),plan,decisions,rules,await loadJSON(flag('report'))),null,2));return;
    }
    const result=traceRevision(before,plan,decisions,rules);
    const {revisedText,...report}=result;
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),report);}
    console.log(JSON.stringify(report,null,2));
    if(report.status==='BLOCKED')process.exitCode=1;else if(report.status==='INCOMPLETE')process.exitCode=4;return;
  }

  if(command==='revision' && ['final-gate','final-gate-verify'].includes(positional[0])){
    const b=flag('before'),a=flag('after'),anchors=flag('anchors'),inventory=flag('inventory'),acceptance=flag('acceptance-report'),plan=flag('plan'),planDecisions=flag('plan-decisions');
    if(!b||!a||!anchors||!inventory||!acceptance||!plan||!planDecisions)fail('Expected --before, --after, --anchors, --inventory, --acceptance-report, --plan and --plan-decisions');
    const inputs={before:await readFile(b,'utf8'),after:await readFile(a,'utf8'),anchors:await loadJSON(anchors),inventory:await loadJSON(inventory),acceptance:await loadJSON(acceptance),plan:await loadJSON(plan),planDecisions:await loadJSON(planDecisions),rules:await loadJSON(flag('rules','rules/anti-slop.json')),editorialDecisions:flag('editorial-decisions')?await loadJSON(flag('editorial-decisions')):null,anchorDecisions:flag('decisions')?await loadJSON(flag('decisions')):null,contractReport:flag('contract-report')?await loadJSON(flag('contract-report')):null,primary:flag('primary')?await loadSkillContract(flag('primary')):null,constraint:flag('constraint')?await loadSkillContract(flag('constraint')):null,claims:flag('claims')?await loadJSON(flag('claims')):null,claimReview:flag('claim-review')?await loadJSON(flag('claim-review')):null,argumentGraph:flag('argument-graph')?await loadJSON(flag('argument-graph')):null,argumentReview:flag('argument-review')?await loadJSON(flag('argument-review')):null,claimAwareRewrite:flag('rewrite-assurance-input')?await loadJSON(flag('rewrite-assurance-input')):null,factCoverage:flag('fact-coverage-input')?await loadJSON(flag('fact-coverage-input')):null,granularFactCoverage:flag('granular-fact-coverage-input')?await loadJSON(flag('granular-fact-coverage-input')):null,requireGranularCoverage:flag('require-granular-coverage')==='true',factEvidence:flag('fact-evidence-input')?await loadJSON(flag('fact-evidence-input')):null,requireFactEvidence:flag('require-fact-evidence')==='true',sourceConflicts:flag('source-conflicts-input')?await loadJSON(flag('source-conflicts-input')):null,requireSourceConflicts:flag('require-source-conflicts')==='true',metricReconciliation:flag('metric-reconciliation-input')?await loadJSON(flag('metric-reconciliation-input')):null,requireMetricReconciliation:flag('require-metric-reconciliation')==='true',reconciliationEvidence:flag('reconciliation-evidence-input')?await loadJSON(flag('reconciliation-evidence-input')):null,requireReconciliationEvidence:flag('require-reconciliation-evidence')==='true',evidenceChain:flag('evidence-chain-input')?await loadJSON(flag('evidence-chain-input')):null,requireEvidenceChain:flag('require-evidence-chain')==='true',inferenceReview:flag('inference-review-input')?await loadJSON(flag('inference-review-input')):null,requireInferenceReview:flag('require-inference-review')==='true',inferenceDependencies:flag('inference-dependencies-input')?await loadJSON(flag('inference-dependencies-input')):null,requireInferenceDependencies:flag('require-inference-dependencies')==='true',counterargumentInput:flag('counterargument-input')?await loadJSON(flag('counterargument-input')):null,requireCounterarguments:flag('require-counterarguments')==='true',craftImpact:flag('craft-impact-input')?await loadJSON(flag('craft-impact-input')):null,requireCraftImpact:flag('require-craft-impact')==='true',structureRegression:flag('structure-regression-input')?await loadJSON(flag('structure-regression-input')):null,requireStructureRegression:flag('require-structure-regression')==='true',coherence:flag('coherence-input')?await loadJSON(flag('coherence-input')):null,evidenceBound:flag('evidence-bound-input')?await loadJSON(flag('evidence-bound-input')):null,requireEvidenceBound:flag('require-evidence-bound')==='true',requireCoherence:flag('require-coherence')==='true',sourceChange:flag('source-change-input')?await loadJSON(flag('source-change-input')):null,requireSourceChange:flag('require-source-change')==='true',dependencyCoverage:flag('dependency-coverage-input')?await loadJSON(flag('dependency-coverage-input')):null,requireDependencyCoverage:flag('require-dependency-coverage')==='true'};
    if(positional[0]==='final-gate-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(await verifyFinalGateWithCraftImpact(inputs,await loadJSON(flag('report'))),null,2));return;
    }
    const result=await evaluateFinalGateWithCraftImpact(inputs);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='revision' && ['safety-gate','safety-gate-verify'].includes(positional[0])){
    const b=flag('before'),a=flag('after'),anchors=flag('anchors'),inventory=flag('inventory'),reportFile=flag('report');
    if(!b||!a||!anchors||!inventory)fail('Expected --before, --after, --anchors and --inventory');
    const before=await readFile(b,'utf8'),after=await readFile(a,'utf8'),anchorData=await loadJSON(anchors),inventoryData=await loadJSON(inventory);
    const options={decisions:flag('editorial-decisions')?await loadJSON(flag('editorial-decisions')):null,review:flag('decisions')?await loadJSON(flag('decisions')):null,contractReport:flag('contract-report')?await loadJSON(flag('contract-report')):null};
    if(positional[0]==='safety-gate-verify'){
      if(!reportFile)fail('Expected --report');
      console.log(JSON.stringify(verifyEditorialRelease(before,after,anchorData,inventoryData,options,await loadJSON(reportFile)),null,2));return;
    }
    const result=evaluateEditorialRelease(before,after,anchorData,inventoryData,options);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='revision' && positional[0]==='safety-audit'){
    const before=flag('before'),after=flag('after'),inventory=flag('inventory'),output=flag('output');
    if(!before||!after||!inventory)fail('Expected --before, --after and --inventory');
    const result=auditEditorialSafety(await readFile(before,'utf8'),await readFile(after,'utf8'),await loadJSON(inventory));
    if(output){await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='revision' && positional[0]==='safety-verify'){
    const before=flag('before'),after=flag('after'),inventory=flag('inventory'),report=flag('report');
    if(!before||!after||!inventory||!report)fail('Expected --before, --after, --inventory and --report');
    console.log(JSON.stringify(verifyEditorialSafety(await readFile(before,'utf8'),await readFile(after,'utf8'),await loadJSON(inventory),await loadJSON(report)),null,2));return;
  }
  if(command==='avoid-ai' && ['tiers','tiers-verify'].includes(positional[0])){
    const file=flag('file');if(!file)fail('Expected --file');
    const content=await readFile(file,'utf8');
    const options={context:flag('context','blog'),voice:flag('voice','professional')};
    if(flag('tier3-threshold')!==undefined)options.tier3Threshold=Number(flag('tier3-threshold'));
    if(flag('non-native-tolerance')!==undefined)options.nonNativeTolerance=flag('non-native-tolerance')==='true';
    if(positional[0]==='tiers-verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyAvoidAITiers(content,await loadJSON(flag('report')),options),null,2));return;
    }
    const result=inspectAvoidAITiers(content,options);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));return;
  }
  if(command==='avoid-ai' && ['detect','verify'].includes(positional[0])){
    const file=flag('file');if(!file)fail('Expected --file');
    const text=await readFile(file,'utf8'),context=flag('context','blog');
    if(positional[0]==='verify'){
      if(!flag('report'))fail('Expected --report');
      console.log(JSON.stringify(verifyAvoidAI(text,await loadJSON(flag('report')),{context}),null,2));return;
    }
    const result=detectAvoidAI(text,{context});
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));return;
  }
  if(command==='style' && positional[0]==='inspect'){
    const file=flag('file'),output=flag('output');if(!file)fail('Expected --file');
    const policy=flag('policy')?await loadJSON(flag('policy')):DEFAULT_STYLE_POLICY;
    const result=inspectStyle(await readFile(file,'utf8'),policy);
    if(output){await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);}
    console.log(JSON.stringify(result,null,2));return;
  }
  if(command==='revision' && positional[0]==='attribute'){
    const file=flag('file'),patchFile=flag('patches');if(!file||!patchFile)fail('Expected --file and --patches');
    const result=attributeRegressions(await readFile(file,'utf8'),await loadJSON(patchFile),await loadJSON(flag('rules','rules/anti-slop.json')),flag('policy')?await loadJSON(flag('policy')):DEFAULT_STYLE_POLICY);
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));return;
  }

  if(command==='revision' && positional[0]==='accept'){
    const file=flag('file'),plan=flag('plan'),decisions=flag('decisions'),output=flag('output'),reportFile=flag('report');
    if(!file||!plan||!decisions||!output||!reportFile)fail('Expected --file, --plan, --decisions, --output and --report');
    if(resolve(file)===resolve(output)||resolve(file)===resolve(reportFile)||resolve(output)===resolve(reportFile))fail('Output paths must be distinct from original and each other');
    const result=acceptRevision({before:await readFile(file,'utf8'),plan:await loadJSON(plan),decisions:await loadJSON(decisions),rules:await loadJSON(flag('rules','rules/anti-slop.json')),anchors:flag('anchors')?await loadJSON(flag('anchors')):[],primary:flag('primary')?await loadSkillContract(flag('primary')):null,constraint:flag('constraint')?await loadSkillContract(flag('constraint')):null});
    const {revisedText,...report}=result;
    await mkdir(dirname(resolve(reportFile)),{recursive:true});await saveJSON(reportFile,report);
    if(result.status!=='BLOCKED'){
      await mkdir(dirname(resolve(output)),{recursive:true});await writeFile(output,revisedText,{flag:'wx'});
    }
    console.log(JSON.stringify({status:result.status,blockers:result.blockers,pending:result.pending,report:reportFile,output:result.status==='BLOCKED'?null:output},null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='revision' && positional[0]==='accept-verify'){
    const report=flag('report'),before=flag('before'),after=flag('after');if(!report||!before||!after)fail('Expected --report, --before and --after');
    console.log(JSON.stringify(verifyRevisionAcceptance(await loadJSON(report),await readFile(before,'utf8'),await readFile(after,'utf8')),null,2));return;
  }
  if(command==='revision' && positional[0]==='plan'){
    const file=flag('file'),out=flag('output');if(!file||!out)fail('Expected --file and --output');
    const report=prepareRevisionPlan(await readFile(file,'utf8'),await loadJSON(flag('rules','rules/anti-slop.json')),flag('anchors')?await loadJSON(flag('anchors')):[]);
    await mkdir(dirname(resolve(out)),{recursive:true});await saveJSON(out,report);
    console.log(JSON.stringify({status:'PREPARED',tasks:report.tasks.length,planHash:report.planHash,output:out},null,2));return;
  }
  if(command==='revision' && positional[0]==='plan-verify'){
    const file=flag('file'),plan=flag('plan');if(!file||!plan)fail('Expected --file and --plan');
    console.log(JSON.stringify(verifyRevisionPlan(await readFile(file,'utf8'),await loadJSON(plan)),null,2));return;
  }
  if(command==='revision' && positional[0]==='execute'){
    const file=flag('file'),plan=flag('plan'),decisions=flag('decisions'),out=flag('output');
    if(!file||!plan||!decisions||!out)fail('Expected --file, --plan, --decisions and --output');
    if(resolve(file)===resolve(out))fail('Refusing to overwrite original');
    const result=executeRevisionPlan(await readFile(file,'utf8'),await loadJSON(plan),await loadJSON(decisions));
    await mkdir(dirname(resolve(out)),{recursive:true});await writeFile(out,result.revisedText,{flag:'wx'});
    const {revisedText,...report}=result;
    if(flag('report')){await mkdir(dirname(resolve(flag('report'))),{recursive:true});await saveJSON(flag('report'),report);}
    console.log(JSON.stringify({status:result.status,applied:result.patches.length,pending:result.pending,output:out},null,2));
    if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }

  if(command==='workflow' && positional[0]==='run'){
    const before=flag('before'),after=flag('after'),anchors=flag('anchors'),inventory=flag('inventory'),rules=flag('rules','rules/anti-slop.json'),output=flag('output');
    if(!before||!after||!anchors||!inventory||!output)fail('Expected --before, --after, --anchors, --inventory and --output');
    const result=runWritingWorkflow({before:await readFile(before,'utf8'),after:await readFile(after,'utf8'),anchors:await loadJSON(anchors),inventory:await loadJSON(inventory),rules:await loadJSON(rules),review:flag('decisions')?await loadJSON(flag('decisions')):null,contractReport:flag('contract-report')?await loadJSON(flag('contract-report')):null,metadata:{beforeFile:before,afterFile:after}});
    await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);
    console.log(JSON.stringify({status:result.status,steps:result.steps,workflowHash:result.workflowHash,output},null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='workflow' && positional[0]==='verify'){
    const report=flag('report');if(!report)fail('Expected --report');
    console.log(JSON.stringify(verifyWritingWorkflow(await loadJSON(report)),null,2));return;
  }
  if(command==='revision' && positional[0]==='coverage'){
    const b=flag('before'),a=flag('anchors'),i=flag('inventory');if(!b||!a||!i)fail('Expected --before, --anchors and --inventory');
    const result=auditAnchorCoverage(await readFile(b,'utf8'),await loadJSON(a),await loadJSON(i));
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),result);}
    console.log(JSON.stringify(result,null,2));if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='revision' && positional[0]==='bundle'){
    const b=flag('before'),a=flag('after'),anchors=flag('anchors'),inventory=flag('inventory'),out=flag('output');
    if(!b||!a||!anchors||!inventory||!out)fail('Expected --before, --after, --anchors, --inventory and --output');
    const result=buildReleaseEvidence(await readFile(b,'utf8'),await readFile(a,'utf8'),await loadJSON(anchors),await loadJSON(inventory),{review:flag('decisions')?await loadJSON(flag('decisions')):null,contractReport:flag('contract-report')?await loadJSON(flag('contract-report')):null});
    await mkdir(dirname(resolve(out)),{recursive:true});await saveJSON(out,result);
    console.log(JSON.stringify({status:result.status,bundleHash:result.bundleHash,output:out},null,2));
    if(result.status==='BLOCKED')process.exitCode=1;else if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='revision' && positional[0]==='bundle-verify'){
    if(!flag('bundle'))fail('Expected --bundle');console.log(JSON.stringify(verifyReleaseEvidence(await loadJSON(flag('bundle'))),null,2));return;
  }
  if(command==='revision' && positional[0]==='gate') {
    const beforeFile=flag('before'),afterFile=flag('after'),anchorFile=flag('anchors'),output=flag('output');
    if(!beforeFile||!afterFile||!anchorFile)fail('Expected --before, --after and --anchors');
    const result=evaluateRevisionGate(await readFile(beforeFile,'utf8'),await readFile(afterFile,'utf8'),await loadJSON(anchorFile),{
      review:flag('decisions')?await loadJSON(flag('decisions')):null,
      contractReport:flag('contract-report')?await loadJSON(flag('contract-report')):null
    });
    if(output){await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='BLOCKED')process.exitCode=1;
    else if(result.status==='INCOMPLETE')process.exitCode=4;
    return;
  }
  if(command==='revision' && ['drift-prepare','drift-evaluate'].includes(positional[0])) {
    const casesFile=flag('cases'),output=flag('output');
    if(!casesFile||!output)fail('Expected --cases and --output');
    const cases=await loadJSON(casesFile);
    const result=positional[0]==='drift-prepare'?prepareDriftTasks(cases):evaluateDrift(cases,await loadJSON(flag('predictions')||fail('Expected --predictions')));
    await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);
    console.log(JSON.stringify({status:result.status,output,items:result.tasks?.length??result.metrics?.overall.total},null,2));
    if(result.status==='INCOMPLETE')process.exitCode=4;
    return;
  }

  if(command==='revision' && ['audit','review'].includes(positional[0])) {
    const beforeFile=flag('before'),afterFile=flag('after'),anchorFile=flag('anchors'),output=flag('output');
    if(!beforeFile||!afterFile||!anchorFile)fail('Expected --before, --after and --anchors');
    const before=await readFile(beforeFile,'utf8'),after=await readFile(afterFile,'utf8'),anchors=await loadJSON(anchorFile);
    let result;
    if(positional[0]==='review'){
      if(!flag('decisions'))fail('Expected --decisions');
      result=reviewRevisionAudit(before,after,anchors,await loadJSON(flag('decisions')));
    } else result=prepareRevisionAudit(before,after,anchors);
    if(output){await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);}
    console.log(JSON.stringify(result,null,2));
    if(result.status==='INCOMPLETE')process.exitCode=4;
    if(result.status==='BLOCKED')process.exitCode=1;
    return;
  }
  if (command==='provider' && positional[0]==='local') {
    const file=positional[1],contractFile=flag('contract'),endpoint=flag('endpoint'),model=flag('model'),output=flag('output');
    if(!file||!contractFile||!endpoint||!model)fail('Expected filename, --contract, --endpoint and --model');
    const result=await runLocalProvider(await readFile(file,'utf8'),await loadSkillContract(contractFile),{file,endpoint,model,timeoutMs:Number(flag('timeout-ms','30000'))});
    if(output){await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);}
    console.log(JSON.stringify({status:result.report.status,report:result.report},null,2));
    if(result.report.status==='INCOMPLETE')process.exitCode=4;
    if(result.report.status==='REVIEW_CONFLICT')process.exitCode=1;
    return;
  }
  if (command==='provider' && positional[0]==='prepare') {
    const file=positional[1],contractFile=flag('contract'),output=flag('output');
    if(!file||!contractFile||!output)fail('Expected filename, --contract and --output');
    const request=prepareProviderRequest(await readFile(file,'utf8'),await loadSkillContract(contractFile),{file,provider:flag('provider','manual'),model:flag('model','unconfigured')});
    await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,request);
    console.log(JSON.stringify({status:'PREPARED',output,tasks:request.tasks.length,requestHash:request.requestHash},null,2));return;
  }
  if (command==='provider' && positional[0]==='verify') {
    const file=positional[1],contractFile=flag('contract'),requestFile=flag('request'),responseFile=flag('response');
    if(!file||!contractFile||!requestFile||!responseFile)fail('Expected filename, --contract, --request and --response');
    const report=verifyProviderResponse(await readFile(file,'utf8'),await loadSkillContract(contractFile),await loadJSON(requestFile),await loadJSON(responseFile),{file});
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),report);}
    console.log(JSON.stringify(report,null,2));
    if(report.status==='INCOMPLETE')process.exitCode=4;
    if(report.status==='REVIEW_CONFLICT')process.exitCode=1;
    return;
  }
  if(command==='benchmark' && positional[0]==='resolve-disagreements') {
    const cases=flag('cases'),initial=flag('adjudication'),decisions=flag('decisions'),output=flag('output');
    if(!cases||!initial||!decisions||!output)fail('Expected --cases, --adjudication, --decisions and --output');
    const result=resolveDisagreements(await loadJSON(cases),await loadJSON(initial),await loadJSON(decisions));
    await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);
    console.log(JSON.stringify({status:result.status,resolved:result.resolved.length,pending:result.review.length,output},null,2));
    if(result.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='benchmark' && positional[0]==='error-audit') {
    const cases=flag('cases'),adjudication=flag('adjudication'),predictions=flag('predictions'),output=flag('output');
    if(!cases||!adjudication||!predictions||!output)fail('Expected --cases, --adjudication, --predictions and --output');
    const result=analyzePredictionErrors(await loadJSON(cases),await loadJSON(adjudication),await loadJSON(predictions));
    await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,result);
    console.log(JSON.stringify({status:result.status,errors:result.errorCount,total:result.total,output},null,2));return;
  }
  if(command==='benchmark' && positional[0]==='annotation-prepare') {
    const input=positional[1],output=flag('output');if(!input||!output)fail('Expected cases JSON and --output');
    const report=prepareAnnotationCases(await loadJSON(input));await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,report);
    console.log(JSON.stringify({status:'PREPARED',cases:report.cases.length,output},null,2));return;
  }
  if(command==='benchmark' && positional[0]==='adjudicate') {
    const cases=flag('cases'),labels=flag('annotations'),output=flag('output');if(!cases||!labels||!output)fail('Expected --cases, --annotations and --output');
    const report=adjudicateAnnotations(await loadJSON(cases),await loadJSON(labels));await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,report);
    console.log(JSON.stringify({status:report.status,resolved:report.resolved.length,review:report.review.length,output},null,2));if(report.status==='INCOMPLETE')process.exitCode=4;return;
  }
  if(command==='benchmark' && positional[0]==='evaluate-reviewed') {
    const adjudication=flag('adjudication'),predictions=flag('predictions'),output=flag('output');if(!adjudication||!predictions)fail('Expected --adjudication and --predictions');
    const rows=joinPredictions(await loadJSON(adjudication),await loadJSON(predictions));const report=evaluateBenchmark(rows);
    report.labeling={source:'independent_annotations',note:'Consensus metadata is self-declared; does not authenticate annotators'};
    if(output){await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,report);}console.log(JSON.stringify(report,null,2));return;
  }
  if(command==='benchmark'&&positional[0]==='provenance') {
    const file=positional[1],manifestFile=flag('manifest');
    if(!file||!manifestFile)fail('Expected dataset and --manifest');
    console.log(JSON.stringify(await verifyBenchmarkProvenance(file,await loadJSON(manifestFile)),null,2));return;
  }

  if (command === 'benchmark' && positional[0] === 'evaluate') {
    const input=positional[1],output=flag('output');
    if(!input)fail('Expected benchmark JSONL filename');
    const report=evaluateBenchmark(await readBenchmarkJSONL(input));
    if(output){await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,report);}
    console.log(JSON.stringify(report,null,2));return;
  }

  if (command === 'semantic' && positional[0] === 'prepare') {
    const file=positional[1],contractFile=flag('contract'),output=flag('output');
    if(!file||!contractFile||!output)fail('Expected filename, --contract and --output');
    const tasks=prepareSemanticTasks(await readFile(file,'utf8'),await loadSkillContract(contractFile),{file});
    await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,tasks);
    console.log(JSON.stringify({status:tasks.status,output,tasks:tasks.tasks.length},null,2));return;
  }
  if (command === 'semantic' && positional[0] === 'verify') {
    const file=positional[1],contractFile=flag('contract'),responseFile=flag('response');
    if(!file||!contractFile||!responseFile)fail('Expected filename, --contract and --response');
    const report=verifySemanticTasks(await readFile(file,'utf8'),await loadSkillContract(contractFile),await loadJSON(responseFile),{file});
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),report);}
    console.log(JSON.stringify(report,null,2));
    if(report.status==='INCOMPLETE')process.exitCode=4;
    if(report.status==='REVIEW_CONFLICT')process.exitCode=1;
    return;
  }
  if (command === 'preserve' && positional[0] === 'verify') {
    const file=positional[1],patchFile=flag('patches'),protectedFile=flag('protected'),output=flag('output');
    if(!file||!patchFile||!protectedFile)fail('Expected filename, --patches and --protected');
    const report=verifyProtectedPatches(await readFile(file,'utf8'),await loadJSON(patchFile),await loadJSON(protectedFile));
    if(output){if(resolve(file)===resolve(output))fail('Refusing to overwrite original file');await mkdir(dirname(resolve(output)),{recursive:true});await writeFile(output,report.revisedText,{flag:'wx'});}
    const {revisedText,...summary}=report;console.log(JSON.stringify(summary,null,2));return;
  }
  if (command === 'init') {
    const path = resolve('writing.config.json');
    await saveJSON(path, { rules: 'rules/anti-slop.json', profile: 'general', semantic: false });
    console.log(`Created ${path}`); return;
  }
  if (command === 'rules' && positional[0] === 'validate') {
    const path = flag('rules', 'rules/anti-slop.json');
    const rules = await loadJSON(path); validateRules(rules); console.log(`PASS: ${rules.length} valid rules`); return;
  }
  if (command === 'analyze') {
    const file = positional[0]; if (!file) fail('Expected a Markdown filename');
    const rules = await loadJSON(flag('rules', 'rules/anti-slop.json'));
    const report = analyze(await readFile(file, 'utf8'), rules, { file });
    if (flag('output')) { await mkdir(dirname(resolve(flag('output'))), { recursive: true }); await saveJSON(flag('output'), report); }
    console.log(JSON.stringify(report, null, 2)); if (report.status === 'FAIL') process.exitCode = 1; return;
  }
  if (command === 'skill' && positional[0] === 'extract') {
    const file=positional[1]; if(!file) fail('Expected Markdown skill filename');
    const report=extractRequirementCandidates(await readFile(file,'utf8'),file);
    if(flag('output')) { await mkdir(dirname(resolve(flag('output'))),{recursive:true}); await saveJSON(flag('output'),report); }
    console.log(JSON.stringify(report,null,2)); return;
  }
  if (command === 'skill' && positional[0] === 'compile-reviewed') {
    const candidates=flag('candidates'),decisions=flag('decisions'),output=flag('output');
    if(!candidates||!decisions||!output)fail('Expected --candidates, --decisions and --output');
    const compiled=compileReviewedCandidates(await loadJSON(candidates),await loadJSON(decisions));
    await mkdir(dirname(resolve(output)),{recursive:true});
    await saveJSON(output,compiled.contract);
    console.log(JSON.stringify({output,review:compiled.review},null,2));
    if(compiled.review.pending)process.exitCode=4;
    return;
  }
  if (command === 'evidence' && positional[0] === 'prepare') {
    const file=positional[1],contractFile=flag('contract'),output=flag('output');
    if(!file||!contractFile||!output)fail('Expected filename, --contract and --output');
    const report=prepareEvidenceReview(await readFile(file,'utf8'),await loadSkillContract(contractFile),{file});
    await mkdir(dirname(resolve(output)),{recursive:true});await saveJSON(output,report);
    console.log(JSON.stringify({status:report.status,output,items:report.items.length},null,2));return;
  }
  if (command === 'evidence' && positional[0] === 'verify') {
    const file=positional[1],contractFile=flag('contract'),reviewFile=flag('review');
    if(!file||!contractFile||!reviewFile)fail('Expected filename, --contract and --review');
    const report=verifyEvidenceReview(await readFile(file,'utf8'),await loadSkillContract(contractFile),await loadJSON(reviewFile),{file});
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),report);}
    console.log(JSON.stringify(report,null,2));
    if(report.status==='REVIEW_CONFLICT')process.exitCode=1;
    if(report.status==='INCOMPLETE')process.exitCode=4;
    return;
  }
  if (command === 'verify-contract') {
    const file=positional[0],contractFile=flag('contract');
    if(!file||!contractFile)fail('Expected Markdown filename and --contract');
    const report=verifyContract(await readFile(file,'utf8'),await loadSkillContract(contractFile),{file});
    if(flag('output')){await mkdir(dirname(resolve(flag('output'))),{recursive:true});await saveJSON(flag('output'),report);}
    console.log(JSON.stringify(report,null,2));
    if(report.status==='FAIL')process.exitCode=1;
    if(report.status==='INCOMPLETE')process.exitCode=4;
    return;
  }
  if (command === 'skill' && positional[0] === 'validate') {
    const file=positional[1]; if (!file) fail('Expected skill Markdown or JSON file');
    const contract=await loadSkillContract(file);
    console.log(JSON.stringify({status:'PASS',requirements:contract.requirements.length,file},null,2)); return;
  }
  if (command === 'fuse-skills') {
    const primary=flag('primary'), constraint=flag('constraint');
    if (!primary||!constraint) fail('Expected --primary and --constraint Markdown or JSON skill files');
    const report=fuseContracts(await loadSkillContract(primary),await loadSkillContract(constraint));
    if (flag('output')) { await mkdir(dirname(resolve(flag('output'))),{recursive:true}); await saveJSON(flag('output'),report); }
    console.log(JSON.stringify(report,null,2));
    if (report.status==='BLOCKED') process.exitCode=3;
    return;
  }
  if (command === 'fuse') {
    const p = flag('primary'), c = flag('constraint'); if (!p || !c) fail('Expected --primary and --constraint JSON files');
    const report = fuse(await loadJSON(p), await loadJSON(c));
    if (flag('output')) await saveJSON(flag('output'), report);
    console.log(JSON.stringify(report, null, 2)); if (report.status === 'BLOCKED') process.exitCode = 3; return;
  }
  if (command === 'patch' && positional[0] === 'propose') {
    const file = positional[1]; if (!file) fail('Expected a filename');
    const startOffset = Number(flag('start')), endOffset = Number(flag('end'));
    const patch = proposePatch(await readFile(file, 'utf8'), { startOffset, endOffset, replacementText: flag('replace', '') });
    console.log(JSON.stringify(patch, null, 2)); return;
  }
  if (command === 'patch' && positional[0] === 'batch') {
    const file=positional[1],patchFile=flag('patches'),output=flag('output');
    if (!file||!patchFile||!output) fail('Expected filename, --patches and --output');
    if (resolve(file)===resolve(output)) fail('Refusing to overwrite original file');
    const next=applyBatch(await readFile(file,'utf8'),await loadJSON(patchFile));
    await mkdir(dirname(resolve(output)),{recursive:true});
    await writeFile(output,next,{flag:'wx'});
    console.log(`Created ${output}`); return;
  }
  if (command === 'patch' && positional[0] === 'apply') {
    const file = positional[1], patchFile = flag('patch'), output = flag('output');
    if (!file || !patchFile || !output) fail('Expected filename, --patch and --output');
    if (resolve(file) === resolve(output)) fail('Refusing to overwrite original file');
    const next = applyPatch(await readFile(file, 'utf8'), await loadJSON(patchFile));
    await writeFile(output, next, { flag: 'wx' }); console.log(`Created ${output}`); return;
  }
  fail('Unknown command. See README.md');
}
main().catch(e => fail(e.message, 5));
