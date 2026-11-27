import {request} from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {createHash} from 'node:crypto';
import {mkdir,writeFile,readFile,realpath,lstat} from 'node:fs/promises';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {sha256} from './core.js';
const hash=b=>createHash('sha256').update(b).digest('hex');
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const inside=(base,target)=>{const r=relative(base,target);return r!==''&&r!=='..'&&!r.startsWith('../')&&!r.startsWith('..\\')&&!isAbsolute(r);};
const publicIP=ip=>{
 if(isIP(ip)===4){const a=ip.split('.').map(Number);return !(a[0]===0||a[0]===10||a[0]===127||a[0]>=224||a[0]===169&&a[1]===254||a[0]===172&&a[1]>=16&&a[1]<=31||a[0]===192&&a[1]===168||a[0]===100&&a[1]>=64&&a[1]<=127||a[0]===192&&a[1]===0||a[0]===198&&[18,19].includes(a[1])||a[0]===192&&a[1]===0&&a[2]===2||a[0]===198&&a[1]===51&&a[2]===100||a[0]===203&&a[1]===0&&a[2]===113);
 }
 if(isIP(ip)===6){const v=ip.toLowerCase();return !(v==='::'||v==='::1'||v.startsWith('fc')||v.startsWith('fd')||v.startsWith('fe8')||v.startsWith('fe9')||v.startsWith('fea')||v.startsWith('feb')||v.startsWith('ff')||v.startsWith('2001:db8:')||v.startsWith('::ffff:'));}
 return false;
};
export function validateAcquisitionEntry(entry,allowedHosts){
 if(!object(entry)||typeof entry.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(entry.id)||typeof entry.path!=='string'||!entry.path||typeof entry.url!=='string')throw Error('Invalid acquisition entry');
 if(!Array.isArray(allowedHosts)||!allowedHosts.length||allowedHosts.some(h=>typeof h!=='string'||!h||h!==h.toLowerCase()))throw Error('Explicit lowercase allowedHosts required');
 let u;try{u=new URL(entry.url);}catch{throw Error('Invalid source URL');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||!allowedHosts.includes(u.hostname)||isIP(u.hostname))throw Error('HTTPS host not allowlisted or URL unsafe');
 if(isAbsolute(entry.path)||entry.path.includes('\\')||entry.path.split('/').includes('..')||entry.path.split('/').includes('.')||entry.path.split('/').includes('')||entry.path.startsWith('/'))throw Error('Unsafe destination path');
 return u;
}
async function fetchPinned(u,{maxBytes,timeoutMs}){
 const addresses=await lookup(u.hostname,{all:true,verbatim:true});
 if(!addresses.length||addresses.some(a=>!publicIP(a.address)))throw Error('DNS returned unsafe or no addresses');
 const selected=addresses[0];
 return await new Promise((yes,no)=>{
  const req=request(u,{method:'GET',timeout:timeoutMs,lookup:(_host,_opts,cb)=>cb(null,selected.address,selected.family),headers:{'accept':'application/pdf,application/octet-stream,text/plain,text/html,application/json','user-agent':'WritingBestPractices-SourceAcquisition/6.1'}},res=>{
   if(res.statusCode!==200){res.resume();no(Error(`Unexpected HTTP status ${res.statusCode}; redirects are not followed`));return;}
   const parts=[];let total=0;
   res.on('data',chunk=>{total+=chunk.length;if(total>maxBytes){req.destroy(Error('Source exceeds byte limit'));return;}parts.push(chunk);});
   res.on('end',()=>yes({bytes:Buffer.concat(parts),contentType:String(res.headers['content-type']||''),statusCode:res.statusCode}));
   res.on('error',no);
  });
  req.on('timeout',()=>req.destroy(Error('Source fetch timeout')));req.on('error',no);req.end();
 });
}
/** Explicit allowlist and pinned public DNS address; no redirects or automatic trust assertion. */
export async function acquireSource({root,entry,allowedHosts,maxBytes=10_000_000,timeoutMs=15000,transport=fetchPinned,clock=()=>new Date().toISOString()}){
 const u=validateAcquisitionEntry(entry,allowedHosts);
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>100_000_000||!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>120000)throw Error('Invalid acquisition limits');
 const base=resolve(root),dest=resolve(base,entry.path);if(!inside(base,dest))throw Error('Unsafe destination');
 const realBase=await realpath(base);if(!inside(realBase,dest))throw Error('Destination escapes root');
 // Avoid symlink traversal in existing destination parents.
 let parent=dirname(dest);while(parent!==base){try{const s=await lstat(parent);if(s.isSymbolicLink())throw Error('Destination parent symlink');}catch(e){if(e.code!=='ENOENT')throw e;}parent=dirname(parent);}
 const result=await transport(u,{maxBytes,timeoutMs});
 if(!object(result)||!Buffer.isBuffer(result.bytes)||result.bytes.length>maxBytes||result.statusCode!==200)throw Error('Invalid source response');
 await mkdir(dirname(dest),{recursive:true});
 // Exclusive creation: never silently replace a previously pinned source.
 await writeFile(dest,result.bytes,{flag:'wx',mode:0o600});
 const record={schemaVersion:'6.1',id:entry.id,url:u.href,host:u.hostname,path:entry.path,sha256:hash(result.bytes),bytes:result.bytes.length,contentType:result.contentType||'',retrievedAt:clock(),httpStatus:200,verification:'BYTES_PINNED_ONLY',limitations:['Allowlist membership does not authenticate publisher identity','Remote content is not verified as an official filing','HTTP response and time are locally observed, not independently attested']};
 return {...record,recordHash:sha256(JSON.stringify(record))};
}
export async function verifyAcquiredSource({root,record,allowedHosts}){
 if(!object(record)||record.schemaVersion!=='6.1'||!Array.isArray(record.limitations)||!Number.isSafeInteger(record.bytes)||record.bytes<0||!/^[a-f0-9]{64}$/.test(record.sha256))throw Error('Invalid acquisition record');
 const {recordHash,...payload}=record;if(recordHash!==sha256(JSON.stringify(payload)))throw Error('Acquisition record tampered');
 const u=validateAcquisitionEntry({id:record.id,url:record.url,path:record.path},allowedHosts);if(record.host!==u.hostname||record.httpStatus!==200||record.verification!=='BYTES_PINNED_ONLY')throw Error('Invalid record provenance');
 const base=await realpath(resolve(root)),target=resolve(base,record.path);if(!inside(base,target))throw Error('Unsafe destination');
 const actual=await realpath(target);if(!inside(base,actual))throw Error('Source symlink escapes root');
 const bytes=await readFile(actual);if(bytes.length!==record.bytes||hash(bytes)!==record.sha256)throw Error('Acquired source bytes changed');
 return {status:'BYTES_VERIFIED',id:record.id,sha256:record.sha256,recordHash};
}
