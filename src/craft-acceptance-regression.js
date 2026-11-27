import {sha256} from './core.js';
import {auditUnifiedRelease,verifyUnifiedRelease} from './craft-unified-release.js';
import {auditCIDiagnostics} from './craft-ci-diagnostics.js';
import {paragraphChangeMap} from './craft-repair-acceptance.js';
const hash=x=>sha256(JSON.stringify(x));
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const statuses=new Set(['BLOCKED','INCOMPLETE','READY_FOR_INDEPENDENT_RELEASE_REVIEW']);
const kinds=new Set(['release','paragraph-impact']);
function validate(cases){
 if(!Array.isArray(cases)||cases.length===0||cases.length>500)throw Error('Expected 1-500 regression cases');
 const ids=new Set();
 for(const c of cases){
  if(!object(c)||typeof c.id!=='string'||!/^[a-z][a-z0-9_-]{2,79}$/.test(c.id)||ids.has(c.id)||!kinds.has(c.kind))throw Error('Invalid or duplicate regression case');
  ids.add(c.id);
  if(c.kind==='release'){
   if(!object(c.input)||typeof c.input.text!=='string'||!object(c.input.stages)||!Array.isArray(c.input.required)||!statuses.has(c.expect?.status))throw Error(`Invalid release case ${c.id}`);
   if(c.expect.codes!==undefined&&(!Array.isArray(c.expect.codes)||c.expect.codes.some(x=>typeof x!=='string')))throw Error(`Invalid expected codes ${c.id}`);
  }else if(typeof c.before!=='string'||typeof c.after!=='string'||!object(c.expect)||!Array.isArray(c.expect.changedOld)||!Array.isArray(c.expect.changedNew)||!Array.isArray(c.expect.affected))throw Error(`Invalid paragraph case ${c.id}`);
 }
}
function matches(a,b){return JSON.stringify(a)===JSON.stringify(b);}
export async function runAcceptanceRegression(cases){
 validate(cases);
 const results=[];
 for(const c of cases){
  const failures=[];let actual={};
  try{
   if(c.kind==='release'){
    const report=await auditUnifiedRelease(c.input);
    const diagnostic=await auditCIDiagnostics(c.input);
    const codes=[...new Set(diagnostic.items.map(x=>x.code))].sort();
    actual={status:report.status,codes,documentHash:report.documentHash,reportHash:report.reportHash};
    if(report.status!==c.expect.status)failures.push('STATUS_MISMATCH');
    if(c.expect.codes&&!matches(c.expect.codes.slice().sort(),codes))failures.push('DIAGNOSTIC_CODES_MISMATCH');
    if((await verifyUnifiedRelease(c.input,report)).status!=='REPORT_RECOMPUTED')failures.push('REPORT_RECOMPUTATION_FAILED');
    const repeated=await auditUnifiedRelease(c.input);
    if(!matches(report,repeated))failures.push('NONDETERMINISTIC_REPORT');
    // A changed document must not validate a stale report.
    const changed={...c.input,text:c.input.text+'\n\nRegression mutation marker.'};
    try{await verifyUnifiedRelease(changed,report);failures.push('STALE_REPORT_ACCEPTED');}catch(e){if(!/mismatch/i.test(String(e.message)))failures.push('UNEXPECTED_VERIFICATION_ERROR');}
   }else{
    const map=paragraphChangeMap(c.before,c.after);
    actual={changedOld:map.changedOld,changedNew:map.changedNew,affected:map.affected.map(x=>x.paragraph),beforeHash:sha256(c.before),afterHash:sha256(c.after)};
    for(const field of ['changedOld','changedNew','affected'])if(!matches(actual[field],c.expect[field]))failures.push(`${field.toUpperCase()}_MISMATCH`);
    if(!matches(map,paragraphChangeMap(c.before,c.after)))failures.push('NONDETERMINISTIC_MAP');
   }
  }catch(e){failures.push('EXECUTION_ERROR');actual={...actual,error:String(e.message)};}
  results.push({id:c.id,kind:c.kind,passed:failures.length===0,failures,actual});
 }
 const payload={schemaVersion:'8.8',suiteHash:hash(cases),total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,status:results.every(x=>x.passed)?'PASS':'FAIL',results,limitations:['Regression expectations are curated fixtures, not independent proof of editorial quality','Lexical paragraph matching does not detect unregistered semantic dependencies']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifyAcceptanceRegression(cases,report){const expected=await runAcceptanceRegression(cases);if(!matches(expected,report))throw Error('Regression report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
