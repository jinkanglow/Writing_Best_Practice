#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {auditCIDiagnostics,verifyCIDiagnostics,githubAnnotations,diagnosticsMarkdown} from '../src/craft-ci-diagnostics.js';
const args=process.argv.slice(2);
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
async function write(path,value){if(!path)return;await mkdir(dirname(resolve(path)),{recursive:true});await writeFile(path,value);}
try{
 const file=get('file'),manifest=get('manifest');if(!file||!manifest)throw Error('Expected --file and --manifest');
 const config=JSON.parse(await readFile(manifest,'utf8'));
 const inputs={text:await readFile(file,'utf8'),before:get('before')?await readFile(get('before'),'utf8'):null,profile:config.profile??'analytical-nonfiction',required:config.required,stages:config.stages};
 const report=await auditCIDiagnostics(inputs,{file});
 if(get('verify')){const previous=JSON.parse(await readFile(get('verify'),'utf8'));await verifyCIDiagnostics(inputs,previous,{file});}
 await write(get('output'),JSON.stringify(report,null,2)+'\n');
 await write(get('markdown'),diagnosticsMarkdown(report));
 if(get('github')==='true')process.stdout.write(githubAnnotations(report));
 else process.stdout.write(JSON.stringify({status:report.status,counts:report.counts,reportHash:report.reportHash})+'\n');
 if(report.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=report.status==='BLOCKED'?1:4;
}catch(e){console.error(`Editorial diagnostics failed: ${e.message}`);process.exitCode=2;}
