import {sha256} from './core.js';
import {auditInferenceDependencies} from './inference-dependency.js';
import {evaluateFinalGateWithInference} from './inference-release.js';
export async function evaluateFinalGateWithDependencies(inputs){
 const base=await evaluateFinalGateWithInference(inputs);
 const required=inputs.requireInferenceDependencies===true;
 const audit=inputs.inferenceDependencies==null?null:await auditInferenceDependencies(inputs.inferenceDependencies);
 const blockers=[...base.blockers],pending=[...base.pending];
 if(required&&!audit)pending.push('INFERENCE_DEPENDENCIES_REQUIRED');
 if(audit?.status==='BLOCKED')blockers.push('INFERENCE_DEPENDENCIES_BLOCKED');
 else if(audit&&audit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('INFERENCE_DEPENDENCIES_INCOMPLETE');
 const {reportHash:_ignored,...rest}=base;
 const payload={...rest,schemaVersion:'6.6',status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE',blockers,pending,requireInferenceDependencies:required,inferenceDependenciesHash:audit?.reportHash??null,limitations:[...base.limitations,'Acyclic dependency graphs cannot establish sound reasoning or completeness']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export async function verifyFinalGateWithDependencies(inputs,report){const expected=await evaluateFinalGateWithDependencies(inputs);if(!report||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Inference dependency final gate report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
