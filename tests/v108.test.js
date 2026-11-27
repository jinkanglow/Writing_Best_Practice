import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {generateKeyPairSync,sign} from 'node:crypto';import {sha256} from '../src/core.js';import {auditFusion106} from '../src/editorial-v106.js';import {auditV107} from '../src/editorial-v107.js';import {extractDirectives,semanticConflicts,auditV108,verifyV108,verifyBenchmarkReview} from '../src/editorial-v108.js';
const hash=x=>sha256(JSON.stringify(x));
const approve=(r,author='a')=>({basis:r.basis,author,reviewer:'b',decisions:Object.fromEntries(r.pending.filter(p=>p.id).map(p=>[p.id,{decision:'approved',reason:'Synthetic fixture only'}]))});
async function fixture(){const legacy=JSON.parse(fs.readFileSync(new URL('../examples/v106/fiction.json',import.meta.url)));const f=legacy.fusion;delete f.review;f.review=approve(auditFusion106(f));const directives=f.skills.map(s=>({id:s.id,skillId:s.id,target:'action',scope:'*',action:'require'}));const previous={legacy,directives,dependencies:[{from:f.units[0].id,to:f.units[1].id,trigger:f.units[0].span.quote,payoff:f.units[1].span.quote,reason:'fixture'}],progression:[],exceptionReviews:[]};previous.review=approve(await auditV107(previous));const ex=extractDirectives(f.skills);return {previous,extractionMap:Object.fromEntries([...ex.candidates,...ex.unparsed].map(c=>[c.id,c.skillId])),causalRoots:[{unitId:f.units[0].id,quote:f.units[0].span.quote,reason:'Opening event'}]};}
async function ready(){const x=await fixture();x.review=approve(await auditV108(x));return x;}
test('English extraction',()=>assert.equal(extractDirectives([{id:'s',content:'Never use filler.'}]).candidates[0].action,'forbid'));
test('Chinese extraction',()=>assert.equal(extractDirectives([{id:'s',content:'必须保留证据。'}]).candidates[0].target,'保留证据'));
test('unparsed retained',()=>assert.equal(extractDirectives([{id:'s',content:'A complex conditional'}]).unparsed.length,1));
test('alias conflict',()=>assert.equal(semanticConflicts([{id:'a',target:'dialogue',scope:'*',action:'require'},{id:'b',target:'speech',scope:'scene',action:'forbid'}],{speech:'dialogue'}).length,1));
test('full fiction path',async()=>assert.equal((await auditV108(await ready())).status,'READY_FOR_INDEPENDENT_RELEASE_REVIEW'));
test('missing extraction',async()=>{const x=await fixture();x.extractionMap={};assert.ok((await auditV108(x)).pending.some(p=>p.code==='EXTRACTION_MAPPING_REQUIRED'))});
test('unreachable scene',async()=>{const x=await fixture();x.causalRoots=[];assert.ok((await auditV108(x)).pending.some(p=>p.code==='UNREACHABLE_SCENE'))});
test('invalid root',async()=>{const x=await fixture();x.causalRoots[0].quote='invented';assert.ok((await auditV108(x)).blockers.some(p=>p.code==='INVALID_CAUSAL_ROOT'))});
test('stale approval',async()=>{const x=await ready();x.causalRoots[0].reason+=' changed';assert.equal((await auditV108(x)).status,'INCOMPLETE')});
test('report verification',async()=>{const x=await ready();assert.equal((await verifyV108(x,await auditV108(x))).status,'VERIFIED')});
test('report tampering',async()=>{const x=await ready(),r=await auditV108(x);r.status='PASS';await assert.rejects(verifyV108(x,r))});
test('nonfiction missing chain fails closed',async()=>{const x=await fixture();x.previous.legacy.fusion.mode='nonfiction';for(const u of x.previous.legacy.fusion.units){u.contribution=u.id;u.claimIds=['a']}assert.ok((await auditV108(x)).pending.some(p=>p.code==='EDITORIAL_REQUIRED'))});
const body={id:'case',author:'a',reviewer:'b',locator:'fixture',permission:'synthetic',before:'old',after:'new',preference:'after',reason:'fixture'};const keys=generateKeyPairSync('ed25519');const record={...body,signature:sign(null,Buffer.from(JSON.stringify(body)),keys.privateKey).toString('base64')};const trust={b:keys.publicKey.export({type:'spki',format:'pem'})};
test('trusted signature',()=>assert.equal(verifyBenchmarkReview(record,trust).status,'SIGNATURE_VERIFIED'));
test('untrusted signature',()=>assert.equal(verifyBenchmarkReview(record,{}).status,'UNAUTHENTICATED'));
test('changed review',()=>assert.equal(verifyBenchmarkReview({...record,preference:'before'},trust).status,'INVALID_SIGNATURE'));
test('self review',()=>assert.throws(()=>verifyBenchmarkReview({...record,author:'b'},trust)));
