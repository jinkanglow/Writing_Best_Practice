import {sha256} from './core.js';
import {prepareEvidenceBound,auditEvidenceBound} from './craft-evidence-bound.js';
import {prepareDependencyCoverage,auditDependencyCoverage} from './craft-dependency-coverage.js';
import {prepareCoherenceReview,auditCoherence} from './craft-coherence.js';
import {prepareCraftWorkflow,auditCraftWorkflow} from './craft-workflow.js';
import {auditStructureRegression} from './craft-structure-regression.js';

const STAGES=['workflow','evidence','coverage','coherence','structure'];
const deps={workflow:[],evidence:[],coverage:['evidence'],coherence:[],structure:['coherence']};
const hash=value=>sha256(JSON.stringify(value));
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/** Recompute each selected stage against the same immutable document. No trust in supplied reports. */
export async function auditUnifiedPipeline({text,before=null,profile='analytical-nonfiction',stages={},required=STAGES}={}){
 if(typeof text!=='string'||!isObj(stages)||!Array.isArray(required)||new Set(required).size!==required.length||required.some(s=>!STAGES.includes(s)))throw Error('Invalid unified pipeline input');
 const requiredSet=new Set(required);
 // A required downstream stage must never silently waive its prerequisites.
 for(const stage of required)for(const dependency of deps[stage])if(!requiredSet.has(dependency))throw Error(`Required stage ${stage} requires ${dependency}`);
 const results={},blockers=[],pending=[];
 if(required.length===0)pending.push({code:'NO_REQUIRED_STAGES'});
 for(const stage of STAGES){
  if(!requiredSet.has(stage))continue;
  const input=stages[stage];
  if(!isObj(input)){pending.push({stage,code:'STAGE_INPUT_MISSING'});results[stage]={status:'INCOMPLETE'};continue;}
  try{
   let report;
   if(stage==='workflow'){
    const plan=await prepareCraftWorkflow(text,{profile,brief:input.brief??{}});
    if(input.plan&&!same(input.plan,plan))throw Error('Workflow plan mismatch');
    report=await auditCraftWorkflow(text,plan,input.reviews??[]);
   }else if(stage==='evidence'){
    const plan=prepareEvidenceBound(text,{profile});
    if(input.plan&&!same(input.plan,plan))throw Error('Evidence plan mismatch');
    if(!isObj(input.records))throw Error('Evidence records missing');
    report=auditEvidenceBound(text,plan,input.records);
   }else if(stage==='coverage'){
    const plan=prepareDependencyCoverage(text,{profile});
    if(input.plan&&!same(input.plan,plan))throw Error('Coverage plan mismatch');
    const records=input.records??stages.evidence?.records;
    if(!isObj(records))throw Error('Coverage evidence records missing');
    if(stages.evidence?.records&&!same(records,stages.evidence.records))throw Error('Conflicting evidence records');
    report=auditDependencyCoverage(text,plan,records,input.decisions??[]);
   }else if(stage==='coherence'){
    const plan=prepareCoherenceReview(text,{profile});
    if(input.plan&&!same(input.plan,plan))throw Error('Coherence plan mismatch');
    report=auditCoherence(text,plan,input.entries??[]);
   }else{
    if(typeof before!=='string')throw Error('Baseline document required');
    report=auditStructureRegression(before,text,{profile,links:input.links??[],checks:input.checks??[]});
   }
   if(input.report&&!same(input.report,report))throw Error('Supplied report mismatch');
   results[stage]={status:report.status,reportHash:report.reportHash??hash(report),issues:report.issues??[],pending:report.pending??[]};
   if(report.status==='BLOCKED')blockers.push({stage,code:'STAGE_BLOCKED'});
   else if(!['READY_FOR_INDEPENDENT_RELEASE_REVIEW','REVIEW_COMPLETE','READY_FOR_HUMAN_REVIEW'].includes(report.status))pending.push({stage,code:'STAGE_NOT_READY',status:report.status});
  }catch(error){results[stage]={status:'BLOCKED',error:String(error.message)};blockers.push({stage,code:'INVALID_STAGE_INPUT',detail:String(error.message)});}
 }
 // Fail closed on downstream stages when a prerequisite is not ready.
 for(const stage of required)for(const dependency of deps[stage])if(!['READY_FOR_INDEPENDENT_RELEASE_REVIEW','REVIEW_COMPLETE'].includes(results[dependency]?.status)){
  pending.push({stage,code:'PREREQUISITE_NOT_READY',dependency});
 }
 const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'8.0',documentHash:sha256(text),baselineHash:before===null?null:sha256(before),profile,required,inputsHash:hash(stages),status,results,blockers,pending,limitations:['Stage audits recompute registered assertions; they do not prove factual truth or semantic coherence','This is not a substitute for independent human release approval']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyUnifiedPipeline(inputs,report){const expected=await auditUnifiedPipeline(inputs);if(!same(expected,report))throw Error('Unified pipeline report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
export const UNIFIED_STAGES=STAGES;
