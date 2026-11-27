import {sha256} from './core.js';
import {runEditorialBenchmark,validateEditorialBenchmark} from './craft-editorial-benchmark.js';

const hash=x=>sha256(JSON.stringify(x));
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const labelSet=new Set(['ISSUE','NO_ISSUE']);
const splitSet=new Set(['development','holdout']);
const ratio=(a,b)=>b?Number((a/b).toFixed(6)):null;

export function validateEvaluationProtocol(protocol,dataset){
 validateEditorialBenchmark(dataset);
 if(!object(protocol)||protocol.schemaVersion!=='9.0'||!Array.isArray(protocol.assignments)||protocol.assignments.length!==dataset.cases.length)throw Error('Invalid evaluation protocol');
 const cases=new Map(dataset.cases.map(c=>[c.id,c]));
 const seen=new Set(),groups=new Map();
 for(const a of protocol.assignments){
  if(!object(a)||!cases.has(a.caseId)||seen.has(a.caseId)||!splitSet.has(a.split)||typeof a.groupId!=='string'||!a.groupId.trim())throw Error('Invalid split assignment');
  seen.add(a.caseId);
  if(groups.has(a.groupId)&&groups.get(a.groupId)!==a.split)throw Error('Group leakage across development and holdout');
  groups.set(a.groupId,a.split);
  if(!Array.isArray(a.annotations)||a.annotations.length<2)throw Error('Two independent annotations required');
  const annotators=new Set();
  for(const n of a.annotations){
   if(!object(n)||typeof n.annotator!=='string'||!n.annotator.trim()||annotators.has(n.annotator)||!labelSet.has(n.label)||typeof n.rationale!=='string'||n.rationale.trim().length<12)throw Error('Invalid independent annotation');
   annotators.add(n.annotator);
  }
  const unanimous=a.annotations.every(n=>n.label===a.annotations[0].label);
  if(!unanimous){
   if(!object(a.adjudication)||!labelSet.has(a.adjudication.label)||typeof a.adjudication.adjudicator!=='string'||!a.adjudication.adjudicator.trim()||annotators.has(a.adjudication.adjudicator)||typeof a.adjudication.rationale!=='string'||a.adjudication.rationale.trim().length<12)throw Error('Disagreement requires independent adjudication');
  }else if(a.adjudication!==undefined)throw Error('Unnecessary adjudication');
  const decided=unanimous?a.annotations[0].label:a.adjudication.label;
  if(decided!==cases.get(a.caseId).gold.label)throw Error('Consensus label disagrees with benchmark gold label');
 }
 if(seen.size!==cases.size)throw Error('Incomplete split assignments');
 if(protocol.thresholds!==undefined){
  if(!object(protocol.thresholds)||Object.entries(protocol.thresholds).some(([k,v])=>!['minHoldoutCases','minRealHoldoutCases','maxFalsePositiveRate','minRecall'].includes(k)||typeof v!=='number'||!Number.isFinite(v)||v<0||(k.startsWith('min')&&k!=='minHoldoutCases'&&k!=='minRealHoldoutCases'&&v>1)||(k.startsWith('max')&&v>1)||(['minHoldoutCases','minRealHoldoutCases'].includes(k)&&!Number.isInteger(v))))throw Error('Invalid thresholds');
 }
 return true;
}
export async function runEvaluationProtocol(protocol,dataset){
 validateEvaluationProtocol(protocol,dataset);
 const benchmark=await runEditorialBenchmark(dataset);
 const assignments=new Map(protocol.assignments.map(a=>[a.caseId,a]));
 const summarize=split=>{
  const rows=benchmark.rows.filter(r=>assignments.get(r.id).split===split);
  const real=rows.filter(r=>r.origin!=='synthetic');
  const tp=rows.filter(r=>r.gold==='ISSUE'&&r.prediction==='ISSUE').length;
  const fn=rows.filter(r=>r.gold==='ISSUE'&&r.prediction==='NO_ISSUE').length;
  const fp=rows.filter(r=>r.gold==='NO_ISSUE'&&r.prediction==='ISSUE').length;
  const tn=rows.filter(r=>r.gold==='NO_ISSUE'&&r.prediction==='NO_ISSUE').length;
  const abstained=rows.filter(r=>r.prediction==='ABSTAIN').length;
  return {total:rows.length,real:real.length,synthetic:rows.length-real.length,tp,fn,fp,tn,abstained,recall:ratio(tp,tp+fn),falsePositiveRate:ratio(fp,fp+tn),coverage:ratio(rows.length-abstained,rows.length)};
 };
 const development=summarize('development'),holdout=summarize('holdout');
 const disagreements=protocol.assignments.filter(a=>a.annotations.some(n=>n.label!==a.annotations[0].label)).length;
 const thresholds={minHoldoutCases:protocol.thresholds?.minHoldoutCases??1,minRealHoldoutCases:protocol.thresholds?.minRealHoldoutCases??1,maxFalsePositiveRate:protocol.thresholds?.maxFalsePositiveRate??0.1,minRecall:protocol.thresholds?.minRecall??0.9};
 const failures=[];
 if(holdout.total<thresholds.minHoldoutCases)failures.push('INSUFFICIENT_HOLDOUT');
 if(holdout.real<thresholds.minRealHoldoutCases)failures.push('INSUFFICIENT_REAL_CASES');
 if(holdout.abstained)failures.push('HOLDOUT_ABSTAINED');
 if(holdout.falsePositiveRate===null||holdout.recall===null)failures.push('MISSING_POSITIVE_OR_NEGATIVE_CLASS');
 if(holdout.falsePositiveRate!==null&&holdout.falsePositiveRate>thresholds.maxFalsePositiveRate)failures.push('FALSE_POSITIVE_RATE_EXCEEDED');
 if(holdout.recall!==null&&holdout.recall<thresholds.minRecall)failures.push('RECALL_BELOW_THRESHOLD');
 const payload={schemaVersion:'9.0',protocolHash:hash(protocol),datasetHash:hash(dataset),benchmarkHash:benchmark.reportHash,status:failures.length?'NOT_CALIBRATED':'THRESHOLDS_MET',development,holdout,disagreements,thresholds,failures,limitations:['Passing user-supplied thresholds is not proof of real-world accuracy','Holdout independence depends on truthful group identifiers and annotation provenance','A holdout used repeatedly to tune the engine is no longer an untouched evaluation set','Real-case consent and redaction metadata are declared, not independently verified']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyEvaluationProtocol(protocol,dataset,report){const expected=await runEvaluationProtocol(protocol,dataset);if(!same(expected,report))throw Error('Evaluation report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
