import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquireSource} from '../src/source-acquisition.js';
import {auditInferenceDependencies,verifyInferenceDependencies} from '../src/inference-dependency.js';
import {evaluateFinalGateWithDependencies} from '../src/dependency-release.js';
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'wbp66-'));const quote='联发科 2026Q3 合并 营收 100.25 亿元';
 const record=await acquireSource({root,entry:{id:'filing',path:'filing.txt',url:'https://reports.example.org/filing'},allowedHosts:['reports.example.org'],transport:async()=>({bytes:Buffer.from(quote),statusCode:200,contentType:'text/plain'}),clock:()=> '2026-11-20T00:00:00Z'});
 const fields={entity:'联发科',metric:'营收',value:'100.25',unit:'亿元',period:'2026Q3',condition:'合并'};
 const dimension=applicable=>({applicable,explanation:'scope declared'});
 const inf=id=>({id,claimId:'revenue',statement:'Statement '+id,evidenceRationale:'review required',negationScope:dimension(false),causalDirection:dimension(true),forecastConditions:dimension(false)});
 const rev=id=>({inferenceId:id,reviewer:'reviewer2',rationale:'manual check',decision:'APPROVE',negationScope:'NOT_APPLICABLE',causalDirection:'CHECKED',forecastConditions:'NOT_APPLICABLE'});
 return {root,records:[record],allowedHosts:['reports.example.org'],links:[{id:'link',recordId:'filing',factId:'revenue',quote,startByte:0,endByte:Buffer.byteLength(quote),reviewer:'editor',rationale:'source match'}],claims:[{id:'revenue',linkId:'link',fields:{...fields},evidenceFields:{...fields}}],reviews:[{claimId:'revenue',decision:'APPROVE',reviewer:'editor',rationale:'source checked'}],inferences:[inf('a'),inf('b')],inferenceReviews:[rev('a'),rev('b')],dependencies:[{inferenceId:'a',premises:[{type:'claim',id:'revenue'}]},{inferenceId:'b',premises:[{type:'inference',id:'a'}]}]};
}
async function run(fn){const f=await fixture();try{await fn(f);}finally{await rm(f.root,{recursive:true,force:true});}}
test('valid chain ready',()=>run(async f=>assert.equal((await auditInferenceDependencies(f)).status,'READY_FOR_HUMAN_REVIEW')));
test('missing dependency declaration incomplete',()=>run(async f=>{f.dependencies.pop();assert.equal((await auditInferenceDependencies(f)).status,'INCOMPLETE');}));
test('empty premises invalid',()=>run(async f=>{f.dependencies[0].premises=[];await assert.rejects(auditInferenceDependencies(f),/Invalid/);}));
test('unknown premise invalid',()=>run(async f=>{f.dependencies[0].premises[0].id='unknown';await assert.rejects(auditInferenceDependencies(f),/Unknown/);}));
test('duplicate dependency node invalid',()=>run(async f=>{f.dependencies.push(f.dependencies[0]);await assert.rejects(auditInferenceDependencies(f),/duplicate/);}));
test('duplicate premise invalid',()=>run(async f=>{f.dependencies[0].premises.push(f.dependencies[0].premises[0]);await assert.rejects(auditInferenceDependencies(f),/Duplicate premise/);}));
test('self-cycle invalid',()=>run(async f=>{f.dependencies[0].premises=[{type:'inference',id:'a'}];await assert.rejects(auditInferenceDependencies(f),/cycle/);}));
test('multi-node cycle invalid',()=>run(async f=>{f.dependencies[0].premises=[{type:'inference',id:'b'}];await assert.rejects(auditInferenceDependencies(f),/cycle/);}));
test('upstream pending propagates',()=>run(async f=>{f.inferenceReviews=f.inferenceReviews.filter(x=>x.inferenceId!=='a');const r=await auditInferenceDependencies(f);assert.ok(r.findings.some(x=>x.inferenceId==='b'&&x.code==='UPSTREAM_INFERENCE_NOT_READY'));}));
test('rejected inference blocks',()=>run(async f=>{f.inferenceReviews[0].decision='REJECT';assert.equal((await auditInferenceDependencies(f)).status,'BLOCKED');}));
test('tampered report rejected',()=>run(async f=>{const r=await auditInferenceDependencies(f);await assert.rejects(verifyInferenceDependencies(f,{...r,status:'BLOCKED'}),/mismatch/);}));
test('recompute report',()=>run(async f=>{const r=await auditInferenceDependencies(f);assert.equal((await verifyInferenceDependencies(f,r)).status,'REPORT_RECOMPUTED');}));
test('dependency gate retains baseline input requirements',async()=>{await assert.rejects(evaluateFinalGateWithDependencies({requireInferenceDependencies:true}),/Acceptance report/);});
test('dependency gate rejects invalid source binding',()=>run(async f=>{f.links[0].factId='wrong';const r=await auditInferenceDependencies(f);assert.equal(r.status,'BLOCKED');}));
