import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquireSource} from '../src/source-acquisition.js';
import {auditInferenceReview,verifyInferenceReview} from '../src/inference-review.js';
import {evaluateFinalGateWithInference} from '../src/inference-release.js';
const fields={entity:'联发科',metric:'营收',value:'100.25',unit:'亿元',period:'2026Q3',condition:'合并'};
async function fixture(){const root=await mkdtemp(join(tmpdir(),'wbp65-')),quote='联发科 2026Q3 合并 营收 100.25 亿元';const record=await acquireSource({root,entry:{id:'filing',path:'filing.txt',url:'https://reports.example.org/filing'},allowedHosts:['reports.example.org'],transport:async()=>({bytes:Buffer.from(quote),statusCode:200,contentType:'text/plain'}),clock:()=> '2026-11-20T00:00:00Z'});const dimension=applicable=>({applicable,explanation:'Explicit scope declaration'});return {root,records:[record],allowedHosts:['reports.example.org'],links:[{id:'link',recordId:'filing',factId:'revenue',quote,startByte:0,endByte:Buffer.byteLength(quote),reviewer:'editor',rationale:'source match'}],claims:[{id:'revenue',linkId:'link',fields:{...fields},evidenceFields:{...fields}}],reviews:[{claimId:'revenue',decision:'APPROVE',reviewer:'editor',rationale:'source checked'}],inferences:[{id:'inference1',claimId:'revenue',statement:'Revenue rose because of AI',evidenceRationale:'Need causal verification',negationScope:dimension(false),causalDirection:dimension(true),forecastConditions:dimension(false)}],inferenceReviews:[{inferenceId:'inference1',reviewer:'reviewer2',rationale:'Causal inference checked',decision:'APPROVE',negationScope:'NOT_APPLICABLE',causalDirection:'CHECKED',forecastConditions:'NOT_APPLICABLE'}]};}
async function run(fn){const f=await fixture();try{await fn(f);}finally{await rm(f.root,{recursive:true,force:true});}}
test('reviewed inference ready',()=>run(async f=>assert.equal((await auditInferenceReview(f)).status,'READY_FOR_HUMAN_REVIEW')));
test('missing review incomplete',()=>run(async f=>{f.inferenceReviews=[];assert.equal((await auditInferenceReview(f)).status,'INCOMPLETE');}));
test('rejected review blocks',()=>run(async f=>{f.inferenceReviews[0].decision='REJECT';assert.equal((await auditInferenceReview(f)).status,'BLOCKED');}));
test('unchecked causal direction incomplete',()=>run(async f=>{f.inferenceReviews[0].causalDirection='NOT_APPLICABLE';assert.ok((await auditInferenceReview(f)).findings.some(x=>x.code==='REVIEW_REQUIRED_CAUSALDIRECTION'));}));
test('wrong scope incomplete',()=>run(async f=>{f.inferenceReviews[0].negationScope='CHECKED';assert.equal((await auditInferenceReview(f)).status,'INCOMPLETE');}));
test('unreviewed claim incomplete',()=>run(async f=>{f.inferences=[];f.inferenceReviews=[];assert.ok((await auditInferenceReview(f)).findings.some(x=>x.code==='CLAIM_INFERENCE_INVENTORY_MISSING'));}));
test('unknown claim rejected',()=>run(async f=>{f.inferences[0].claimId='unknown';await assert.rejects(auditInferenceReview(f),/Invalid inference/);}));
test('duplicate inference rejected',()=>run(async f=>{f.inferences.push({...f.inferences[0]});await assert.rejects(auditInferenceReview(f),/Invalid inference/);}));
test('duplicate review rejected',()=>run(async f=>{f.inferenceReviews.push({...f.inferenceReviews[0]});await assert.rejects(auditInferenceReview(f),/duplicate/);}));
test('unknown review rejected',()=>run(async f=>{f.inferenceReviews[0].inferenceId='missing';await assert.rejects(auditInferenceReview(f),/unknown inference/);}));
test('tampered report rejected',()=>run(async f=>{const r=await auditInferenceReview(f);await assert.rejects(verifyInferenceReview(f,{...r,status:'BLOCKED'}),/mismatch/);}));
test('report recomputed',()=>run(async f=>{const r=await auditInferenceReview(f);assert.equal((await verifyInferenceReview(f,r)).status,'REPORT_RECOMPUTED');}));
test('source evidence mismatch blocks',()=>run(async f=>{f.links[0].factId='other';assert.equal((await auditInferenceReview(f)).status,'BLOCKED');}));
