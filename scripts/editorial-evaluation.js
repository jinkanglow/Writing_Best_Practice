#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {runEvaluationProtocol,verifyEvaluationProtocol} from '../src/craft-evaluation-protocol.js';
const args=process.argv.slice(2),cmd=args[0];
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
try{
 if(!['run','verify'].includes(cmd)||!get('dataset')||!get('protocol')||(cmd==='verify'&&!get('report')))throw Error('Usage: editorial-evaluation.js run|verify --dataset data.json --protocol protocol.json [--report report.json] [--output result.json]');
 const dataset=JSON.parse(await readFile(get('dataset'),'utf8'));
 const protocol=JSON.parse(await readFile(get('protocol'),'utf8'));
 const result=cmd==='run'?await runEvaluationProtocol(protocol,dataset):await verifyEvaluationProtocol(protocol,dataset,JSON.parse(await readFile(get('report'),'utf8')));
 if(get('output')){await mkdir(dirname(resolve(get('output'))),{recursive:true});await writeFile(get('output'),JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify(cmd==='run'?{status:result.status,holdout:result.holdout,failures:result.failures,reportHash:result.reportHash}:result));
 if(cmd==='run'&&result.status!=='THRESHOLDS_MET')process.exitCode=4;
}catch(e){console.error(`Editorial evaluation failed: ${e.message}`);process.exitCode=2;}
