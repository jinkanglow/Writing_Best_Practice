import {sha256} from './core.js';
import {auditInferenceReview} from './inference-review.js';
import {evaluateFinalGateWithEvidenceChain} from './evidence-chain-release.js';
export async function evaluateFinalGateWithInference(inputs){
 const base=await evaluateFinalGateWithEvidenceChain(inputs);
 const required=inputs.requireInferenceReview===true;
 const audit=inputs.inferenceReview==null?null:await auditInferenceReview(inputs.inferenceReview);
 const blockers=[...base.blockers],pending=[...base.pending];
 if(required&&!audit)pending.push('INFERENCE_REVIEW_REQUIRED');
 if(audit?.status==='BLOCKED')blockers.push('INFERENCE_REVIEW_BLOCKED');
 else if(audit&&audit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('INFERENCE_REVIEW_INCOMPLETE');
 const {reportHash:_ignore,...rest}=base;
 const payload={...rest,schemaVersion:'6.5',status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE',blockers,pending,requireInferenceReview:required,inferenceReviewHash:audit?.reportHash??null,limitations:[...base.limitations,'Inference approval is human attestation, not proof of semantic support']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export async function verifyFinalGateWithInference(inputs,report){const expected=await evaluateFinalGateWithInference(inputs);if(!report||JSON.stringify(report)!==JSON.stringify(expected))throw Error('Inference final gate report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
