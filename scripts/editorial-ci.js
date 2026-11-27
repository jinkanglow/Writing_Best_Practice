#!/usr/bin/env node
import {runEditorialCIAssurance} from '../src/craft-ci-assurance.js';
const args=process.argv.slice(2);
const get=(key)=>{const i=args.indexOf(`--${key}`);return i<0?null:args[i+1];};
if(!get('file')||!get('manifest')){console.error('Usage: node scripts/editorial-ci.js --file article.md --manifest editorial.json [--before baseline.md] [--output evidence.json]');process.exit(2);}
try{
 const evidence=await runEditorialCIAssurance({file:get('file'),manifest:get('manifest'),before:get('before'),output:get('output')});
 console.log(JSON.stringify(evidence,null,2));
 if(evidence.decision!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')process.exitCode=evidence.decision==='BLOCKED'?1:4;
}catch(error){console.error(`Editorial CI assurance failed: ${error.message}`);process.exitCode=2;}
