import {createHmac, timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {sha256} from './core.js';
import {auditUnifiedPipeline} from './craft-unified-pipeline.js';
import {auditIncremental,planIncrementalAudit} from './craft-incremental.js';

const hash=x=>sha256(JSON.stringify(x));
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const STAGES=['workflow','evidence','coverage','coherence','structure'];
const DEPS={workflow:[],evidence:[],coverage:['evidence'],coherence:[],structure:['coherence']};
const CODE_FILES=['core.js','craft-unified-pipeline.js','craft-workflow.js','craft-evidence-bound.js','craft-dependency-coverage.js','craft-coherence.js','craft-structure-regression.js','craft-incremental.js','craft-incremental-executor.js'];
export async function editorialEngineFingerprint(){
 const parts=[];
 for(const name of CODE_FILES)parts.push([name,sha256(await readFile(new URL(name,import.meta.url)))]);
 return hash(parts);
}
function mac(secret,payload){return createHmac('sha256',secret).update(JSON.stringify(payload)).digest('hex');}
function verified(secret,record){
 if(!obj(record)||!obj(record.payload)||typeof record.mac!=='string'||!/^[0-9a-f]{64}$/.test(record.mac))return false;
 const expected=Buffer.from(mac(secret,record.payload),'hex');
 return timingSafeEqual(expected,Buffer.from(record.mac,'hex'));
}
/** A signed cache is only a local execution optimization. A full audit remains the release authority. */
export async function executeIncrementalAudit(inputs,{secret,previous=null,compareFull=false}={}){
 if(typeof secret!=='string'||Buffer.byteLength(secret,'utf8')<32)throw Error('Cache secret must be at least 32 UTF-8 bytes');
 const {text,before=null,profile='analytical-nonfiction',required,stages}=inputs;
 const engineHash=await editorialEngineFingerprint();
 const valid=verified(secret,previous)&&previous.payload.schemaVersion==='8.3'&&previous.payload.engineHash===engineHash;
 const cached=valid?previous.payload:null;
 const plan=planIncrementalAudit({text,before,profile,required,stages,previous:cached?.advisory??null});
 const selected=STAGES.filter(s=>required.includes(s));
 const reused=[],executed=[],results={};
 // Only reuse independently authenticated results whose full input/dependency fingerprints match.
 for(const stage of selected){
  if(cached&&plan.reusable.includes(stage)&&obj(cached.stageResults?.[stage])){
   results[stage]=cached.stageResults[stage];reused.push(stage);
  }else{
   const needed=new Set([stage]);
   for(const dep of DEPS[stage])needed.add(dep);
   const partial=await auditUnifiedPipeline({text,before,profile,required:STAGES.filter(s=>needed.has(s)),stages});
   results[stage]=partial.results[stage];executed.push(stage);
  }
 }
 // Deterministically reproduce pipeline status from all stage results and prerequisite statuses.
 const blockers=[],pending=[];
 if(required.length===0)pending.push({code:'NO_REQUIRED_STAGES'});
 for(const stage of selected){
  const r=results[stage];
  if(r.status==='BLOCKED')blockers.push({stage,code:r.error?'INVALID_STAGE_INPUT':'STAGE_BLOCKED',...(r.error?{detail:r.error}:{})});
  else if(r.status==='INCOMPLETE'&&!r.reportHash)pending.push({stage,code:'STAGE_INPUT_MISSING'});
  else if(!['READY_FOR_INDEPENDENT_RELEASE_REVIEW','REVIEW_COMPLETE','READY_FOR_HUMAN_REVIEW'].includes(r.status))pending.push({stage,code:'STAGE_NOT_READY',status:r.status});
 }
 for(const stage of required)for(const dependency of DEPS[stage])if(!['READY_FOR_INDEPENDENT_RELEASE_REVIEW','REVIEW_COMPLETE'].includes(results[dependency]?.status))pending.push({stage,code:'PREREQUISITE_NOT_READY',dependency});
 const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const pipelinePayload={schemaVersion:'8.0',documentHash:sha256(text),baselineHash:before===null?null:sha256(before),profile,required,inputsHash:hash(stages),status,results,blockers,pending,limitations:['Stage audits recompute registered assertions; they do not prove factual truth or semantic coherence','This is not a substitute for independent human release approval']};
 const pipeline={...pipelinePayload,reportHash:hash(pipelinePayload)};
 if(compareFull){const full=await auditUnifiedPipeline({text,before,profile,required,stages});if(JSON.stringify(full)!==JSON.stringify(pipeline))throw Error('Incremental/full parity mismatch');}
 const advisoryPayload={schemaVersion:'8.2',documentHash:plan.documentHash,baselineHash:plan.baselineHash,profile,required:[...required],fingerprints:plan.fingerprints,stageResults:results,planHash:null};
 advisoryPayload.planHash=hash(advisoryPayload);
 const payload={schemaVersion:'8.3',engineHash,advisory:advisoryPayload,stageResults:results};
 const cache={payload,mac:mac(secret,payload)};
 return {schemaVersion:'8.3',status,engineHash,pipeline,executed,reused,cache,fullParityChecked:compareFull,releaseAuthority:'FULL_AUDIT_REQUIRED'};
}
export async function verifyIncrementalExecution(inputs,options,report){
 const actual=await executeIncrementalAudit(inputs,options);
 if(JSON.stringify(actual)!==JSON.stringify(report))throw Error('Incremental execution report mismatch');
 return {status:'REPORT_RECOMPUTED',decision:actual.status};
}
