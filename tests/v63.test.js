import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquireSource} from '../src/source-acquisition.js';
import {auditEvidenceChainRelease,verifyEvidenceChainRelease} from '../src/evidence-chain-release.js';
async function fixture(){const root=await mkdtemp(join(tmpdir(),'wbp63-'));const bytes=Buffer.from('营收 100.25 亿元\n','utf8');const record=await acquireSource({root,entry:{id:'filing',path:'filing.txt',url:'https://reports.example.org/filing'},allowedHosts:['reports.example.org'],transport:async()=>({bytes,statusCode:200,contentType:'text/plain'}),clock:()=> '2026-11-20T00:00:00Z'});const quote='营收 100.25 亿元';return {root,records:[record],allowedHosts:['reports.example.org'],links:[{id:'link1',recordId:'filing',factId:'revenue',quote,startByte:0,endByte:Buffer.byteLength(quote),reviewer:'editor',rationale:'exact quote'}],requiredFacts:[{id:'revenue',reason:'critical revenue figure',reviewer:'editor'}]};}
async function withFixture(fn){const f=await fixture();try{await fn(f);}finally{await rm(f.root,{recursive:true,force:true});}}
test('all declared facts linked',()=>withFixture(async f=>{const r=await auditEvidenceChainRelease(f);assert.equal(r.status,'READY_FOR_HUMAN_REVIEW');assert.equal(r.verifiedCount,1);}));
test('missing critical fact is incomplete',()=>withFixture(async f=>{f.requiredFacts.push({id:'profit',reason:'material',reviewer:'editor'});const r=await auditEvidenceChainRelease(f);assert.equal(r.status,'INCOMPLETE');assert.ok(r.findings.some(x=>x.code==='CRITICAL_FACT_UNLINKED'));}));
test('undeclared link requires inventory review',()=>withFixture(async f=>{f.links[0].factId='unknown';const r=await auditEvidenceChainRelease(f);assert.equal(r.status,'INCOMPLETE');assert.ok(r.findings.some(x=>x.code==='UNDECLARED_FACT_LINK'));}));
test('source tampering blocks release',()=>withFixture(async f=>{await writeFile(join(f.root,'filing.txt'),'changed');assert.equal((await auditEvidenceChainRelease(f)).status,'BLOCKED');}));
test('duplicate critical facts rejected',()=>withFixture(async f=>{f.requiredFacts.push({...f.requiredFacts[0]});await assert.rejects(auditEvidenceChainRelease(f),/Duplicate/);}));
test('empty critical inventory rejected',()=>withFixture(async f=>{f.requiredFacts=[];await assert.rejects(auditEvidenceChainRelease(f),/nonempty/);}));
test('reviewer and reason mandatory',()=>withFixture(async f=>{f.requiredFacts[0].reviewer='';await assert.rejects(auditEvidenceChainRelease(f),/required/);}));
test('report recomputation works',()=>withFixture(async f=>{const r=await auditEvidenceChainRelease(f);assert.equal((await verifyEvidenceChainRelease(f,r)).status,'REPORT_RECOMPUTED');}));
test('report tampering rejected',()=>withFixture(async f=>{const r=await auditEvidenceChainRelease(f);await assert.rejects(verifyEvidenceChainRelease(f,{...r,verifiedCount:20}),/mismatch/);}));
test('incorrect quote blocks',()=>withFixture(async f=>{f.links[0].quote='营收 200.25 亿元';assert.equal((await auditEvidenceChainRelease(f)).status,'BLOCKED');}));
