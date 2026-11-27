import {sha256} from './core.js';
import {prepareParagraphRevision} from './craft-paragraph.js';
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const valid=s=>typeof s==='string'&&s.trim().length>0;
const TYPES=['FACT','MECHANISM','INFERENCE','COUNTERARGUMENT','RESPONSE','CONCLUSION','NARRATIVE_CHANGE'];
/** Explicit editorial evidence, not a semantic entailment or originality detector. */
export function prepareCoherenceReview(text,{profile='analytical-nonfiction'}={}){
 const plan=prepareParagraphRevision(text,{profile});
 return {schemaVersion:'7.5',documentHash:sha256(text),profile,paragraphs:plan.paragraphs.map(p=>({id:p.id,hash:p.hash,previousId:p.previousId,nextId:p.nextId,task:'Declare a unique information contribution, exact textual anchor, dependency and editorial assessment'})),status:'REVIEW_REQUIRED'};
}
export function auditCoherence(text,plan,entries=[]){
 if(!eq(prepareCoherenceReview(text,{profile:plan?.profile}),plan))throw Error('Stale or altered coherence plan');
 if(!Array.isArray(entries))throw Error('Expected editorial entries');
 const paragraphs=prepareParagraphRevision(text,{profile:plan.profile}).paragraphs;
 const ids=new Set(paragraphs.map(p=>p.id)),byId=new Map(),claims=new Map(),issues=[];
 for(const entry of entries){
  if(!entry||!ids.has(entry.id)||byId.has(entry.id))throw Error('Unknown or duplicate paragraph entry');
  if(!TYPES.includes(entry.type)||!valid(entry.contributionId)||!valid(entry.contribution)||!valid(entry.quote)||!valid(entry.reviewer)||!valid(entry.rationale)||!['PASS','FAIL'].includes(entry.decision))throw Error('Incomplete coherence entry');
  const p=paragraphs.find(x=>x.id===entry.id);
  if(!p.text.includes(entry.quote))throw Error('Quote not present in paragraph');
  if(!Array.isArray(entry.dependsOn)||entry.dependsOn.some(id=>!ids.has(id)||id===entry.id)||new Set(entry.dependsOn).size!==entry.dependsOn.length)throw Error('Invalid dependencies');
  if(claims.has(entry.contributionId))issues.push({code:'DUPLICATE_CONTRIBUTION_ID',id:entry.id,relatedId:claims.get(entry.contributionId)});
  claims.set(entry.contributionId,entry.id);byId.set(entry.id,entry);
  if(entry.decision==='FAIL')issues.push({code:'EDITOR_REJECTED_COHERENCE',id:entry.id});
 }
 const pending=[];
 for(const p of paragraphs){
  const e=byId.get(p.id);
  if(!e){pending.push({code:'PARAGRAPH_REVIEW_MISSING',id:p.id});continue;}
  if(e.type==='CONCLUSION'&&e.dependsOn.length===0)issues.push({code:'CONCLUSION_WITHOUT_DECLARED_SUPPORT',id:p.id});
  if(e.type==='RESPONSE'&&e.dependsOn.length===0)issues.push({code:'RESPONSE_WITHOUT_DECLARED_TARGET',id:p.id});
  for(const id of e.dependsOn){
   if(!byId.has(id))pending.push({code:'DEPENDENCY_REVIEW_MISSING',id:p.id,dependsOn:id});
   else if(e.type==='RESPONSE'&&byId.get(id).type!=='COUNTERARGUMENT')issues.push({code:'RESPONSE_TARGET_NOT_COUNTERARGUMENT',id:p.id,dependsOn:id});
  }
 }
 const status=issues.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'7.5',documentHash:sha256(text),planHash:sha256(JSON.stringify(plan)),entriesHash:sha256(JSON.stringify(entries)),profile:plan.profile,status,issues,pending,reviewed:byId.size,total:paragraphs.length,limitations:['Contribution IDs are editorial declarations, not semantic uniqueness checks','Declared dependencies do not establish logical entailment','Reviewer assertions and quotations do not independently verify source accuracy']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export function verifyCoherence(text,plan,entries,report){const expected=auditCoherence(text,plan,entries);if(!eq(expected,report))throw Error('Coherence report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
