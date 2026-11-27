import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {sha256} from './core.js';
import {executeIncrementalAudit} from './craft-incremental-executor.js';
import {auditUnifiedPipeline} from './craft-unified-pipeline.js';

const digest=x=>sha256(JSON.stringify(x));
const identical=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/** Reproducibility assurance is deliberately separate from the editorial release decision. */
export async function assureEditorialCI(inputs,{secret=randomBytes(48).toString('hex'),mutatedText=null}={}){
 const first=await executeIncrementalAudit(inputs,{secret,compareFull:true});
 const second=await executeIncrementalAudit(inputs,{secret,previous:first.cache,compareFull:true});
 const full=await auditUnifiedPipeline(inputs);
 if(!identical(first.pipeline,full)||!identical(second.pipeline,full))throw Error('Full/incremental parity failure');
 const expected=inputs.required.filter(x=>['workflow','evidence','coverage','coherence','structure'].includes(x));
 if(!identical(second.reused,expected))throw Error('Unchanged stages were not reused');
 const changed=mutatedText??`${inputs.text}\n\n[CI mutation probe]`;
 if(changed===inputs.text)throw Error('Mutation probe must change document');
 const mutation=await executeIncrementalAudit({...inputs,text:changed},{secret,previous:second.cache,compareFull:true});
 if(mutation.reused.length!==0)throw Error('Changed document reused stale cache');
 const wrongKey=await executeIncrementalAudit(inputs,{secret:randomBytes(48).toString('hex'),previous:second.cache,compareFull:true});
 if(wrongKey.reused.length!==0)throw Error('Unauthenticated cache was reused');
 const payload={schemaVersion:'8.4',documentHash:sha256(inputs.text),manifestHash:digest({profile:inputs.profile??'analytical-nonfiction',required:inputs.required,stages:inputs.stages}),fullReportHash:full.reportHash,decision:full.status,checks:{fullParity:true,cacheReuse:true,documentInvalidation:true,wrongKeyInvalidation:true},firstExecuted:first.executed,secondReused:second.reused,mutationExecuted:mutation.executed,wrongKeyExecuted:wrongKey.executed,releaseAuthority:'INDEPENDENT_FULL_RELEASE_REVIEW_REQUIRED'};
 return {...payload,evidenceHash:digest(payload)};
}
export async function verifyEditorialCIAssurance(inputs,report){
 const expected=await assureEditorialCI(inputs);
 if(!identical(expected,report))throw Error('CI assurance evidence mismatch');
 return {status:'REPORT_RECOMPUTED',evidenceHash:expected.evidenceHash};
}
export async function runEditorialCIAssurance({file,manifest,before=null,output}){
 const text=await readFile(file,'utf8');
 const config=JSON.parse(await readFile(manifest,'utf8'));
 const inputs={text,before:before?await readFile(before,'utf8'):null,profile:config.profile??'analytical-nonfiction',required:config.required,stages:config.stages};
 const evidence=await assureEditorialCI(inputs);
 if(output){await mkdir(dirname(resolve(output)),{recursive:true});await writeFile(output,JSON.stringify(evidence,null,2)+'\n');}
 return evidence;
}
