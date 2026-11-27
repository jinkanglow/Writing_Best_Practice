import {sha256} from './core.js';
import {evaluateFinalGateWithDependencies} from './dependency-release.js';
import {auditCounterarguments} from './counterargument-review.js';
export async function evaluateFinalGateWithCounterarguments(inputs){
 const base=await evaluateFinalGateWithDependencies(inputs);
 const required=inputs.requireCounterarguments===true;
 const audit=inputs.counterargumentInput==null?null:await auditCounterarguments(inputs.counterargumentInput);
 const blockers=[...base.blockers],pending=[...base.pending];
 if(required&&!audit)pending.push('COUNTERARGUMENT_REVIEW_REQUIRED');
 if(audit?.status==='BLOCKED')blockers.push('COUNTERARGUMENT_REVIEW_BLOCKED');
 else if(audit&&audit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('COUNTERARGUMENT_REVIEW_INCOMPLETE');
 const {reportHash:_unused,...rest}=base;
 const payload={...rest,schemaVersion:'6.7',status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE',blockers,pending,requireCounterarguments:required,counterargumentReportHash:audit?.reportHash??null,limitations:[...base.limitations,'Counterargument attestations do not prove that a conclusion survived meaningful adversarial testing']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export async function verifyFinalGateWithCounterarguments(inputs,report){const expected=await evaluateFinalGateWithCounterarguments(inputs);if(!report||JSON.stringify(report)!==JSON.stringify(expected))throw Error('Counterargument final gate report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
