import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {sha256} from './core.js';
import {auditEvidenceBound} from './craft-evidence-bound.js';
import {verifyAcquiredSource} from './source-acquisition.js';
const hash=x=>sha256(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const inside=(base,target)=>{const r=relative(base,target);return r!== '..'&&!r.startsWith('../')&&!r.startsWith('..\\')&&!isAbsolute(r);};
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
/** Verify source bytes against pinned hashes and literal excerpts. Does not establish publisher authenticity. */
export async function auditCraftSourceProvenance({text,plan,records,root,manifest,acquisitions=[],allowedHosts=[]}){
 const evidence=auditEvidenceBound(text,plan,records);
 if(!Array.isArray(manifest)||!Array.isArray(acquisitions)||!Array.isArray(allowedHosts)||typeof root!=='string'||!root.trim())throw Error('Expected root, manifest and acquisition arrays');
 const base=await realpath(resolve(root));const ids=new Set(),sources=new Map(),issues=[],pending=[],rows=[];
 for(const m of manifest){
  if(!m||typeof m.id!=='string'||!m.id||typeof m.path!=='string'||!m.path||!hex(m.sha256)||ids.has(m.id))throw Error('Invalid or duplicate pinned source');
  ids.add(m.id);sources.set(m.id,m);
 }
 const acquisitionIds=new Set();
 for(const a of acquisitions){if(!a||typeof a.id!=='string'||acquisitionIds.has(a.id))throw Error('Invalid or duplicate acquisition');acquisitionIds.add(a.id);}
 for(const s of records.sources){
  const m=sources.get(s.id);if(!m){pending.push({code:'SOURCE_NOT_PINNED',sourceId:s.id});continue;}
  if(isAbsolute(m.path)||m.path.includes('\\')||m.path.split('/').some(x=>x==='..'||x==='.'||!x)){issues.push({code:'UNSAFE_SOURCE_PATH',sourceId:s.id});continue;}
  const target=resolve(base,m.path);if(!inside(base,target)){issues.push({code:'UNSAFE_SOURCE_PATH',sourceId:s.id});continue;}
  let data;
  try{const real=await realpath(target);if(!inside(base,real)||!(await stat(real)).isFile())throw Error('Unsafe file');data=await readFile(real);}catch{issues.push({code:'SOURCE_UNREADABLE',sourceId:s.id});continue;}
  const actual=sha256(data);if(actual!==m.sha256)issues.push({code:'SOURCE_BYTES_CHANGED',sourceId:s.id});
  const decoded=new TextDecoder('utf-8',{fatal:true});let content;
  try{content=decoded.decode(data);}catch{issues.push({code:'SOURCE_NOT_UTF8',sourceId:s.id});continue;}
  if(!content.includes(s.excerpt))issues.push({code:'EXCERPT_NOT_IN_PINNED_BYTES',sourceId:s.id});
  const acquisition=acquisitions.find(a=>a.id===s.id);
  if(acquisition){
   if(acquisition.path!==m.path||acquisition.sha256!==m.sha256)issues.push({code:'ACQUISITION_PIN_MISMATCH',sourceId:s.id});
   else try{await verifyAcquiredSource({root:base,record:acquisition,allowedHosts});}catch{issues.push({code:'ACQUISITION_VERIFICATION_FAILED',sourceId:s.id});}
  }
  rows.push({sourceId:s.id,path:m.path,pinnedSha256:m.sha256,actualSha256:actual,bytes:data.length,acquisitionVerified:!!acquisition&&!issues.some(i=>i.sourceId===s.id)});
 }
 for(const m of manifest)if(!records.sources.some(s=>s.id===m.id))pending.push({code:'UNUSED_PIN',sourceId:m.id});
 const status=evidence.status==='BLOCKED'||issues.length?'BLOCKED':evidence.status==='INCOMPLETE'||pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'7.7',documentHash:sha256(text),planHash:hash(plan),recordsHash:hash(records),manifestHash:hash(manifest),acquisitionsHash:hash(acquisitions),evidenceReportHash:evidence.reportHash,status,issues,pending,rows,limitations:['Local hashes and excerpt presence prove byte consistency only, not publisher identity or truth','PDF and binary source extraction is not performed; use a separately pinned UTF-8 extract','Unregistered dependencies and outdated but unchanged sources are not detected']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyCraftSourceProvenance(inputs,report){const expected=await auditCraftSourceProvenance(inputs);if(!same(expected,report))throw Error('Source provenance report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
