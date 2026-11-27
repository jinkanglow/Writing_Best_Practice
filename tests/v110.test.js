import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPairSync,sign} from 'node:crypto';import {fixture} from './v110-fixture.js';import {auditV109} from '../src/editorial-v109.js';import {runEditorial,verifyEditorial,evidenceReasoning,executeBenchmark} from '../src/editorial-runtime.js';import {sha256} from '../src/core.js';
const keys=generateKeyPairSync('ed25519'),policy={at:'2026-11-27',registry:[{id:'b',status:'active',from:'2026-01-01',until:'2027-01-01',publicKey:keys.publicKey.export({type:'spki',format:'pem'})}]};
async function input(){const legacy=await fixture();return {legacy,directiveCoverage:(await auditV109(legacy)).parsed.map(d=>({id:d.id,directiveId:d.skillId,decision:'mapped',reason:'Synthetic mapping'}))};}
async function signed(){const x=await input(),r=await runEditorial(x,policy);x.approval={reviewer:'b',signature:sign(null,Buffer.from(JSON.stringify({...r.body,reviewer:'b'})),keys.privateKey).toString('base64')};return x;}
test('unsigned release incomplete',async()=>assert.equal((await runEditorial(await input(),policy)).status,'INCOMPLETE'));
test('signed fiction full path',async()=>assert.equal((await runEditorial(await signed(),policy)).status,'REVIEW_AUTHORIZED'));
test('missing mapping blocked',async()=>{const x=await input();x.directiveCoverage=[];assert.equal((await runEditorial(x,policy)).status,'BLOCKED')});
test('duplicate mapping blocked',async()=>{const x=await input();x.directiveCoverage.push(x.directiveCoverage[0]);assert.equal((await runEditorial(x,policy)).status,'BLOCKED')});
test('stale approval',async()=>{const x=await signed();x.directiveCoverage[0].reason+=' changed';assert.equal((await runEditorial(x,policy)).status,'INCOMPLETE')});
test('revoked approval',async()=>assert.equal((await runEditorial(await signed(),{...policy,registry:policy.registry.map(r=>({...r,status:'revoked'}))})).status,'INCOMPLETE'));
test('report recomputation',async()=>{const x=await signed();assert.equal((await verifyEditorial(x,policy,await runEditorial(x,policy))).status,'VERIFIED')});
test('tampered report',async()=>{const x=await signed(),r=await runEditorial(x,policy);r.status='BLOCKED';await assert.rejects(verifyEditorial(x,policy,r))});
test('evidence mismatch',()=>assert.equal(evidenceReasoning('10 days','20 days',{quote:'10 days',sourceHash:sha256('20 days')}).status,'INVALID_EVIDENCE'));
test('numbers are not entailment',()=>assert.equal(evidenceReasoning('10 days','10 days',{quote:'10 days',sourceHash:sha256('10 days')}).status,'SEMANTIC_REVIEW_REQUIRED'));
test('missing numbers visible',()=>assert.deepEqual(evidenceReasoning('10 days','20 days',{quote:'20 days',sourceHash:sha256('20 days')}).missingNumbers,['10']));
test('empty benchmark rejected',()=>assert.throws(()=>executeBenchmark([],policy.registry,policy.at)));
