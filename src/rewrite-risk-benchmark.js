import {sha256} from './core.js';
import {prepareAvoidAIRevision,executeAvoidAIRevision} from './avoid-ai-revision.js';
import {auditRewriteRisks} from './rewrite-risk.js';
const categories=['number','qualifier','causal','attribution','date'];
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const digest=x=>sha256(JSON.stringify(x));
function ratio(a,b){return b===0?null:a/b;}
/** Evaluates explicitly labeled, illustrative edit pairs. Labels are not independent empirical ground truth. */
export function evaluateRewriteRiskBenchmark(dataset,{context='cn-explanatory',voice='chinese-explanatory'}={}){
 if(!object(dataset)||dataset.schemaVersion!=='1'||!Array.isArray(dataset.cases)||!dataset.cases.length)throw Error('Invalid benchmark dataset');
 if(!['synthetic','human-annotated'].includes(dataset.provenance))throw Error('Explicit dataset provenance required');
 const seen=new Set(),results=[];
 for(const item of dataset.cases){
  if(!object(item)||typeof item.id!=='string'||!item.id||seen.has(item.id)||typeof item.before!=='string'||typeof item.replacement!=='string'||!Array.isArray(item.expected)||item.expected.some(c=>!categories.includes(c))||new Set(item.expected).size!==item.expected.length)throw Error('Invalid benchmark case');
  seen.add(item.id);
  const plan=prepareAvoidAIRevision(item.before,{context,voice});
  const target=plan.tasks.find(t=>t.quote===item.targetQuote);
  if(!target)throw Error(`Benchmark target quote not found: ${item.id}`);
  const decisions={planHash:plan.planHash,items:[{taskId:target.id,action:'approve',replacementText:item.replacement,reviewer:'benchmark-fixture',rationale:'Controlled benchmark edit'}]};
  const after=executeAvoidAIRevision(item.before,plan,decisions).revisedText;
  const report=auditRewriteRisks({before:item.before,after,plan,decisions});
  const predicted=[...new Set(report.findings.map(f=>f.category))].sort();
  results.push({id:item.id,expected:[...item.expected].sort(),predicted,missing:item.expected.filter(c=>!predicted.includes(c)),extra:predicted.filter(c=>!item.expected.includes(c)),beforeHash:sha256(item.before),afterHash:sha256(after)});
 }
 const perCategory={};let tp=0,fp=0,fn=0,tn=0;
 for(const category of categories){let a=0,b=0,c=0,d=0;for(const r of results){const expected=r.expected.includes(category),predicted=r.predicted.includes(category);if(expected&&predicted)a++;else if(!expected&&predicted)b++;else if(expected&&!predicted)c++;else d++;}perCategory[category]={tp:a,fp:b,fn:c,tn:d,precision:ratio(a,a+b),recall:ratio(a,a+c)};tp+=a;fp+=b;fn+=c;tn+=d;}
 const payload={schemaVersion:'4.8',datasetHash:digest(dataset),provenance:dataset.provenance,caseCount:results.length,context,voice,metrics:{tp,fp,fn,tn,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),perCategory},results,limitations:['Benchmark labels are supplied, not independently verified','Synthetic results cannot establish real-world false-positive rates','A lexical category hit does not establish semantic change','Cases are conditional on a valid Avoid AI revision task']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyRewriteRiskBenchmark(dataset,options,report){const expected=evaluateRewriteRiskBenchmark(dataset,options);if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Benchmark report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
