#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {auditRepairAcceptance,verifyRepairAcceptance} from '../src/craft-repair-acceptance.js';
const args=process.argv.slice(2),command=args[0];
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
const json=async(k,fallback)=>get(k)?JSON.parse(await readFile(get(k),'utf8')):fallback;
try{
 if(!['audit','verify'].includes(command))throw Error('Expected audit or verify');
 for(const k of ['baseline','plan','decisions','file','before','manifest'])if(!get(k))throw Error(`Missing --${k}`);
 const manifest=await json('manifest');
 const currentInputs={text:await readFile(get('file'),'utf8'),before:null,profile:manifest.profile??'analytical-nonfiction',required:manifest.required,stages:manifest.stages};
 const input={baseline:await json('baseline'),plan:await json('plan'),decisions:await json('decisions'),currentInputs,before:await readFile(get('before'),'utf8'),links:await json('links',[]),checks:await json('checks',[]),file:get('file'),release:await json('release',null)};
 const result=command==='verify'?await verifyRepairAcceptance(input,await json('report')):await auditRepairAcceptance(input);
 if(get('output')){await mkdir(dirname(resolve(get('output'))),{recursive:true});await writeFile(get('output'),JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify({status:result.status,reportHash:result.reportHash,pending:result.pending}));
 if(command==='audit'&&result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;
}catch(e){console.error(`Repair acceptance failed: ${e.message}`);process.exitCode=2;}
