import {sha256} from './core.js';
import {readFile} from 'node:fs/promises';
const here=new URL('../rules/craft-contract.json',import.meta.url);
export async function loadCraftRules(){return JSON.parse(await readFile(here,'utf8'));}
const nonempty=s=>typeof s==='string'&&s.trim().length>0;
const statuses=new Set(['PASS','NEEDS_REVISION','NOT_APPLICABLE']);
export async function prepareCraftReview(text,{profile='analytical-nonfiction'}={}){
 if(typeof text!=='string')throw new Error('Expected document text');
 const pack=await loadCraftRules();const ids=pack.profiles[profile];if(!ids)throw new Error('Unknown writing profile');
 const rules=new Map(pack.rules.map(r=>[r.id,r]));
 const tasks=ids.map(id=>{const r=rules.get(id);if(!r)throw new Error('Unknown craft rule');return {...r,reviewStatus:'PENDING'};});
 return {schemaVersion:'6.8',profile,documentHash:sha256(text),rulePackHash:sha256(JSON.stringify(pack)),status:'INCOMPLETE',tasks,limitations:['Questions are human-review prompts, not automated quality verdicts','The contract does not prove literary merit, story causality, or factual truth']};
}
export async function auditCraftReview(text,prepared,reviews=[]){
 const expected=await prepareCraftReview(text,{profile:prepared?.profile});
 if(JSON.stringify(prepared)!==JSON.stringify(expected))throw new Error('Stale or tampered craft plan');
 if(!Array.isArray(reviews))throw new Error('Reviews must be an array');
 const seen=new Set(),byId=new Map();
 for(const r of reviews){if(!r||!expected.tasks.some(t=>t.id===r.ruleId)||seen.has(r.ruleId))throw new Error('Unknown or duplicate craft review');seen.add(r.ruleId);if(!statuses.has(r.decision)||!nonempty(r.reviewer)||!nonempty(r.rationale))throw new Error('Invalid review decision, reviewer, or rationale');
 if(r.decision!=='NOT_APPLICABLE'){
 if(!nonempty(r.quote)||!text.includes(r.quote))throw new Error('Missing exact document quote');
 if(!nonempty(r.observation))throw new Error('Missing concrete observation');
 }else if(!nonempty(r.notApplicableReason))throw new Error('Missing non-applicability explanation');
 byId.set(r.ruleId,r);
 }
 const tasks=expected.tasks.map(t=>({...t,reviewStatus:byId.get(t.id)?.decision??'PENDING'}));
 const status=tasks.some(t=>t.reviewStatus==='NEEDS_REVISION')?'NEEDS_REVISION':tasks.some(t=>t.reviewStatus==='PENDING')?'INCOMPLETE':'REVIEW_COMPLETE';
 return {schemaVersion:'6.8',profile:expected.profile,documentHash:expected.documentHash,rulePackHash:expected.rulePackHash,reviewHash:sha256(JSON.stringify(reviews)),status,tasks,limitations:['REVIEW_COMPLETE means reviews are recorded, not that writing quality or factual accuracy is independently proven']};
}
export async function verifyCraftReview(text,prepared,reviews,report){const actual=await auditCraftReview(text,prepared,reviews);if(JSON.stringify(actual)!==JSON.stringify(report))throw new Error('Craft report mismatch');return {status:'REPORT_RECOMPUTED',documentHash:actual.documentHash};}
