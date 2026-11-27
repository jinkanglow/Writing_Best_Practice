import {sha256} from './core.js';
import {auditUnifiedPipeline} from './craft-unified-pipeline.js';
import {evaluateFinalGateWithCraftImpact} from './craft-impact-release.js';

const hash=x=>sha256(JSON.stringify(x));
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/** Single fail-closed editorial decision. Legacy input is optional but never silently bypassed when required. */
export async function auditUnifiedRelease({text,before=null,profile='analytical-nonfiction',required,stages,legacy=null,requireLegacy=false}={}){
 if(typeof text!=='string'||(before!==null&&typeof before!=='string')||!object(stages)||!Array.isArray(required)||typeof requireLegacy!=='boolean')throw Error('Invalid unified release inputs');
 const pipeline=await auditUnifiedPipeline({text,before,profile,required,stages});
 const blockers=pipeline.blockers.map(x=>({origin:'pipeline',...x}));
 const pending=pipeline.pending.map(x=>({origin:'pipeline',...x}));
 let legacyStatus='NOT_REQUESTED',legacyHash=null;
 if(requireLegacy&&legacy===null)pending.push({origin:'legacy',code:'LEGACY_GATE_REQUIRED'});
 if(legacy!==null){
  if(!object(legacy)||legacy.after!==text||legacy.before!==(before??null)){
   blockers.push({origin:'legacy',code:'DOCUMENT_MISMATCH'});legacyStatus='BLOCKED';
  }else{
   try{
    const report=await evaluateFinalGateWithCraftImpact(legacy);
    legacyStatus=report.status;legacyHash=report.reportHash;
    if(report.status==='BLOCKED')blockers.push(...report.blockers.map(code=>({origin:'legacy',code})));
    else if(report.status!=='READY_FOR_HUMAN_RELEASE')pending.push(...report.pending.map(code=>({origin:'legacy',code})));
   }catch(e){legacyStatus='BLOCKED';blockers.push({origin:'legacy',code:'INVALID_LEGACY_INPUT',detail:String(e.message)});}
  }
 }
 const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'8.1',documentHash:sha256(text),baselineHash:before===null?null:sha256(before),profile,required,requireLegacy,pipelineStatus:pipeline.status,pipelineHash:pipeline.reportHash,legacyStatus,legacyHash,status,blockers,pending,limitations:['A ready decision authorizes independent release review, not automatic publication','Recorded evidence and review do not establish source truth or semantic correctness']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyUnifiedRelease(inputs,report){const expected=await auditUnifiedRelease(inputs);if(!same(expected,report))throw Error('Unified release report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
