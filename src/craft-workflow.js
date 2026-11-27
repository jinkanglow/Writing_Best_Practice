import {sha256} from './core.js';
import {loadCraftRules} from './craft-contract.js';

const stages=['intent','outline','draft','structure','line','release'];
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const rulesByStage={intent:[],outline:['character-causality','argument-progression','reader-value'],draft:['scene-change','viewpoint-continuity','dialogue-subtext','evidence-boundary'],structure:['narrative-pace','argument-progression','counterexample','character-causality'],line:['voice-rhythm','syntax-control'],release:['revision-purpose','evidence-boundary','reader-value']};
const stageInstructions={
 intent:'Declare the intended reader, the central question, the intended change in understanding, and the factual boundary. Do not invent facts.',
 outline:'Map the argument or story as consequential units. Each unit needs a function and an expected change; no compulsory fiction beat template.',
 draft:'Write complete passages from the outline. Preserve viewpoint and factual provenance; do not insert invented quotations or evidence.',
 structure:'Reorder, cut, or expand units only when the causal chain, reader understanding, or scene consequence improves.',
 line:'Edit syntax, cadence, diction and repetition without altering assertions, hedges, attribution, quantities, or narrative knowledge.',
 release:'Review the finished document against the initial intent, provenance and unresolved editorial questions. Approval is human and separate from automated checks.'
};
const unique=arr=>[...new Set(arr)];
export async function prepareCraftWorkflow(text,{profile='analytical-nonfiction',brief={}}={}){
 if(typeof text!=='string')throw new Error('Expected document text');
 const pack=await loadCraftRules();if(!pack.profiles[profile])throw new Error('Unknown writing profile');
 if(!brief||typeof brief!=='object'||Array.isArray(brief))throw new Error('Invalid brief');
 const allowed=new Set(pack.profiles[profile]);
 const tasks=stages.map((stage,index)=>({stage,index,dependsOn:index?[stages[index-1]]:[],instruction:stageInstructions[stage],ruleIds:unique(rulesByStage[stage]).filter(id=>allowed.has(id)),status:'PENDING'}));
 return {schemaVersion:'6.9',profile,documentHash:sha256(text),rulePackHash:sha256(JSON.stringify(pack)),brief,briefHash:sha256(JSON.stringify(brief)),status:'INCOMPLETE',tasks,limitations:['The workflow organizes human writing and revision, not automated literary evaluation','No generated text, source verification, or semantic correctness is implied']};
}
export async function auditCraftWorkflow(text,plan,reviews=[]){
 const expected=await prepareCraftWorkflow(text,{profile:plan?.profile,brief:plan?.brief});
 if(JSON.stringify(plan)!==JSON.stringify(expected))throw new Error('Stale or tampered craft workflow plan');
 if(!Array.isArray(reviews))throw new Error('Reviews must be an array');
 const seen=new Set(),byStage=new Map();
 for(const review of reviews){
  if(!review||!stages.includes(review.stage)||seen.has(review.stage))throw new Error('Unknown or duplicate workflow stage');
  seen.add(review.stage);
  if(!['PASS','NEEDS_REVISION'].includes(review.decision)||!nonempty(review.reviewer)||!nonempty(review.rationale))throw new Error('Invalid workflow review');
  if(!nonempty(review.quote)||!text.includes(review.quote)||!nonempty(review.observation))throw new Error('Review requires exact document quote and observation');
  const task=expected.tasks.find(t=>t.stage===review.stage);
  if(!Array.isArray(review.ruleChecks)||review.ruleChecks.length!==task.ruleIds.length||new Set(review.ruleChecks.map(x=>x.ruleId)).size!==task.ruleIds.length)throw new Error('Missing or duplicate rule checks');
  for(const check of review.ruleChecks){
   if(!task.ruleIds.includes(check.ruleId)||!['PASS','NEEDS_REVISION','NOT_APPLICABLE'].includes(check.decision)||!nonempty(check.rationale))throw new Error('Invalid rule check');
   if(check.decision==='NOT_APPLICABLE'&&!nonempty(check.notApplicableReason))throw new Error('Missing non-applicability reason');
  }
  byStage.set(review.stage,review);
 }
 const tasks=expected.tasks.map(t=>{
  const r=byStage.get(t.stage);
  const dependencyPassed=t.dependsOn.every(dep=>byStage.get(dep)?.decision==='PASS'&&byStage.get(dep).ruleChecks.every(x=>x.decision!=='NEEDS_REVISION'));
  const status=!r?'PENDING':r.decision==='NEEDS_REVISION'||r.ruleChecks.some(x=>x.decision==='NEEDS_REVISION')?'NEEDS_REVISION':!dependencyPassed?'WAITING_FOR_DEPENDENCY':'REVIEW_COMPLETE';
  return {...t,status};
 });
 const status=tasks.some(t=>t.status==='NEEDS_REVISION')?'NEEDS_REVISION':tasks.every(t=>t.status==='REVIEW_COMPLETE')?'REVIEW_COMPLETE':'INCOMPLETE';
 return {schemaVersion:'6.9',profile:expected.profile,documentHash:expected.documentHash,briefHash:expected.briefHash,rulePackHash:expected.rulePackHash,reviewHash:sha256(JSON.stringify(reviews)),status,tasks,limitations:['REVIEW_COMPLETE only means human checks were recorded for the exact document version','Review identity and the truth of observations are not independently authenticated']};
}
export async function verifyCraftWorkflow(text,plan,reviews,report){const actual=await auditCraftWorkflow(text,plan,reviews);if(JSON.stringify(actual)!==JSON.stringify(report))throw new Error('Craft workflow report mismatch');return {status:'REPORT_RECOMPUTED',documentHash:actual.documentHash};}
