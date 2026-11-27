import {sha256} from './core.js';
import {validateCaseRegistry} from './craft-case-collection.js';
const hash=x=>sha256(JSON.stringify(x));
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const labels=['ISSUE','NO_ISSUE'];
const categories=['evidence','coherence','structure','release','other'];
const splits=['development','holdout'];
function validatePolicy(p){
 if(!isObj(p)||p.schemaVersion!=='9.2'||!Number.isInteger(p.minPerSplit)||p.minPerSplit<0||!Number.isInteger(p.minPerLabel)||p.minPerLabel<0||!Number.isInteger(p.minPerCategory)||p.minPerCategory<0||!Number.isInteger(p.minPaired)||p.minPaired<0||typeof p.minAgreement!=='number'||p.minAgreement<0||p.minAgreement>1)throw Error('Invalid governance policy');
 if(!Array.isArray(p.requiredCategories)||p.requiredCategories.some(c=>!categories.includes(c))||new Set(p.requiredCategories).size!==p.requiredCategories.length)throw Error('Invalid required categories');
 return true;
}
const count=(items,predicate)=>items.filter(predicate).length;
export function auditAnnotationGovernance(registry,policy){
 validateCaseRegistry(registry);validatePolicy(policy);
 const issues=[],warnings=[];
 const add=(code,detail)=>issues.push({code,detail});
 const cases=registry.cases;
 const fingerprints=new Map();
 for(const c of cases){
  // Same evaluation input in different cases is not independent evidence.
  const fingerprint=hash(c.input);
  if(fingerprints.has(fingerprint))add('DUPLICATE_INPUT',`${fingerprints.get(fingerprint)} and ${c.id} share identical input`);
  else fingerprints.set(fingerprint,c.id);
 }
 for(const split of splits){
  const subset=cases.filter(c=>c.split===split);
  if(subset.length<policy.minPerSplit)add('SPLIT_UNDERCOVERED',`${split}: ${subset.length}/${policy.minPerSplit}`);
  const ready=subset.filter(c=>c.annotations.length===2&&(c.annotations[0].label===c.annotations[1].label||c.adjudication));
  for(const label of labels){
   const n=count(ready,c=>(c.adjudication?.label??c.annotations[0].label)===label);
   if(n<policy.minPerLabel)add('LABEL_UNDERCOVERED',`${split}/${label}: ${n}/${policy.minPerLabel}`);
  }
  for(const category of policy.requiredCategories){
   const n=count(subset,c=>c.category===category);
   if(n<policy.minPerCategory)add('CATEGORY_UNDERCOVERED',`${split}/${category}: ${n}/${policy.minPerCategory}`);
  }
 }
 const paired=cases.filter(c=>c.annotations.length===2);
 const agreement=paired.length?count(paired,c=>c.annotations[0].label===c.annotations[1].label)/paired.length:null;
 const marginal=labels.map(label=>[
  count(paired,c=>c.annotations[0].label===label)/Math.max(paired.length,1),
  count(paired,c=>c.annotations[1].label===label)/Math.max(paired.length,1)
 ]);
 const expected=paired.length?marginal.reduce((s,[a,b])=>s+a*b,0):null;
 const kappa=paired.length&&expected<1?(agreement-expected)/(1-expected):null;
 if(paired.length<policy.minPaired)add('INSUFFICIENT_PAIRED',`${paired.length}/${policy.minPaired}`);
 if(agreement!==null&&agreement<policy.minAgreement)add('LOW_AGREEMENT',`${agreement.toFixed(4)} < ${policy.minAgreement}`);
 if(kappa===null)warnings.push({code:'KAPPA_UNDEFINED',detail:'Insufficient label variation or paired reviews'});
 const disputed=cases.filter(c=>c.annotations.length===2&&c.annotations[0].label!==c.annotations[1].label&&!c.adjudication);
 if(disputed.length)add('UNRESOLVED_DISAGREEMENT',disputed.map(c=>c.id).join(', '));
 const pending=cases.filter(c=>c.annotations.length!==2);
 if(pending.length)add('PENDING_ANNOTATIONS',pending.map(c=>c.id).join(', '));
 // Consent/redaction metadata is declared by operators, not independently authenticated.
 warnings.push({code:'PROVENANCE_SELF_DECLARED',detail:'Consent and redaction attestations have not been independently verified'});
 const summary={total:cases.length,bySplit:Object.fromEntries(splits.map(s=>[s,count(cases,c=>c.split===s)])),byCategory:Object.fromEntries(categories.map(s=>[s,count(cases,c=>c.category===s)])),paired:paired.length,agreement,kappa,disputed:disputed.length,pending:pending.length,distinctInputs:fingerprints.size};
 const payload={schemaVersion:'9.2',registryHash:hash(registry),policyHash:hash(policy),status:issues.length?'NOT_READY':'READY_FOR_EVALUATION',summary,issues,warnings};
 return {...payload,reportHash:hash(payload)};
}
export function verifyAnnotationGovernance(registry,policy,report){
 const expected=auditAnnotationGovernance(registry,policy);
 if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Governance report mismatch');
 return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};
}
