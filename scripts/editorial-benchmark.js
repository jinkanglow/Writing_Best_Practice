#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {runEditorialBenchmark,verifyEditorialBenchmark} from '../src/craft-editorial-benchmark.js';
const args=process.argv.slice(2),command=args[0];
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
try{
 if(!['run','verify'].includes(command)||!get('dataset')||(command==='verify'&&!get('report')))throw Error('Usage: editorial-benchmark.js run|verify --dataset dataset.json [--report report.json] [--output result.json]');
 const dataset=JSON.parse(await readFile(get('dataset'),'utf8'));
 const result=command==='run'?await runEditorialBenchmark(dataset):await verifyEditorialBenchmark(dataset,JSON.parse(await readFile(get('report'),'utf8')));
 if(get('output')){await mkdir(dirname(resolve(get('output'))),{recursive:true});await writeFile(get('output'),JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify(command==='run'?{status:result.status,metrics:result.metrics,reportHash:result.reportHash}:result));
 if(command==='run'&&result.status==='INCOMPLETE')process.exitCode=4;
}catch(e){console.error(`Editorial benchmark failed: ${e.message}`);process.exitCode=2;}
