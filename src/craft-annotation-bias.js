import {sha256} from './core.js';
import {validateCaseRegistry} from './craft-case-collection.js';
const hash=x=>sha256(JSON.stringify(x));
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const tokenize=s=>new Set(s.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]);
const similarity=(a,b)=>{if(!a.size&&!b.size)return 1;let common=0;for(const x of a)if(b.has(x))common++;return common/(a.size+b.size-common);};
export function auditAnnotationBias(registry,policy){
 validateCaseRegistry(registry);
 if(!object(policy)||policy.schemaVersion!=='9.3'||typeof policy.nearDuplicateThreshold!=='number'||policy.nearDuplicateThreshold<=0||policy.nearDuplicateThreshold>1||!Number.isInteger(policy.minReviewerPairs)||policy.minReviewerPairs<0||typeof policy.maxReviewerPositiveRateGap!=='number'||policy.maxReviewerPositiveRateGap<0||policy.maxReviewerPositiveRateGap>1)throw Error('Invalid bias policy');
 const issues=[],warnings=[];const add=(code,detail)=>issues.push({code,detail});
 const cases=registry.cases;
 const fingerprints=cases.map(c=>({id:c.id,split:c.split,groupId:c.groupId,normalized:tokenize(c.input.text)}));
 const pairs=[];
 for(let i=0;i<fingerprints.length;i++)for(let j=i+1;j<fingerprints.length;j++){
  const a=fingerprints[i],b=fingerprints[j];const score=similarity(a.normalized,b.normalized);
  if(score>=policy.nearDuplicateThreshold){
   const crossSplit=a.split!==b.split;
   pairs.push({caseIds:[a.id,b.id],score:Number(score.toFixed(6)),crossSplit});
   add(crossSplit?'NEAR_DUPLICATE_SPLIT_LEAKAGE':'NEAR_DUPLICATE_SAMPLE',`${a.id} / ${b.id}: token Jaccard ${score.toFixed(4)}`);
  }
 }
 const reviewerStats=new Map();
 for(const c of cases)for(const a of c.annotations){const s=reviewerStats.get(a.annotator)||{reviewer:a.annotator,total:0,positive:0};s.total++;if(a.label==='ISSUE')s.positive++;reviewerStats.set(a.annotator,s);}
 const reviewers=[...reviewerStats.values()].sort((a,b)=>a.reviewer.localeCompare(b.reviewer)).map(x=>({...x,positiveRate:x.positive/x.total}));
 // Compare annotators only on cases that both reviewed, not on different assignment mixes.
 const comparisons=[];
 for(let i=0;i<reviewers.length;i++)for(let j=i+1;j<reviewers.length;j++){
  const a=reviewers[i].reviewer,b=reviewers[j].reviewer;
  const shared=cases.filter(c=>c.annotations.some(x=>x.annotator===a)&&c.annotations.some(x=>x.annotator===b));
  if(shared.length<policy.minReviewerPairs)continue;
  const aRate=shared.filter(c=>c.annotations.find(x=>x.annotator===a).label==='ISSUE').length/shared.length;
  const bRate=shared.filter(c=>c.annotations.find(x=>x.annotator===b).label==='ISSUE').length/shared.length;
  const gap=Math.abs(aRate-bRate);
  comparisons.push({reviewers:[a,b],paired:shared.length,positiveRateGap:gap});
  if(gap>policy.maxReviewerPositiveRateGap)add('REVIEWER_RATE_DISPARITY',`${a} / ${b}: paired positive-rate gap ${gap.toFixed(4)}`);
 }
 if(!comparisons.length)warnings.push({code:'INSUFFICIENT_SHARED_REVIEWS',detail:'No reviewer pairs meet the shared-case threshold'});
 warnings.push({code:'LEXICAL_ONLY',detail:'Token Jaccard does not reliably detect paraphrases or semantic duplicates'});
 warnings.push({code:'NO_CAUSAL_BIAS_INFERENCE',detail:'Observed reviewer disparities do not establish systematic bias'});
 const payload={schemaVersion:'9.3',registryHash:hash(registry),policyHash:hash(policy),status:issues.length?'NOT_READY':'READY_FOR_REVIEW',summary:{cases:cases.length,nearDuplicatePairs:pairs.length,crossSplitPairs:pairs.filter(x=>x.crossSplit).length,reviewers:reviewers.length,reviewerComparisons:comparisons.length},pairs,reviewers,comparisons,issues,warnings};
 return {...payload,reportHash:hash(payload)};
}
export function verifyAnnotationBias(registry,policy,report){const expected=auditAnnotationBias(registry,policy);if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Bias audit report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
