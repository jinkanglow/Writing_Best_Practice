import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '../src/core.js';
import {prepareDependencyCoverage,auditDependencyCoverage,verifyDependencyCoverage} from '../src/craft-dependency-coverage.js';
const text='Revenue rose 12% because demand increased.\n\nProfit may follow.';
function fixture(){
 const plan=prepareDependencyCoverage(text);
 const claims=[{id:'c1',type:'FACT',paragraphId:'p-1',quote:'Revenue rose 12% because demand increased.',interpretation:'Observed revenue growth'},{id:'c2',type:'INFERENCE',paragraphId:'p-2',quote:'Profit may follow.',interpretation:'Conditional profit outlook',dependsOn:['c1']}];
 const records={sources:[{id:'s1',locator:'local',excerpt:'Revenue rose 12% because demand increased.',retrievedAt:'2026-11-20',contentHash:sha256('Revenue rose 12% because demand increased.')}],claims,links:[{id:'l1',claimId:'c1',sourceId:'s1',kind:'SUPPORTS',excerptQuote:'Revenue rose 12%',reasoning:'Direct source'},{id:'l2',claimId:'c2',sourceId:'s1',kind:'SUPPORTS',excerptQuote:'Revenue rose 12%',reasoning:'Supports premise'}],reviews:claims.map(c=>({claimId:c.id,reviewer:'Editor',rationale:'Reviewed',decision:'APPROVE'}))};
 const decisions=plan.candidates.map(c=>({candidateId:c.id,decision:'LINK',claimId:'c1',reviewer:'Editor',rationale:'Matched original claim'}));
 return {plan,records,decisions};
}
test('discovers numerical and causal candidates with exact paragraph references',()=>{const p=prepareDependencyCoverage(text);assert.ok(p.candidates.some(c=>c.kind==='NUMERIC'&&c.quote.includes('12')));assert.ok(p.candidates.some(c=>c.kind==='CAUSAL'&&c.quote==='because'));assert.ok(p.candidates.every(c=>c.paragraphHash===p.paragraphs.find(x=>x.id===c.paragraphId).hash));});
test('unreviewed candidates fail closed',()=>{const f=fixture();assert.equal(auditDependencyCoverage(text,f.plan,f.records,[]).status,'INCOMPLETE');});
test('complete valid links reach independent review status',()=>{const f=fixture();const r=auditDependencyCoverage(text,...Object.values(f));assert.equal(r.status,'READY_FOR_INDEPENDENT_RELEASE_REVIEW');assert.equal(verifyDependencyCoverage(text,f.plan,f.records,f.decisions,r).status,'REPORT_RECOMPUTED');});
test('candidate dismissed with rationale',()=>{const f=fixture();f.decisions[0]={...f.decisions[0],decision:'NOT_A_CLAIM'};assert.equal(auditDependencyCoverage(text,...Object.values(f)).status,'READY_FOR_INDEPENDENT_RELEASE_REVIEW');});
test('candidate needing research remains incomplete',()=>{const f=fixture();f.decisions[0].decision='NEEDS_SOURCE';assert.equal(auditDependencyCoverage(text,...Object.values(f)).status,'INCOMPLETE');});
test('invalid candidate to claim link blocked',()=>{const f=fixture();f.decisions[0].claimId='missing';assert.equal(auditDependencyCoverage(text,...Object.values(f)).status,'BLOCKED');});
test('duplicate candidate decisions rejected',()=>{const f=fixture();f.decisions.push(f.decisions[0]);assert.throws(()=>auditDependencyCoverage(text,...Object.values(f)));});
test('orphan candidate decision blocked',()=>{const f=fixture();f.decisions.push({...f.decisions[0],candidateId:'ghost'});assert.equal(auditDependencyCoverage(text,...Object.values(f)).status,'BLOCKED');});
test('stale plan rejected',()=>{const f=fixture();assert.throws(()=>auditDependencyCoverage(text+' Changed',...Object.values(f)));});
test('modified plan rejected',()=>{const f=fixture();f.plan.candidates[0].quote='falsified';assert.throws(()=>auditDependencyCoverage(text,...Object.values(f)));});
test('tampered report rejected',()=>{const f=fixture();const r=auditDependencyCoverage(text,...Object.values(f));r.status='BLOCKED';assert.throws(()=>verifyDependencyCoverage(text,f.plan,f.records,f.decisions,r));});
test('unmapped paragraphs require evidence',()=>{const f=fixture();f.records.claims.pop();f.records.reviews.pop();f.records.links.pop();assert.equal(auditDependencyCoverage(text,...Object.values(f)).status,'INCOMPLETE');});
test('missing supporting edge remains incomplete',()=>{const f=fixture();f.records.links.pop();assert.equal(auditDependencyCoverage(text,...Object.values(f)).status,'INCOMPLETE');});
test('dependency cycle blocked',()=>{const f=fixture();f.records.claims[0].dependsOn=['c2'];assert.equal(auditDependencyCoverage(text,...Object.values(f)).status,'BLOCKED');});
test('empty document has no fabricated candidates',()=>{const p=prepareDependencyCoverage('');assert.equal(p.candidates.length,0);assert.equal(p.paragraphs.length,0);});
test('Chinese causal signals are identified',()=>{const p=prepareDependencyCoverage('成本上涨导致利润下降。');assert.ok(p.candidates.some(c=>c.quote==='导致'));});
