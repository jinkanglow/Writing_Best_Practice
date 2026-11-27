import {readFile, stat, realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, relative, isAbsolute} from 'node:path';
import {sha256} from './core.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const digest=x=>createHash('sha256').update(x).digest('hex');
const validHash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
/** Pin local source bytes. No fetching or authentication of publishers is implied. */
export async function auditSourceSnapshots({root,entries}){
 if(typeof root!=='string'||!root.trim()||!Array.isArray(entries)||!entries.length)throw Error('Expected root and nonempty entries');
 const base=resolve(root),ids=new Set(),paths=new Set(),findings=[],rows=[];
 for(const e of entries){
  if(!obj(e)||typeof e.id!=='string'||!e.id.trim()||typeof e.path!=='string'||!e.path.trim()||!validHash(e.expectedSha256))throw Error('Invalid snapshot entry');
  if(ids.has(e.id)||paths.has(e.path))throw Error('Duplicate source ID or path');ids.add(e.id);paths.add(e.path);
  const p=resolve(base,e.path),rel=relative(base,p);
  if(isAbsolute(e.path)||rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||isAbsolute(rel))throw Error('Source path must remain inside root');
  let actual=null,bytes=null;
  try{
   const realBase=await realpath(base),realFile=await realpath(p);const inside=relative(realBase,realFile);if(inside==='..'||inside.startsWith('../')||inside.startsWith('..\\')||isAbsolute(inside))throw Error('Symlink escapes root');const info=await stat(realFile);if(!info.isFile())throw Error('Not a regular file');
   const data=await readFile(realFile);bytes=data.length;actual=digest(data);
  }catch(error){findings.push({code:'SOURCE_UNREADABLE',level:'BLOCK',id:e.id,path:e.path});}
  if(actual!==null&&actual!==e.expectedSha256)findings.push({code:'SOURCE_BYTES_CHANGED',level:'BLOCK',id:e.id,path:e.path});
  rows.push({id:e.id,path:e.path,expectedSha256:e.expectedSha256,actualSha256:actual,bytes,match:actual===e.expectedSha256});
 }
 const payload={schemaVersion:'6.0',manifestHash:sha256(JSON.stringify(entries)),status:findings.length?'BLOCKED':'READY_FOR_HUMAN_REVIEW',findings,rows,limitations:['Local file hashes prove byte consistency, not publisher identity or document authenticity','No remote fetching, signature validation, OCR or semantic fact verification']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export async function verifySourceSnapshots(inputs,report){const expected=await auditSourceSnapshots(inputs);if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Snapshot report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
