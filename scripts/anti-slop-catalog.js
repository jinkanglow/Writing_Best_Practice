#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {scanCatalog,verifyCatalogScan} from '../src/anti-slop-catalog-scan.js';
const args=process.argv.slice(2),cmd=args.shift();
const option=k=>{const i=args.indexOf('--'+k);return i<0?null:args[i+1];};
try{
 if(!['scan','verify'].includes(cmd))throw Error('Usage: anti-slop-catalog.js scan|verify --file draft.md [--catalog rules/anti-slop-catalog.json] [--profile fiction] [--output report.json | --report report.json]');
 const file=option('file');if(!file)throw Error('Missing --file');
 const text=fs.readFileSync(file,'utf8');
 const catalog=JSON.parse(fs.readFileSync(option('catalog')||path.resolve(import.meta.dirname,'../rules/anti-slop-catalog.json'),'utf8'));
 const options={profile:option('profile')||'analytical-nonfiction',strict:args.includes('--strict')};
 if(cmd==='scan'){
  const report=scanCatalog(text,catalog,options);
  if(option('output'))fs.writeFileSync(option('output'),JSON.stringify(report,null,2)+'\n');
  console.log(`${report.status} findings=${report.counts.total} context_review=${report.counts.contextReview}`);
 }else{
  if(!option('report'))throw Error('Missing --report');
  console.log(verifyCatalogScan(text,catalog,JSON.parse(fs.readFileSync(option('report'),'utf8')),options).status);
 }
}catch(e){console.error('ERROR:',e.message);process.exitCode=2;}
