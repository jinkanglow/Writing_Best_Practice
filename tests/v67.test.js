import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquireSource} from '../src/source-acquisition.js';
import {auditCounterarguments,verifyCounterarguments} from '../src/counterargument-review.js';
import {evaluateFinalGateWithCounterarguments} from '../src/counterargument-release.js';
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'wbp66-'));const quote='联发科 2026Q3 合并 营收 100.25 亿元';
 const record=await acquireSource({root,entry:{id:'filing',path:'filing.txt',url:'https://reports.example.org/filing'},allowedHosts:['reports.example.org'],transport:async()=>({bytes:Buffer.from(quote),statusCode:200,contentType:'text/plain'}),clock:()=> '2026-11-20T00:00:00Z'});
 const fields={entity:'联发科',metric:'营收',value:'100.25',unit:'亿元',period:'2026Q3',condition:'合并'};
 const dimension=applicable=>({applicable,explanation:'scope declared'});
 const inf=id=>({id,claimId:'revenue',statement:'Statement '+id,evidenceRationale:'review required',negationScope:dimension(false),causalDirection:dimension(true),forecastConditions:dimension(false)});
 const rev=id=>({inferenceId:id,reviewer:'reviewer2',rationale:'manual check',decision:'APPROVE',negationScope:'NOT_APPLICABLE',causalDirection:'CHECKED',forecastConditions:'NOT_APPLICABLE'});
 return {root,records:[record],allowedHosts:['reports.example.org'],links:[{id:'link',recordId:'filing',factId:'revenue',quote,startByte:0,endByte:Buffer.byteLength(quote),reviewer:'editor',rationale:'source match'}],claims:[{id:'revenue',linkId:'link',fields:{...fields},evidenceFields:{...fields}}],reviews:[{claimId:'revenue',decision:'APPROVE',reviewer:'editor',rationale:'source checked'}],inferences:[inf('a'),inf('b')],inferenceReviews:[rev('a'),rev('b')],counterarguments:['a','b'].map(inferenceId=>({inferenceId,alternatives:[{id:'alt',explanation:'Demand rather than price explains revenue',discriminatingEvidence:'Unit volume'}],falsifiers:[{id:'fals',condition:'Volume falls',observable:'Unit shipments',consequence:'Reject growth inference'}]})),counterargumentReviews:['a','b'].map(inferenceId=>({inferenceId,reviewer:'editor2',rationale:'considered competing explanation',decision:'APPROVE',alternativeReviews:[{id:'alt',decision:'CONSIDERED',rationale:'volume data reviewed'}],falsifierReviews:[{id:'fals',decision:'CONSIDERED',rationale:'shipment trend reviewed'}]})),dependencies:[{inferenceId:'a',premises:[{type:'claim',id:'revenue'}]},{inferenceId:'b',premises:[{type:'inference',id:'a'}]}]};
}
async function run(fn){const f=await fixture();try{await fn(f);}finally{await rm(f.root,{recursive:true,force:true});}}

test('complete review ready',()=>run(async f=>assert.equal((await auditCounterarguments(f)).status,'READY_FOR_HUMAN_REVIEW')));
test('missing declaration incomplete',()=>run(async f=>{f.counterarguments.pop();assert.equal((await auditCounterarguments(f)).status,'INCOMPLETE');}));
test('missing review incomplete',()=>run(async f=>{f.counterargumentReviews.pop();assert.equal((await auditCounterarguments(f)).status,'INCOMPLETE');}));
test('empty alternatives rejected',()=>run(async f=>{f.counterarguments[0].alternatives=[];await assert.rejects(auditCounterarguments(f),/Invalid/);}));
test('empty falsifiers rejected',()=>run(async f=>{f.counterarguments[0].falsifiers=[];await assert.rejects(auditCounterarguments(f),/Invalid/);}));
test('duplicate alternative rejected',()=>run(async f=>{f.counterarguments[0].alternatives.push(f.counterarguments[0].alternatives[0]);await assert.rejects(auditCounterarguments(f),/duplicate alternative/);}));
test('unknown inference rejected',()=>run(async f=>{f.counterarguments[0].inferenceId='unknown';await assert.rejects(auditCounterarguments(f),/Invalid/);}));
test('missing alternative review incomplete',()=>run(async f=>{f.counterargumentReviews[0].alternativeReviews=[];assert.equal((await auditCounterarguments(f)).status,'INCOMPLETE');}));
test('unresolved falsifier incomplete',()=>run(async f=>{f.counterargumentReviews[0].falsifierReviews[0].decision='UNRESOLVED';assert.equal((await auditCounterarguments(f)).status,'INCOMPLETE');}));
test('rejected review blocked',()=>run(async f=>{f.counterargumentReviews[0].decision='REJECT';assert.equal((await auditCounterarguments(f)).status,'BLOCKED');}));
test('rejected alternative blocked',()=>run(async f=>{f.counterargumentReviews[0].alternativeReviews[0].decision='REJECTED';assert.equal((await auditCounterarguments(f)).status,'BLOCKED');}));
test('upstream rejection propagates',()=>run(async f=>{f.inferenceReviews[0].decision='REJECT';assert.equal((await auditCounterarguments(f)).status,'BLOCKED');}));
test('report verification',()=>run(async f=>{const r=await auditCounterarguments(f);assert.equal((await verifyCounterarguments(f,r)).status,'REPORT_RECOMPUTED');}));
test('report tampering rejected',()=>run(async f=>{const r=await auditCounterarguments(f);await assert.rejects(verifyCounterarguments(f,{...r,status:'BLOCKED'}),/mismatch/);}));
test('gate retains baseline requirements',async()=>{await assert.rejects(evaluateFinalGateWithCounterarguments({requireCounterarguments:true}),/Acceptance report/);});
