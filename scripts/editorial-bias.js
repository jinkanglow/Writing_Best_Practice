#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {auditAnnotationBias,verifyAnnotationBias} from '../src/craft-annotation-bias.js';
const [cmd,...args]=process.argv.slice(2);
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
const read=async k=>{if(!get(k))throw Error(`Missing --${k}`);return JSON.parse(await readFile(get(k),'utf8'));};
try{
 const registry=await read('registry'),policy=await read('policy');
 if(cmd==='audit'){
  const report=auditAnnotationBias(registry,policy);if(!get('output'))throw Error('Missing --output');
  await mkdir(dirname(resolve(get('output'))),{recursive:true});await writeFile(get('output'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,summary:report.summary,issues:report.issues}));if(report.status!=='READY_FOR_REVIEW')process.exitCode=4;
 }else if(cmd==='verify')console.log(JSON.stringify(verifyAnnotationBias(registry,policy,await read('report'))));
 else throw Error('Usage: editorial-bias.js audit|verify --registry file --policy file --output/--report file');
}catch(e){console.error(`Editorial bias audit failed: ${e.message}`);process.exitCode=2;}
