import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquireSource} from '../src/source-acquisition.js';
import {auditAcquisitionEvidenceChain,verifyAcquisitionEvidenceChain} from '../src/acquisition-evidence-chain.js';
const host=['reports.example.org'];
async function fixture(){const root=await mkdtemp(join(tmpdir(),'wbp62-'));const bytes=Buffer.from('公司收入 100.25 亿元\n','utf8');const record=await acquireSource({root,entry:{id:'filing',path:'filing.txt',url:'https://reports.example.org/filing'},allowedHosts:host,transport:async()=>({bytes,statusCode:200,contentType:'text/plain'}),clock:()=> '2026-11-20T00:00:00Z'});const quote='收入 100.25 亿元';const startByte=bytes.indexOf(Buffer.from(quote));const link={id:'link1',recordId:'filing',factId:'revenue',quote,startByte,endByte:startByte+Buffer.byteLength(quote),literalValue:'100.25',reviewer:'editor1',rationale:'exact source excerpt'};return {root,records:[record],allowedHosts:host,links:[link]};}
async function withFixture(fn){const f=await fixture();try{await fn(f);}finally{await rm(f.root,{recursive:true,force:true});}}
test('valid UTF-8 byte-bound chain',()=>withFixture(async f=>{const r=await auditAcquisitionEvidenceChain(f);assert.equal(r.status,'READY_FOR_HUMAN_REVIEW');assert.ok(r.bindings[0].startByte>3);}));
test('independent report verification',()=>withFixture(async f=>{const r=await auditAcquisitionEvidenceChain(f);assert.equal((await verifyAcquisitionEvidenceChain(f,r)).status,'REPORT_RECOMPUTED');}));
test('tampered report rejected',()=>withFixture(async f=>{const r=await auditAcquisitionEvidenceChain(f);await assert.rejects(verifyAcquisitionEvidenceChain(f,{...r,status:'BLOCKED'}),/mismatch/);}));
test('changed source bytes block chain',()=>withFixture(async f=>{await writeFile(join(f.root,'filing.txt'),'different');const r=await auditAcquisitionEvidenceChain(f);assert.equal(r.status,'BLOCKED');assert.equal(r.findings[0].code,'ACQUISITION_VERIFICATION_FAILED');}));
test('incorrect byte offset blocked',()=>withFixture(async f=>{f.links[0].startByte++;const r=await auditAcquisitionEvidenceChain(f);assert.equal(r.findings[0].code,'EVIDENCE_SPAN_MISMATCH');}));
test('incorrect quoted value blocked',()=>withFixture(async f=>{f.links[0].literalValue='200.25';const r=await auditAcquisitionEvidenceChain(f);assert.equal(r.findings[0].code,'FACT_VALUE_NOT_IN_EXCERPT');}));
test('unknown record rejected',()=>withFixture(async f=>{f.links[0].recordId='unknown';await assert.rejects(auditAcquisitionEvidenceChain(f),/Unknown acquisition/);}));
test('duplicate link rejected',()=>withFixture(async f=>{f.links.push({...f.links[0]});await assert.rejects(auditAcquisitionEvidenceChain(f),/duplicate/);}));
test('duplicate acquisition record rejected',()=>withFixture(async f=>{f.records.push({...f.records[0]});await assert.rejects(auditAcquisitionEvidenceChain(f),/Duplicate/);}));
test('span outside file blocked',()=>withFixture(async f=>{f.links[0].endByte=10000;const r=await auditAcquisitionEvidenceChain(f);assert.equal(r.findings[0].code,'EVIDENCE_SPAN_OUT_OF_RANGE');}));
test('missing reviewer rejected',()=>withFixture(async f=>{f.links[0].reviewer='';await assert.rejects(auditAcquisitionEvidenceChain(f),/Invalid/);}));
test('unallowlisted acquisition blocked',()=>withFixture(async f=>{f.allowedHosts=['another.example.org'];const r=await auditAcquisitionEvidenceChain(f);assert.equal(r.status,'BLOCKED');}));
