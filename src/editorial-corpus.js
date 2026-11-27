import {sha256} from './core.js';
const categories=['number','qualifier','causal','attribution','date'];
const digest=x=>sha256(JSON.stringify(x));
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validLabels=x=>Array.isArray(x)&&x.every(v=>categories.includes(v))&&new Set(x).size===x.length;
/** Independent review protocol. Reviewer identity strings are self-reported, not authenticated. */
export function prepareEditorialCorpus(cases){
 if(!Array.isArray(cases)||!cases.length)throw Error('Nonempty cases array required');
 const seen=new Set();
 const tasks=cases.map(c=>{
  if(!obj(c)||typeof c.id!=='string'||!c.id||seen.has(c.id)||typeof c.before!=='string'||typeof c.targetQuote!=='string'||!c.targetQuote||typeof c.replacement!=='string'||!c.before.includes(c.targetQuote))throw Error('Invalid or duplicate case');
  seen.add(c.id);
  return {id:c.id,before:c.before,targetQuote:c.targetQuote,replacement:c.replacement,caseHash:digest({id:c.id,before:c.before,targetQuote:c.targetQuote,replacement:c.replacement})};
 });
 const payload={schemaVersion:'4.9',tasks,limitations:['Case provenance and reviewer identity are not authenticated','A lexical benchmark only evaluates selected risk categories']};
 return {...payload,corpusHash:digest(payload)};
}
function validateCorpus(corpus){
 if(!obj(corpus)||corpus.schemaVersion!=='4.9'||!Array.isArray(corpus.tasks)||!corpus.tasks.length)throw Error('Invalid corpus');
 const expected=prepareEditorialCorpus(corpus.tasks);
 if(JSON.stringify(expected)!==JSON.stringify(corpus))throw Error('Corpus integrity mismatch');
}
export function adjudicateEditorialCorpus(corpus,reviews,decisions){
 validateCorpus(corpus);
 if(!Array.isArray(reviews)||!Array.isArray(decisions))throw Error('Reviews and decisions must be arrays');
 const tasks=new Map(corpus.tasks.map(t=>[t.id,t]));
 const byCase=new Map();
 for(const r of reviews){
  if(!obj(r)||!tasks.has(r.caseId)||typeof r.reviewer!=='string'||!r.reviewer.trim()||!validLabels(r.labels)||typeof r.rationale!=='string'||!r.rationale.trim())throw Error('Invalid reviewer annotation');
  const a=byCase.get(r.caseId)||[];
  if(a.some(v=>v.reviewer===r.reviewer))throw Error('Duplicate reviewer for case');
  a.push(r);byCase.set(r.caseId,a);
 }
 const byDecision=new Map();
 for(const d of decisions){
  if(!obj(d)||!tasks.has(d.caseId)||byDecision.has(d.caseId)||!validLabels(d.labels)||typeof d.adjudicator!=='string'||!d.adjudicator.trim()||typeof d.rationale!=='string'||!d.rationale.trim())throw Error('Invalid adjudication');
  byDecision.set(d.caseId,d);
 }
 const results=[];
 for(const task of corpus.tasks){
  const pair=byCase.get(task.id)||[];
  if(pair.length!==2||pair[0].reviewer===pair[1].reviewer)throw Error(`Exactly two distinct reviewers required: ${task.id}`);
  const a=[...pair[0].labels].sort(),b=[...pair[1].labels].sort();
  const agree=JSON.stringify(a)===JSON.stringify(b);
  const adjudication=byDecision.get(task.id);
  if(!agree&&!adjudication)throw Error(`Disagreement requires adjudication: ${task.id}`);
  if(agree&&adjudication)throw Error(`Unnecessary adjudication: ${task.id}`);
  if(adjudication&&pair.some(x=>x.reviewer===adjudication.adjudicator))throw Error('Adjudicator must be distinct from reviewers');
  results.push({id:task.id,agreed:agree,expected:agree?a:adjudication.labels.slice().sort(),reviewers:pair.map(x=>x.reviewer).sort(),adjudicator:adjudication?.adjudicator||null});
 }
 const dataset={schemaVersion:'1',provenance:'human-annotated',description:'Double-reviewed and adjudicated labels; provenance is self-declared, not independently authenticated',cases:corpus.tasks.map(t=>({id:t.id,before:t.before,targetQuote:t.targetQuote,replacement:t.replacement,expected:results.find(r=>r.id===t.id).expected}))};
 const payload={schemaVersion:'4.9',corpusHash:corpus.corpusHash,reviewsHash:digest(reviews),decisionsHash:digest(decisions),caseCount:results.length,agreementCount:results.filter(x=>x.agreed).length,disagreementCount:results.filter(x=>!x.agreed).length,results,dataset,limitations:['No verification that source texts are real published articles','Reviewer independence and identities are self-declared','Agreement is label agreement, not factual truth']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyEditorialCorpus(corpus,reviews,decisions,report){
 const expected=adjudicateEditorialCorpus(corpus,reviews,decisions);
 if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Editorial corpus report mismatch');
 return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};
}
