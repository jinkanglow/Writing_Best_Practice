import {sha256} from './core.js';
import {auditAnnotationGovernance} from './craft-annotation-governance.js';
import {auditAnnotationBias} from './craft-annotation-bias.js';
import {validateCaseRegistry} from './craft-case-collection.js';
const hash=x=>sha256(JSON.stringify(x));
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function qualifyEditorialDataset(registry,governancePolicy,biasPolicy,options={}){
 validateCaseRegistry(registry);
 if(!object(options)||Object.keys(options).some(k=>k!=='reviewDecisions')||options.reviewDecisions!==undefined&&!Array.isArray(options.reviewDecisions))throw Error('Invalid qualification options');
 const governance=auditAnnotationGovernance(registry,governancePolicy);
 const bias=auditAnnotationBias(registry,biasPolicy);
 const riskCodes=new Set(['NEAR_DUPLICATE_SAMPLE','REVIEWER_RATE_DISPARITY']);
 const blockingBias=bias.issues.filter(x=>x.code==='NEAR_DUPLICATE_SPLIT_LEAKAGE');
 const reviewable=bias.issues.filter(x=>riskCodes.has(x.code));
 const unexpected=bias.issues.filter(x=>!riskCodes.has(x.code)&&x.code!=='NEAR_DUPLICATE_SPLIT_LEAKAGE');
 const decisions=options.reviewDecisions??[];
 const valid=new Map();
 for(const d of decisions){
  if(!object(d)||typeof d.code!=='string'||typeof d.detail!=='string'||typeof d.reviewer!=='string'||!d.reviewer.trim()||typeof d.rationale!=='string'||d.rationale.trim().length<12||d.disposition!=='accepted-risk'&&d.disposition!=='reject')throw Error('Invalid review decision');
  const key=JSON.stringify([d.code,d.detail]);
  if(valid.has(key)||!reviewable.some(x=>JSON.stringify([x.code,x.detail])===key))throw Error('Duplicate or unrecognized review decision');
  valid.set(key,d);
 }
 const unresolved=reviewable.filter(x=>!valid.has(JSON.stringify([x.code,x.detail])));
 const rejected=reviewable.filter(x=>valid.get(JSON.stringify([x.code,x.detail]))?.disposition==='reject');
 const baseline=registry.cases.length===0?[{code:'EMPTY_DATASET',detail:'No cases available for qualification',source:'qualification'}]:[];
 const blockers=[...baseline,...governance.issues.map(x=>({...x,source:'governance'})),...blockingBias.map(x=>({...x,source:'bias'})),...unexpected.map(x=>({...x,source:'bias'})),...rejected.map(x=>({...x,source:'review'}))];
 const status=blockers.length?'NOT_READY':unresolved.length?'REVIEW_REQUIRED':'QUALIFIED';
 const payload={schemaVersion:'9.4',registryHash:hash(registry),governancePolicyHash:hash(governancePolicy),biasPolicyHash:hash(biasPolicy),optionsHash:hash(options),status,blockers,reviewRequired:unresolved,reviewed:decisions.map(x=>({...x})),checks:{governance:{status:governance.status,reportHash:governance.reportHash,summary:governance.summary},bias:{status:bias.status,reportHash:bias.reportHash,summary:bias.summary}},warnings:[...governance.warnings,...bias.warnings,{code:'POLICY_QUALIFICATION_ONLY',detail:'QUALIFIED means configured checks passed; it does not establish sample representativeness, consent authenticity, or real-world detector accuracy'}]};
 return {...payload,reportHash:hash(payload)};
}
export function verifyEditorialDatasetQualification(registry,governancePolicy,biasPolicy,report,options={}){
 const expected=qualifyEditorialDataset(registry,governancePolicy,biasPolicy,options);
 if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Qualification report mismatch');
 return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};
}
