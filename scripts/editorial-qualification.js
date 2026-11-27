#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {qualifyEditorialDataset,verifyEditorialDatasetQualification} from '../src/craft-dataset-qualification.js';
const [cmd,...args]=process.argv.slice(2);
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
const read=async(k,required=true)=>{if(!get(k)){if(required)throw Error(`Missing --${k}`);return null;}return JSON.parse(await readFile(get(k),'utf8'));};
try{
 const registry=await read('registry'),governance=await read('governance-policy'),bias=await read('bias-policy'),options=await read('decisions',false)??{};
 if(cmd==='audit'){
  if(!get('output'))throw Error('Missing --output');
  const report=qualifyEditorialDataset(registry,governance,bias,options);
  await mkdir(dirname(resolve(get('output'))),{recursive:true});await writeFile(get('output'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,blockers:report.blockers.length,reviewRequired:report.reviewRequired.length,reportHash:report.reportHash}));
  if(report.status!=='QUALIFIED')process.exitCode=4;
 }else if(cmd==='verify')console.log(JSON.stringify(verifyEditorialDatasetQualification(registry,governance,bias,await read('report'),options)));
 else throw Error('Usage: editorial-qualification.js audit|verify --registry FILE --governance-policy FILE --bias-policy FILE [--decisions FILE] --output/--report FILE');
}catch(e){console.error(`Dataset qualification failed: ${e.message}`);process.exitCode=2;}
