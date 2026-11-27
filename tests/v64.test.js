import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquireSource} from '../src/source-acquisition.js';
import {auditClaimEvidenceReview,verifyClaimEvidenceReview} from '../src/claim-evidence-review.js';
const fields={entity:'联发科',metric:'营收',value:'100.25',unit:'亿元',period:'2026Q3',condition:'合并'};
async function fixture(){const root=await mkdtemp(join(tmpdir(),'wbp64-'));const quote='联发科 2026Q3 合并 营收 100.25 亿元';const bytes=Buffer.from(quote+'\n');const record=await acquireSource({root,entry:{id:'filing',path:'filing.txt',url:'https://reports.example.org/filing'},allowedHosts:['reports.example.org'],transport:async()=>({bytes,statusCode:200,contentType:'text/plain'}),clock:()=> '2026-11-20T00:00:00Z'});return {root,records:[record],allowedHosts:['reports.example.org'],links:[{id:'link1',recordId:'filing',factId:'revenue',quote,startByte:0,endByte:Buffer.byteLength(quote),reviewer:'editor',rationale:'exact source span'}],claims:[{id:'revenue',linkId:'link1',fields:{...fields},evidenceFields:{...fields}}],reviews:[{claimId:'revenue',decision:'APPROVE',reviewer:'editor',rationale:'checked against source context'}]};}
async function run(fn){const f=await fixture();try{await fn(f);}finally{await rm(f.root,{recursive:true,force:true});}}
test('complete review is ready for human review',()=>run(async f=>assert.equal((await auditClaimEvidenceReview(f)).status,'READY_FOR_HUMAN_REVIEW')));
test('no review remains incomplete',()=>run(async f=>{f.reviews=[];assert.equal((await auditClaimEvidenceReview(f)).status,'INCOMPLETE');}));
test('numeric change requires review',()=>run(async f=>{f.claims[0].fields.value='120.25';const r=await auditClaimEvidenceReview(f);assert.equal(r.status,'INCOMPLETE');assert.ok(r.findings.some(x=>x.code==='CLAIM_EVIDENCE_DIFFER_VALUE'));}));
test('period change requires review',()=>run(async f=>{f.claims[0].fields.period='2026Q2';assert.ok((await auditClaimEvidenceReview(f)).findings.some(x=>x.code==='CLAIM_EVIDENCE_DIFFER_PERIOD'));}));
test('unquoted evidence field is incomplete',()=>run(async f=>{f.claims[0].evidenceFields.unit='美元';assert.ok((await auditClaimEvidenceReview(f)).findings.some(x=>x.code==='EVIDENCE_FIELD_NOT_IN_EXCERPT_UNIT'));}));
test('rejected review blocks',()=>run(async f=>{f.reviews[0].decision='REJECT';assert.equal((await auditClaimEvidenceReview(f)).status,'BLOCKED');}));
test('tampered source blocks',()=>run(async f=>{await writeFile(join(f.root,'filing.txt'),'fake');assert.equal((await auditClaimEvidenceReview(f)).status,'BLOCKED');}));
test('mismatched fact binding blocks',()=>run(async f=>{f.links[0].factId='other';assert.equal((await auditClaimEvidenceReview(f)).status,'BLOCKED');}));
test('duplicate review rejected',()=>run(async f=>{f.reviews.push({...f.reviews[0]});await assert.rejects(auditClaimEvidenceReview(f),/duplicate/);}));
test('unknown review rejected',()=>run(async f=>{f.reviews[0].claimId='other';await assert.rejects(auditClaimEvidenceReview(f),/unknown/);}));
test('report recomputes',()=>run(async f=>{const r=await auditClaimEvidenceReview(f);assert.equal((await verifyClaimEvidenceReview(f,r)).status,'REPORT_RECOMPUTED');}));
test('report tampering rejected',()=>run(async f=>{const r=await auditClaimEvidenceReview(f);await assert.rejects(verifyClaimEvidenceReview(f,{...r,status:'BLOCKED'}),/mismatch/);}));
