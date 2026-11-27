#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {runAcceptanceRegression,verifyAcceptanceRegression} from '../src/craft-acceptance-regression.js';
const args=process.argv.slice(2),command=args[0];
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
try{
 if(!['run','verify'].includes(command)||!get('suite'))throw Error('Usage: editorial-regression.js run|verify --suite fixtures.json [--report report.json] [--output report.json]');
 const cases=JSON.parse(await readFile(get('suite'),'utf8'));
 const result=command==='run'?await runAcceptanceRegression(cases):await verifyAcceptanceRegression(cases,JSON.parse(await readFile(get('report'),'utf8')));
 if(get('output')){await mkdir(dirname(resolve(get('output'))),{recursive:true});await writeFile(get('output'),JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify({status:result.status,passed:result.passed,failed:result.failed,reportHash:result.reportHash}));
 if(command==='run'&&result.status!=='PASS')process.exitCode=1;
}catch(e){console.error(`Editorial regression failed: ${e.message}`);process.exitCode=2;}
