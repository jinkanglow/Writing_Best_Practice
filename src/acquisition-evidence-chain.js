import {readFile,realpath,lstat} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {sha256} from './core.js';
import {verifyAcquiredSource} from './source-acquisition.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const digest=b=>createHash('sha256').update(b).digest('hex');
const valid=x=>typeof x==='string'&&x.trim().length>0;
const within=(base,p)=>{const r=relative(base,p);return r!==''&&r!=='..'&&!r.startsWith('../')&&!r.startsWith('..\\')&&!isAbsolute(r);};
/** Verify an acquired byte stream, exact UTF-8 source spans and editor-declared fact links.
 * No semantic or publisher-authenticity claims are made. */
export async function auditAcquisitionEvidenceChain({root,records,allowedHosts,links}){
 if(!valid(root)||!Array.isArray(records)||!records.length||!Array.isArray(links)||!links.length)throw Error('Nonempty records, links and root required');
 const recordMap=new Map(),rows=[],findings=[],seenPaths=new Set();
 const base=await realpath(resolve(root));
 for(const record of records){
  if(!obj(record)||!valid(record.id)||recordMap.has(record.id)||seenPaths.has(record.path))throw Error('Duplicate or invalid acquisition record');
  recordMap.set(record.id,record);seenPaths.add(record.path);
  try{await verifyAcquiredSource({root,record,allowedHosts});rows.push({id:record.id,status:'BYTES_VERIFIED',sha256:record.sha256});}
  catch(e){findings.push({code:'ACQUISITION_VERIFICATION_FAILED',recordId:record.id,detail:String(e.message)});rows.push({id:record.id,status:'BLOCKED'});}
 }
 const seen=new Set(),bindings=[];
 for(const link of links){
  if(!obj(link)||!valid(link.id)||!valid(link.recordId)||!valid(link.factId)||!valid(link.quote)||!valid(link.reviewer)||!valid(link.rationale)||seen.has(link.id))throw Error('Invalid or duplicate evidence link');
  seen.add(link.id);
  if(!Number.isSafeInteger(link.startByte)||link.startByte<0||!Number.isSafeInteger(link.endByte)||link.endByte<=link.startByte)throw Error('Invalid evidence byte range');
  const record=recordMap.get(link.recordId);if(!record)throw Error('Unknown acquisition record');
  if(rows.find(r=>r.id===record.id).status!=='BYTES_VERIFIED'){findings.push({code:'UNVERIFIED_SOURCE_LINK',linkId:link.id});continue;}
  const target=resolve(base,record.path);if(!within(base,target))throw Error('Unsafe source path');
  const real=await realpath(target);if(!within(base,real))throw Error('Unsafe source symlink');
  const info=await lstat(real);if(!info.isFile())throw Error('Not a regular source file');
  const bytes=await readFile(real);if(digest(bytes)!==record.sha256)throw Error('Source changed during chain audit');
  if(link.endByte>bytes.length){findings.push({code:'EVIDENCE_SPAN_OUT_OF_RANGE',linkId:link.id});continue;}
  const excerpt=bytes.subarray(link.startByte,link.endByte);
  const decoded=excerpt.toString('utf8');
  if(decoded!==link.quote||!excerpt.equals(Buffer.from(link.quote,'utf8'))){findings.push({code:'EVIDENCE_SPAN_MISMATCH',linkId:link.id});continue;}
  if(valid(link.literalValue)&&!link.quote.includes(link.literalValue)){findings.push({code:'FACT_VALUE_NOT_IN_EXCERPT',linkId:link.id});continue;}
  bindings.push({id:link.id,recordId:link.recordId,factId:link.factId,startByte:link.startByte,endByte:link.endByte,quoteHash:sha256(link.quote),sourceSha256:record.sha256,reviewer:link.reviewer});
 }
 const payload={schemaVersion:'6.2',status:findings.length?'BLOCKED':'READY_FOR_HUMAN_REVIEW',recordsHash:sha256(JSON.stringify(records)),linksHash:sha256(JSON.stringify(links)),allowedHostsHash:sha256(JSON.stringify(allowedHosts)),rows,bindings,findings,limitations:['Local bytes and exact excerpts do not authenticate the publisher','Literal value matching does not establish the accounting meaning of an excerpt','Fact IDs and reviewers are editor supplied and not independently authenticated','Only provided evidence links are audited; completeness of all article claims is not established']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export async function verifyAcquisitionEvidenceChain(inputs,report){const expected=await auditAcquisitionEvidenceChain(inputs);if(!obj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Acquisition evidence chain report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
