import {sha256} from './core.js';
import {auditUnifiedPipeline} from './craft-unified-pipeline.js';

const hash=x=>sha256(JSON.stringify(x));
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ORDER=['workflow','evidence','coverage','coherence','structure'];
const DEPS={workflow:[],evidence:[],coverage:['evidence'],coherence:[],structure:['coherence']};

/** Incremental execution planner. Cache is an advisory optimization hint, never an authorization to release. */
export function planIncrementalAudit({text,before=null,profile='analytical-nonfiction',required,stages,previous=null}={}){
 if(typeof text!=='string'||(before!==null&&typeof before!=='string')||typeof profile!=='string'||!Array.isArray(required)||!object(stages)||new Set(required).size!==required.length||required.some(x=>!ORDER.includes(x)))throw Error('Invalid incremental inputs');
 for(const stage of required)for(const dep of DEPS[stage])if(!required.includes(dep))throw Error(`Required stage ${stage} requires ${dep}`);
 const docHash=sha256(text),baselineHash=before===null?null:sha256(before);
 const fingerprints={};
 for(const stage of ORDER.filter(x=>required.includes(x))){
  const input=stage==='coverage'?{...stages.coverage,records:stages.coverage?.records??stages.evidence?.records}:stages[stage];
  fingerprints[stage]=hash({schema:'8.2',stage,profile,docHash,baselineHash:stage==='structure'?baselineHash:null,input,dependencies:DEPS[stage].map(x=>fingerprints[x])});
 }
 const previousValid=object(previous)&&previous.schemaVersion==='8.2'&&object(previous.fingerprints)&&object(previous.stageResults)&&previous.planHash===hash({schemaVersion:previous.schemaVersion,documentHash:previous.documentHash,baselineHash:previous.baselineHash,profile:previous.profile,required:previous.required,fingerprints:previous.fingerprints,stageResults:previous.stageResults,planHash:null});
 const changed=[],reusable=[];
 for(const stage of required){
  if(previousValid&&previous.fingerprints[stage]===fingerprints[stage]&&object(previous.stageResults[stage]))reusable.push(stage);
  else changed.push(stage);
 }
 const payload={schemaVersion:'8.2',documentHash:docHash,baselineHash,profile,required:[...required],fingerprints,changed,reusable,previousAccepted:previousValid,securityBoundary:'Advisory cache plan only; release must recompute all required stages'};
 return {...payload,planHash:hash(payload)};
}

/** Always recomputes all required stages; compares prior cache for regression attribution, not bypass. */
export async function auditIncremental({text,before=null,profile='analytical-nonfiction',required,stages,previous=null}={}){
 const plan=planIncrementalAudit({text,before,profile,required,stages,previous});
 const pipeline=await auditUnifiedPipeline({text,before,profile,required,stages});
 const stageResults=pipeline.results;
 const payload={schemaVersion:'8.2',documentHash:plan.documentHash,baselineHash:plan.baselineHash,profile,required:[...required],fingerprints:plan.fingerprints,stageResults,planHash:null};
 payload.planHash=hash(payload);
 const result={schemaVersion:'8.2',plan,status:pipeline.status,pipelineHash:pipeline.reportHash,stageResults,cacheRecord:payload,recomputed:[...required],reusedForRelease:[],limitations:['All required stages are recomputed for release safety','Cache matching cannot establish factual truth or editorial quality']};
 return {...result,reportHash:hash(result)};
}
export async function verifyIncremental(inputs,report){const actual=await auditIncremental(inputs);if(!equal(actual,report))throw Error('Incremental report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:actual.reportHash};}
