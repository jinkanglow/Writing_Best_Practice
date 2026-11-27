import {sha256} from './core.js';
import {auditInferenceReview} from './inference-review.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const valid=x=>typeof x==='string'&&x.trim().length>0;
const digest=x=>sha256(JSON.stringify(x));
/** Explicit editorial dependency graph. Acyclicity and attestations do not prove logical entailment. */
export async function auditInferenceDependencies(inputs){
 const {claims,inferences,dependencies}=inputs;
 if(!Array.isArray(claims)||!Array.isArray(inferences)||!Array.isArray(dependencies))throw Error('Claims, inferences and dependencies arrays required');
 const review=await auditInferenceReview(inputs);
 const claimIds=new Set(claims.map(c=>c.id));
 const inferenceIds=new Set(inferences.map(i=>i.id));
 const graph=new Map();
 for(const node of dependencies){
  if(!obj(node)||!valid(node.inferenceId)||!inferenceIds.has(node.inferenceId)||graph.has(node.inferenceId)||!Array.isArray(node.premises)||node.premises.length===0)throw Error('Invalid or duplicate dependency node');
  const seen=new Set();
  for(const p of node.premises){
   if(!obj(p)||!['claim','inference'].includes(p.type)||!valid(p.id)||!(p.type==='claim'?claimIds:inferenceIds).has(p.id))throw Error('Unknown or invalid premise');
   const key=`${p.type}:${p.id}`;if(seen.has(key))throw Error('Duplicate premise');seen.add(key);
  }
  graph.set(node.inferenceId,node.premises);
 }
 const state=new Map(),order=[];
 function visit(id,stack=[]){
  if(state.get(id)===1)throw Error(`Inference dependency cycle: ${[...stack,id].join(' -> ')}`);
  if(state.get(id)===2)return;
  state.set(id,1);
  for(const p of graph.get(id)||[])if(p.type==='inference')visit(p.id,[...stack,id]);
  state.set(id,2);order.push(id);
 }
 for(const id of inferenceIds)visit(id);
 const findings=[],rows=[],statusById=new Map();
 const reviewById=new Map(review.rows.map(r=>[r.id,r]));
 for(const id of order){
  const premises=graph.get(id),issues=[];
  if(!premises)issues.push('DEPENDENCY_DECLARATION_MISSING');
  else for(const p of premises){
   if(p.type==='inference'&&statusById.get(p.id)!=='READY_FOR_HUMAN_REVIEW')issues.push('UPSTREAM_INFERENCE_NOT_READY');
   if(p.type==='claim'&&review.findings.some(f=>f.claimId===p.id||f.factId===p.id))issues.push('PREMISE_CLAIM_HAS_FINDINGS');
  }
  if(reviewById.get(id)?.issues.length)issues.push('INFERENCE_REVIEW_NOT_READY');
  const status=issues.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';statusById.set(id,status);
  rows.push({inferenceId:id,premises:premises??null,status,issues});
  for(const code of issues)findings.push({code,inferenceId:id});
 }
 const payload={schemaVersion:'6.6',status:review.status==='BLOCKED'?'BLOCKED':findings.length||review.status!=='READY_FOR_HUMAN_REVIEW'?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',inferenceReviewHash:review.reportHash,dependenciesHash:digest(dependencies),rows,findings,limitations:['Dependency edges are editor-declared and do not prove entailment','Undeclared premises and logical leaps cannot be automatically discovered','Reviewer identity and source authenticity are not independently verified']};
 return {...payload,reportHash:digest(payload)};
}
export async function verifyInferenceDependencies(inputs,report){const expected=await auditInferenceDependencies(inputs);if(!obj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Inference dependency report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
