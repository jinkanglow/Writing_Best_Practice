import {sha256} from './core.js';
import {auditCIDiagnostics} from './craft-ci-diagnostics.js';

const hash=value=>sha256(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const labels=new Set(['ISSUE','NO_ISSUE']);
const origins=new Set(['synthetic','real-consented','real-redacted']);
const categories=new Set(['evidence','coherence','structure','release','other']);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function validateEditorialBenchmark(dataset){
 if(!isObject(dataset)||dataset.schemaVersion!=='8.9'||!Array.isArray(dataset.cases)||dataset.cases.length<1||dataset.cases.length>500)throw Error('Invalid benchmark dataset');
 const ids=new Set();
 for(const c of dataset.cases){
  if(!isObject(c)||typeof c.id!=='string'||!/^[a-z][a-z0-9_-]{2,79}$/.test(c.id)||ids.has(c.id))throw Error('Invalid or duplicate benchmark ID');
  ids.add(c.id);
  if(!origins.has(c.origin)||!categories.has(c.category)||!labels.has(c.gold?.label)||!isObject(c.input)||typeof c.input.text!=='string'||!isObject(c.input.stages)||!Array.isArray(c.input.required))throw Error(`Invalid benchmark case ${c.id}`);
  if(typeof c.gold.rationale!=='string'||c.gold.rationale.trim().length<12||typeof c.gold.annotator!=='string'||!c.gold.annotator.trim())throw Error(`Missing independent annotation metadata ${c.id}`);
  if(c.origin!=='synthetic'&&(!c.consentReference||!c.redactionReviewed||!c.gold.annotationDate||!c.gold.guidelineVersion))throw Error(`Real case requires consent, redaction and annotation provenance ${c.id}`);
  if(c.gold.expectedCodes!==undefined&&(!Array.isArray(c.gold.expectedCodes)||c.gold.expectedCodes.some(x=>typeof x!=='string')))throw Error(`Invalid expected diagnostic codes ${c.id}`);
 }
 return true;
}
function ratio(n,d){return d===0?null:Number((n/d).toFixed(6));}
function metrics(rows){
 const tp=rows.filter(x=>x.gold==='ISSUE'&&x.prediction==='ISSUE').length;
 const fp=rows.filter(x=>x.gold==='NO_ISSUE'&&x.prediction==='ISSUE').length;
 const tn=rows.filter(x=>x.gold==='NO_ISSUE'&&x.prediction==='NO_ISSUE').length;
 const fn=rows.filter(x=>x.gold==='ISSUE'&&x.prediction==='NO_ISSUE').length;
 const abstained=rows.filter(x=>x.prediction==='ABSTAIN').length;
 return {total:rows.length,tp,fp,tn,fn,abstained,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),specificity:ratio(tn,tn+fp),accuracy:ratio(tp+tn,rows.length-abstained),coverage:ratio(rows.length-abstained,rows.length)};
}
export async function runEditorialBenchmark(dataset){
 validateEditorialBenchmark(dataset);
 const rows=[];
 for(const c of dataset.cases){
  let prediction='ABSTAIN',codes=[],error=null;
  try{
   const report=await auditCIDiagnostics(c.input);
   codes=[...new Set(report.items.map(x=>x.code))].sort();
   prediction=report.status==='READY_FOR_INDEPENDENT_RELEASE_REVIEW'?'NO_ISSUE':report.status==='BLOCKED'||report.status==='INCOMPLETE'?'ISSUE':'ABSTAIN';
  }catch(e){error=String(e.message);}
  rows.push({id:c.id,origin:c.origin,category:c.category,gold:c.gold.label,prediction,codes,error,expectedCodesMatched:c.gold.expectedCodes===undefined?null:equal(codes,c.gold.expectedCodes.slice().sort())});
 }
 const categoriesReport=Object.fromEntries([...categories].sort().map(category=>[category,metrics(rows.filter(x=>x.category===category))]));
 const originsReport=Object.fromEntries([...origins].sort().map(origin=>[origin,metrics(rows.filter(x=>x.origin===origin))]));
 const payload={schemaVersion:'8.9',datasetHash:hash(dataset),status:rows.some(x=>x.prediction==='ABSTAIN')?'INCOMPLETE':'MEASURED',metrics:metrics(rows),byCategory:categoriesReport,byOrigin:originsReport,rows,limitations:['Synthetic samples cannot establish real-world accuracy','ISSUE means an editorial gate did not pass, not a proven factual error','Ground-truth labels are supplied by annotators, not independently authenticated by this tool','Metrics are descriptive only; no confidence intervals or performance claims without representative sampling']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyEditorialBenchmark(dataset,report){const expected=await runEditorialBenchmark(dataset);if(!equal(expected,report))throw Error('Benchmark report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
