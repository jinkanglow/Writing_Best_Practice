import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAvoidAIRevision,executeAvoidAIRevision} from '../src/avoid-ai-revision.js';
import {auditRewriteRisks,verifyRewriteRisks} from '../src/rewrite-risk.js';
import {assureClaimAwareRewrite} from '../src/claim-aware-rewrite.js';
import {sha256} from '../src/core.js';
function fixture(before,replacement){
 const plan=prepareAvoidAIRevision(before,{context:'cn-explanatory',voice:'chinese-explanatory'});
 assert.ok(plan.tasks.length>0);
 const decisions={planHash:plan.planHash,items:[{taskId:plan.tasks[0].id,action:'approve',replacementText:replacement,reviewer:'editor',rationale:'Manual edit'}]};
 const after=executeAvoidAIRevision(before,plan,decisions).revisedText;
 return {before,after,plan,decisions};
}
test('qualifier deletion triggers review',()=>{
 const f=fixture('值得我们深思，可能下跌。','可能必然下跌');
 assert.equal(auditRewriteRisks(f).status,'REVIEW_REQUIRED');
 assert.ok(auditRewriteRisks(f).findings.some(x=>x.category==='qualifier'));
});
test('numeric change triggers review',()=>{
 const f=fixture('值得我们深思，增长10%。','增长20%');
 assert.ok(auditRewriteRisks(f).findings.some(x=>x.category==='number'));
});
test('causal phrase change triggers review',()=>{
 const f=fixture('值得我们深思，因为利率下降。','因为利率下降');
 assert.ok(auditRewriteRisks(f).findings.some(x=>x.category==='causal'));
});
test('unchanged numerical claims elsewhere do not trigger',()=>{
 const f=fixture('在当今社会，市场上涨。收益为10%。','目前');
 assert.equal(auditRewriteRisks(f).status,'NO_LEXICAL_RISK_DETECTED');
});
test('tampered report fails verification',()=>{
 const f=fixture('值得我们深思，可能下跌。','可能必然下跌');
 assert.throws(()=>verifyRewriteRisks(f,{...auditRewriteRisks(f),status:'SAFE'}));
});
test('correct report recomputes',()=>{
 const f=fixture('值得我们深思，可能下跌。','可能必然下跌');
 assert.equal(verifyRewriteRisks(f,auditRewriteRisks(f)).status,'REPORT_RECOMPUTED');
});
test('unapproved after text rejected',()=>{
 const f=fixture('在当今社会，市场上涨。','目前');
 assert.throws(()=>auditRewriteRisks({...f,after:f.after+'修改'}));
});
test('claim aware assurance includes lexical risk pending',()=>{
 const f=fixture('值得我们深思，可能下跌。证据来自报告。','可能必然下跌');
 const claims={beforeHash:sha256(f.before),claims:[{id:'c1',type:'fact',quote:'证据来自报告'}]};
 const argumentGraph={beforeHash:sha256(f.before),nodes:[{id:'a',quote:'证据来自报告'},{id:'b',quote:'可能下跌'}],edges:[{id:'e',from:'a',to:'b',kind:'supports'}]};
 const r=assureClaimAwareRewrite({...f,claims,argumentGraph});
 assert.ok(r.pending.includes('LEXICAL_RISK_REVIEW_REQUIRED'));
 assert.equal(r.status,'INCOMPLETE');
});
