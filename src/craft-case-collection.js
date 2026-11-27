import {sha256} from './core.js';
import {validateEvaluationProtocol} from './craft-evaluation-protocol.js';
const digest=x=>sha256(JSON.stringify(x));
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const id=x=>typeof x==='string'&&/^[a-z][a-z0-9_-]{2,79}$/.test(x);
const str=x=>typeof x==='string'&&x.trim().length>0;
const labels=new Set(['ISSUE','NO_ISSUE']);
const splits=new Set(['development','holdout']);
const origins=new Set(['real-consented','real-redacted']);
const categories=new Set(['evidence','coherence','structure','release','other']);
export function validateCaseRegistry(registry){
 if(!obj(registry)||registry.schemaVersion!=='9.1'||!Array.isArray(registry.cases)||registry.cases.length>500)throw Error('Invalid case registry');
 const seen=new Set(),groups=new Map();
 for(const c of registry.cases){
  if(!obj(c)||!id(c.id)||seen.has(c.id)||!origins.has(c.origin)||!categories.has(c.category)||!splits.has(c.split)||!str(c.groupId))throw Error('Invalid case metadata');
  seen.add(c.id);
  if(groups.has(c.groupId)&&groups.get(c.groupId)!==c.split)throw Error('Group leakage across splits');
  groups.set(c.groupId,c.split);
  if(!str(c.consentReference)||c.redactionReviewed!==true||!str(c.redactionReviewer)||!str(c.annotationGuideline)||!str(c.annotationDate)||!/^\d{4}-\d{2}-\d{2}$/.test(c.annotationDate))throw Error('Consent, redaction and annotation provenance required');
  if(!obj(c.input)||typeof c.input.text!=='string'||!obj(c.input.stages)||!Array.isArray(c.input.required))throw Error('Invalid evaluation input');
  if(!Array.isArray(c.assignedReviewers)||c.assignedReviewers.length!==2||c.assignedReviewers.some(x=>!str(x))||c.assignedReviewers[0]===c.assignedReviewers[1])throw Error('Two distinct reviewers required');
  if(!Array.isArray(c.annotations)||c.annotations.length>2)throw Error('Invalid annotations');
  const annotated=new Set();
  for(const a of c.annotations){
   if(!obj(a)||!c.assignedReviewers.includes(a.annotator)||annotated.has(a.annotator)||!labels.has(a.label)||!str(a.rationale)||a.rationale.trim().length<12)throw Error('Invalid or duplicate reviewer annotation');
   annotated.add(a.annotator);
  }
  if(c.adjudication!==undefined){
   if(c.annotations.length!==2||c.annotations[0].label===c.annotations[1].label||!obj(c.adjudication)||!str(c.adjudication.adjudicator)||c.assignedReviewers.includes(c.adjudication.adjudicator)||!labels.has(c.adjudication.label)||!str(c.adjudication.rationale)||c.adjudication.rationale.trim().length<12)throw Error('Invalid adjudication');
  }
 }
 return true;
}
export function addCase(registry,c){const next={...registry,cases:[...registry.cases,c]};validateCaseRegistry(next);return next;}
export function reviewerPacket(registry,reviewer){validateCaseRegistry(registry);if(!str(reviewer))throw Error('Reviewer required');return {schemaVersion:'9.1',reviewer,cases:registry.cases.filter(c=>c.assignedReviewers.includes(reviewer)&&!c.annotations.some(a=>a.annotator===reviewer)).map(c=>({id:c.id,category:c.category,input:c.input,annotationGuideline:c.annotationGuideline}))};}
export function recordAnnotation(registry,caseId,annotation){validateCaseRegistry(registry);const found=registry.cases.find(c=>c.id===caseId);if(!found)throw Error('Unknown case');if(!found.assignedReviewers.includes(annotation?.annotator))throw Error('Reviewer not assigned');if(found.annotations.some(a=>a.annotator===annotation.annotator))throw Error('Annotation already submitted');const next={...registry,cases:registry.cases.map(c=>c.id===caseId?{...c,annotations:[...c.annotations,annotation]}:c)};validateCaseRegistry(next);return next;}
export function recordAdjudication(registry,caseId,decision){validateCaseRegistry(registry);const c=registry.cases.find(x=>x.id===caseId);if(!c)throw Error('Unknown case');if(c.adjudication)throw Error('Adjudication already submitted');const next={...registry,cases:registry.cases.map(x=>x.id===caseId?{...x,adjudication:decision}:x)};validateCaseRegistry(next);return next;}
export function collectionStatus(registry){validateCaseRegistry(registry);return {total:registry.cases.length,pending:registry.cases.filter(c=>c.annotations.length<2).map(c=>c.id),disputed:registry.cases.filter(c=>c.annotations.length===2&&c.annotations[0].label!==c.annotations[1].label&&!c.adjudication).map(c=>c.id),ready:registry.cases.filter(c=>c.annotations.length===2&&(c.annotations[0].label===c.annotations[1].label||c.adjudication)).map(c=>c.id)};}
export function freezeCollection(registry,{frozenBy,frozenAt,thresholds}={}){
 validateCaseRegistry(registry);const state=collectionStatus(registry);
 if(!registry.cases.length||state.pending.length||state.disputed.length)throw Error('Unresolved cases cannot be frozen');
 if(!str(frozenBy)||!str(frozenAt)||!/^\d{4}-\d{2}-\d{2}T/.test(frozenAt))throw Error('Freeze identity and timestamp required');
 const dataset={schemaVersion:'8.9',cases:registry.cases.map(c=>({id:c.id,origin:c.origin,category:c.category,input:c.input,consentReference:c.consentReference,redactionReviewed:c.redactionReviewed,gold:{label:c.adjudication?.label??c.annotations[0].label,rationale:c.adjudication?.rationale??c.annotations[0].rationale,annotator:c.adjudication?.adjudicator??c.annotations[0].annotator,annotationDate:c.annotationDate,guidelineVersion:c.annotationGuideline}}))};
 const protocol={schemaVersion:'9.0',assignments:registry.cases.map(c=>({caseId:c.id,split:c.split,groupId:c.groupId,annotations:c.annotations, ...(c.adjudication?{adjudication:c.adjudication}:{})})),...(thresholds?{thresholds}:{})};
 validateEvaluationProtocol(protocol,dataset);
 const payload={schemaVersion:'9.1',frozenBy,frozenAt,registryHash:digest(registry),dataset,protocol};
 return {...payload,freezeHash:digest(payload)};
}
export function verifyFrozenCollection(registry,frozen){const expected=freezeCollection(registry,{frozenBy:frozen?.frozenBy,frozenAt:frozen?.frozenAt,thresholds:frozen?.protocol?.thresholds});if(JSON.stringify(expected)!==JSON.stringify(frozen))throw Error('Frozen collection mismatch');return {status:'FREEZE_RECOMPUTED',freezeHash:expected.freezeHash};}
