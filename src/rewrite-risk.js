import {sha256} from './core.js';
import {inspectNumericalIntegrity} from './numerical-integrity.js';
import {executeAvoidAIRevision} from './avoid-ai-revision.js';
const digest=x=>sha256(JSON.stringify(x));
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const patterns={
 number:/[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:%|％|美元|亿元|万亿|亿|万|吨|手|bp|bps|基点|RM|USD|MYR|元|倍)?/gu,
 qualifier:/可能|或许|预计|预期|大约|约|至少|至多|不超过|高于|低于|如果|若|除非|尚未|未必|may|might|could|likely|approximately|at least|at most|if|unless|not necessarily/giu,
 causal:/导致|造成|推动|由于|因为|因此|源于|证明|引发|caused|causes|because|therefore|proves|drives|results in/giu,
 attribution:/据[^，。；\n]{1,30}(?:称|报道|显示)|根据[^，。；\n]{1,30}|报告显示|数据显示|according to|reported by|data from|sources say/giu,
 date:/\b(?:19|20)\d{2}(?:[-/.年](?:0?[1-9]|1[0-2])(?:[-/.月](?:0?[1-9]|[12]\d|3[01]))?日?)?\b/gu
};
const tokens=(s,re)=>[...s.matchAll(re)].map(m=>m[0].trim());
const countDiff=(a,b)=>{const x=new Map();for(const v of a)x.set(v,(x.get(v)||0)+1);for(const v of b)x.set(v,(x.get(v)||0)-1);return [...x].filter(([,n])=>n!==0).map(([token,delta])=>({token,delta}));};
function changedSpans(before,plan,decisions){
 const approved=new Map(decisions.items.filter(x=>x.action==='approve').map(x=>[x.taskId,x]));
 return plan.tasks.filter(x=>approved.has(x.id)).map(t=>({taskId:t.id,before:t.quote,after:approved.get(t.id).replacementText,startByte:t.startByte,endByte:t.endByte}));
}
/** Deterministic lexical risk audit: no inference of semantic equivalence or truth. */
export function auditRewriteRisks({before,after,plan,decisions,protectedQuotes=[]}){
 const executed=executeAvoidAIRevision(before,plan,decisions,{protectedQuotes});
 if(executed.revisedText!==after)throw Error('After text differs from approved execution');
 const changes=changedSpans(before,plan,decisions);
 const findings=[];
 for(const change of changes){
  for(const [category,re] of Object.entries(patterns)){
   const removed=countDiff(tokens(change.before,re),tokens(change.after,re)).filter(x=>x.delta>0);
   const added=countDiff(tokens(change.before,re),tokens(change.after,re)).filter(x=>x.delta<0);
   if(removed.length||added.length)findings.push({taskId:change.taskId,category,removed,added,startByte:change.startByte,endByte:change.endByte,review:'REQUIRED'});
  }
 }
 findings.push(...inspectNumericalIntegrity(changes).map(f=>({...f,startByte:changes.find(c=>c.taskId===f.taskId).startByte,endByte:changes.find(c=>c.taskId===f.taskId).endByte})));
 const payload={schemaVersion:'5.0',status:findings.length?'REVIEW_REQUIRED':'NO_LEXICAL_RISK_DETECTED',beforeHash:sha256(before),afterHash:sha256(after),planHash:plan.planHash,decisionsHash:digest(decisions),protectedQuotesHash:digest(protectedQuotes),findings,limitations:['Token differences are not proof of changed meaning','Unchanged tokens and context outside edited spans can still change meaning','Named entities and units outside defined token patterns may be missed','No automated factual verification or publication approval']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyRewriteRisks(inputs,report){
 const expected=auditRewriteRisks(inputs);
 if(!isObject(report)||JSON.stringify(report)!==JSON.stringify(expected))throw Error('Rewrite risk report mismatch');
 return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};
}
