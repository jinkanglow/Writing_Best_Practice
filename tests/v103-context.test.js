import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {auditContext as audit,auditContextRelease as release,verifyContextRelease} from '../src/editorial-context.js';import {auditCompression} from '../src/editorial-compression.js';
const f=()=>JSON.parse(fs.readFileSync(new URL('../examples/context/input.json',import.meta.url)));const has=(r,c)=>r.blockers.some(x=>x.code===c);
for(const k of ['entity','period','metric','unit','condition','relation'])test('context drift '+k,()=>{const x=f();x.contexts.after.a[k]='different';assert.ok(has(audit(x),'CONTEXT_DRIFT'))});
test('missing context',()=>{const x=f();delete x.contexts.after.a;assert.ok(has(audit(x),'CONTEXT_MISSING'))});
test('unreviewed novelty',()=>assert.ok(audit(f()).pending.some(x=>x.code==='NOVELTY_REVIEW')));
test('missing qualification coverage',()=>assert.ok(audit(f()).pending.some(x=>x.code==='QUALIFICATION_AND_CLAIM_COVERAGE_REVIEW')));
test('material qualifier lost',()=>{const x=f();x.qualifications=[{id:'q',claimId:'a',kind:'material',beforeQuote:'May',afterQuote:'June'}];assert.ok(has(audit(x),'MATERIAL_QUALIFICATION_LOST'))});
test('invalid qualifier anchor',()=>{const x=f();x.qualifications=[{id:'q',claimId:'a',kind:'material',beforeQuote:'June'}];assert.ok(has(audit(x),'QUALIFICATION_INVALID'))});
function reviewed(){const x=f();x.compression.review={basis:auditCompression(x.compression).basis,author:'a',reviewer:'b',decisions:{a:{decision:'preserved',reason:'same'},b:{decision:'preserved',reason:'same'}}};x.review={basis:audit(x).basis,author:'a',reviewer:'b',novelty:{a:{decision:'new',reason:'first',contribution:'sales figure'}},coverage:{document:{decision:'complete',reason:'all claims inspected'}}};return x;}
test('bound review',()=>assert.equal(audit(reviewed()).status,'READY_FOR_UNIFIED_REVIEW'));
test('stale review',()=>{const x=reviewed();x.contexts.before.a.period='June';assert.notEqual(audit(x).status,'READY_FOR_UNIFIED_REVIEW')});
test('self review',()=>{const x=reviewed();x.review.reviewer='a';assert.equal(audit(x).status,'INCOMPLETE')});
test('missing orchestration',async()=>assert.equal((await release({context:reviewed()})).status,'INCOMPLETE'));
test('different document',async()=>assert.ok(has(await release({context:reviewed(),orchestration:{text:'other'}}),'DOCUMENT_MISMATCH')));
test('verify',async()=>{const x={context:reviewed()};assert.equal((await verifyContextRelease(x,await release(x))).status,'VERIFIED')});
test('tamper',async()=>{const x={context:reviewed()},r=await release(x);r.status='READY';await assert.rejects(verifyContextRelease(x,r))});
