#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {prepareRepairPlan,auditRepair,verifyRepair} from '../src/craft-repair.js';
const args=process.argv.slice(2),command=args[0];
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
const json=async k=>JSON.parse(await readFile(get(k),'utf8'));
const save=async data=>{const dest=get('output');if(dest){await mkdir(dirname(resolve(dest)),{recursive:true});await writeFile(dest,JSON.stringify(data,null,2)+'\n');}console.log(JSON.stringify({status:data.status??'PLAN_READY',tasks:data.tasks?.length,reportHash:data.reportHash??data.planHash}));};
try{
 if(!['prepare','audit','verify'].includes(command))throw Error('Expected prepare, audit or verify');
 const baseline=await json('baseline');
 if(command==='prepare')await save(prepareRepairPlan(baseline));
 else {
  const manifest=await json('manifest');
  const input={baseline,plan:await json('plan'),decisions:await json('decisions'),file:get('file'),currentInputs:{text:await readFile(get('file'),'utf8'),before:get('before')?await readFile(get('before'),'utf8'):null,profile:manifest.profile??'analytical-nonfiction',required:manifest.required,stages:manifest.stages}};
  if(command==='verify'){await save(await verifyRepair(input,await json('report')));}
  else{const result=await auditRepair(input);await save(result);if(result.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=result.status==='BLOCKED'?1:4;}
 }
}catch(e){console.error(`Editorial repair failed: ${e.message}`);process.exitCode=2;}
