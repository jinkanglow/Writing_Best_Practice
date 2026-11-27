#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {addCase,reviewerPacket,recordAnnotation,recordAdjudication,collectionStatus,freezeCollection,verifyFrozenCollection} from '../src/craft-case-collection.js';
const [cmd,...args]=process.argv.slice(2);
const get=k=>{const i=args.indexOf(`--${k}`);return i<0?null:args[i+1];};
const read=async k=>JSON.parse(await readFile(get(k),'utf8'));
const write=async(k,v)=>{if(!get(k))throw Error(`Missing --${k}`);await mkdir(dirname(resolve(get(k))),{recursive:true});await writeFile(get(k),JSON.stringify(v,null,2)+'\n');};
try{
 let result;
 if(cmd==='init'){result={schemaVersion:'9.1',cases:[]};await write('output',result);}
 else if(cmd==='add'){result=addCase(await read('registry'),await read('case'));await write('output',result);}
 else if(cmd==='assignments'){result=reviewerPacket(await read('registry'),get('reviewer'));await write('output',result);}
 else if(cmd==='annotate'){result=recordAnnotation(await read('registry'),get('case-id'),await read('annotation'));await write('output',result);}
 else if(cmd==='adjudicate'){result=recordAdjudication(await read('registry'),get('case-id'),await read('decision'));await write('output',result);}
 else if(cmd==='status'){result=collectionStatus(await read('registry'));if(get('output'))await write('output',result);}
 else if(cmd==='freeze'){result=freezeCollection(await read('registry'),{frozenBy:get('reviewer'),frozenAt:get('at')});await write('output',result);}
 else if(cmd==='verify'){result=verifyFrozenCollection(await read('registry'),await read('frozen'));}
 else throw Error('Usage: editorial-cases.js init|add|assignments|annotate|adjudicate|status|freeze|verify --registry registry.json [--output result.json]');
 console.log(JSON.stringify(cmd==='assignments'?{reviewer:result.reviewer,pending:result.cases.length}:cmd==='freeze'?{freezeHash:result.freezeHash,total:result.dataset.cases.length}:cmd==='add'||cmd==='annotate'||cmd==='adjudicate'||cmd==='init'?{total:result.cases.length}:result));
}catch(e){console.error(`Editorial case collection failed: ${e.message}`);process.exitCode=2;}
