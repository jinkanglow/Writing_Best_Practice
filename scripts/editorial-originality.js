#!/usr/bin/env node
import fs from 'node:fs';
import {auditOriginality,verifyOriginality} from '../src/editorial-originality.js';
const [cmd,...args]=process.argv.slice(2);const opt=k=>{const i=args.indexOf('--'+k);return i<0?null:args[i+1];};const read=f=>fs.readFileSync(f,'utf8');
try{if(!['audit','verify'].includes(cmd)||!opt('file'))throw Error('Usage: audit|verify --file draft.md [--sources sources.json] [--output report.json | --report report.json]');const text=read(opt('file')),rules=JSON.parse(read(new URL('../rules/editorial-originality.json',import.meta.url))),sources=opt('sources')?JSON.parse(read(opt('sources'))):[];const result=cmd==='audit'?auditOriginality(text,rules,sources):verifyOriginality(text,rules,sources,JSON.parse(read(opt('report'))));if(opt('output'))fs.writeFileSync(opt('output'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));}catch(e){console.error(e.message);process.exitCode=2;}

