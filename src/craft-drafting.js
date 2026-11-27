import {sha256} from './core.js';
import {prepareCraftWorkflow} from './craft-workflow.js';
import {loadCraftRules} from './craft-contract.js';

const meaningful=x=>typeof x==='string'&&x.trim().length>0;
const phases=['intent','outline','draft','structure','line','release'];
const requirements={intent:['audience','centralQuestion','intendedInsight'],outline:['units'],draft:['draftMethod'],structure:['revisionPriority'],line:['voiceConstraint'],release:['releaseCriterion']};
const prompts={
 intent:'Specify the reader, the concrete question, what the reader should understand afterward, and what remains unknown.',
 outline:'Arrange consequential sections: for each, record its job, evidence or scene, transition, and change in reader knowledge.',
 draft:'Draft from the approved outline without invented quotations, data, motives or unearned certainty. Mark evidence gaps explicitly.',
 structure:'Test causal and narrative continuity; move or remove the smallest unit that does not advance the intended outcome.',
 line:'Improve sentence clarity, rhythm and diction while retaining qualifiers, numbers, source attribution and intentional voice.',
 release:'Compare the finished document to the brief, resolve open reviews, and run independent fact and release checks.'
};
const markers=[
 {id:'number',pattern:/\d+(?:[.,]\d+)*(?:\s*[%％]|\s*(?:亿元|万元|美元|RM|USD|bp|bps|个百分点))?/gu},
 {id:'negation',pattern:/\b(?:not|never|no|without|cannot|unlikely)\b|不(?:是|能|会|再|足)|没有|尚未|未(?:能|必|达)|无法|并非/giu},
 {id:'uncertainty',pattern:/\b(?:may|might|could|likely|possibly|estimated|forecast|assuming)\b|可能|预计|估计|假设|如果|或许|大约|约为/giu},
 {id:'attribution',pattern:/\b(?:according to|reported by|cited by)\b|根据|据.+?披露|来源[:：]/giu}
];
function signature(text){return Object.fromEntries(markers.map(({id,pattern})=>[id,[...text.matchAll(pattern)].map(x=>x[0])]));}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
export async function prepareCraftDraft(text,{profile='analytical-nonfiction',brief={}}={}){
 const workflow=await prepareCraftWorkflow(text,{profile,brief});
 const pack=await loadCraftRules();
 const tasks=workflow.tasks.map(stage=>({stage:stage.stage,dependsOn:stage.dependsOn,ruleIds:stage.ruleIds,briefFields:requirements[stage.stage],instruction:prompts[stage.stage],reviewQuestions:stage.ruleIds.map(id=>{const rule=pack.rules.find(r=>r.id===id);return {ruleId:id,question:rule.question,requiredEvidence:rule.evidence,repair:rule.repair};}),status:'HUMAN_ACTION_REQUIRED'}));
 const missingBriefFields=['audience','centralQuestion','intendedInsight'].filter(k=>!meaningful(brief[k]));
 return {schemaVersion:'7.0',profile,documentHash:sha256(text),brief,briefHash:sha256(JSON.stringify(brief)),rulePackHash:workflow.rulePackHash,status:'INCOMPLETE',missingBriefFields,tasks,limitations:['Instructions are grounded editorial tasks, not generated prose','A missing brief field does not authorize inventing its content']};
}
export async function verifyCraftDraft(text,plan){const expected=await prepareCraftDraft(text,{profile:plan?.profile,brief:plan?.brief});if(!same(expected,plan))throw new Error('Stale or tampered drafting plan');return {status:'PLAN_RECOMPUTED',documentHash:expected.documentHash};}
export async function auditCraftRevision(before,after,plan,review=[]){
 if(typeof after!=='string')throw new Error('Expected revised text');
 await verifyCraftDraft(before,plan);
 if(!Array.isArray(review))throw new Error('Review must be an array');
 const seen=new Set();
 for(const r of review){if(!r||!phases.includes(r.stage)||seen.has(r.stage))throw new Error('Unknown or duplicate revision stage');seen.add(r.stage);if(!['APPROVED','REJECTED'].includes(r.decision)||!meaningful(r.reviewer)||!meaningful(r.rationale))throw new Error('Invalid revision approval');}
 const previous=signature(before),next=signature(after);
 const changes=markers.map(({id})=>({category:id,before:previous[id],after:next[id],changed:!same(previous[id],next[id]),reviewRequired:!same(previous[id],next[id])}));
 const risky=changes.filter(c=>c.changed);
 const stageReviews=review.map(r=>({stage:r.stage,decision:r.decision,reviewer:r.reviewer,rationale:r.rationale}));
 const status=review.some(r=>r.decision==='REJECTED')?'BLOCKED':risky.length||review.length!==phases.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE_REVIEW';
 return {schemaVersion:'7.0',beforeHash:sha256(before),afterHash:sha256(after),planHash:sha256(JSON.stringify(plan)),reviewHash:sha256(JSON.stringify(review)),status,changed:before!==after,changes,stageReviews,limitations:['Lexical preservation signals are not semantic equivalence tests','Even a clean report cannot approve release or establish factual accuracy','Changed protected signals always require independent integrity review']};
}
export async function verifyCraftRevision(before,after,plan,review,report){const actual=await auditCraftRevision(before,after,plan,review);if(!same(actual,report))throw new Error('Craft revision report mismatch');return {status:'REPORT_RECOMPUTED',afterHash:actual.afterHash};}
