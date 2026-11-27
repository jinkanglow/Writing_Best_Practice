import {sha256} from './core.js';
import {auditUnifiedPipeline} from './craft-unified-pipeline.js';
const hash=x=>sha256(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const stages=new Set(['workflow','evidence','coverage','coherence','structure']);
const guidance={STAGE_INPUT_MISSING:'Supply the required stage input in the editorial manifest.',STAGE_NOT_READY:'Complete the stage review and rerun the audit.',STAGE_BLOCKED:'Inspect the stage report and correct the blocked review.',INVALID_STAGE_INPUT:'Correct invalid stage data or mismatched document/version.',PREREQUISITE_NOT_READY:'Complete the prerequisite stage first.',NO_REQUIRED_STAGES:'Specify the editorial stages required for this document.'};
const clean=x=>String(x??'').replace(/[\r\n\t]+/g,' ').slice(0,500);
export function diagnosticFromPipeline(report,{file='article.md'}={}){
 if(!report||!Array.isArray(report.blockers)||!Array.isArray(report.pending)||!report.results)throw Error('Invalid pipeline report');
 const items=[];
 for(const [severity,entries] of [['error',report.blockers],['warning',report.pending]])for(const entry of entries){
  const stage=stages.has(entry.stage)?entry.stage:null;
  const detail=clean(entry.detail??entry.status??entry.dependency??'');
  items.push({severity,stage,code:entry.code,message:detail?`${entry.code}: ${detail}`:entry.code,action:guidance[entry.code]??'Inspect the detailed stage report and supply supporting editorial evidence.',location:{file},source:'pipeline'});
 }
 for(const [stage,result] of Object.entries(report.results)){
  if(!stages.has(stage)||!result||!Array.isArray(result.issues))continue;
  for(const issue of result.issues){
   const code=clean(typeof issue==='string'?issue:issue.code??'STAGE_ISSUE');
   items.push({severity:'warning',stage,code,message:clean(typeof issue==='string'?issue:issue.message??issue.detail??code),action:'Inspect the corresponding stage report and review the cited text.',location:{file},source:'stage-issue'});
  }
 }
 const payload={schemaVersion:'8.5',documentHash:report.documentHash,pipelineHash:report.reportHash,status:report.status,items,counts:{errors:items.filter(x=>x.severity==='error').length,warnings:items.filter(x=>x.severity==='warning').length},limitations:['Locations are document-level unless the upstream audit supplies verified spans','Diagnostics do not establish factual truth or authorize publication']};
 return {...payload,reportHash:hash(payload)};
}
export async function auditCIDiagnostics(inputs,{file='article.md'}={}){return diagnosticFromPipeline(await auditUnifiedPipeline(inputs),{file});}
export async function verifyCIDiagnostics(inputs,report,{file='article.md'}={}){const expected=await auditCIDiagnostics(inputs,{file});if(!same(expected,report))throw Error('CI diagnostics report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
const escapeCommand=s=>clean(s).replace(/%/g,'%25').replace(/:/g,'%3A').replace(/,/g,'%2C');
export function githubAnnotations(report){return report.items.map(item=>`::${item.severity} file=${escapeCommand(item.location.file)},title=${escapeCommand(item.stage??'editorial')}/${escapeCommand(item.code)}::${escapeCommand(item.message)} ${escapeCommand(item.action)}`).join('\n')+(report.items.length?'\n':'');}
export function diagnosticsMarkdown(report){const lines=['## Editorial diagnostics',`Status: **${report.status}**. ${report.counts.errors} errors; ${report.counts.warnings} warnings.`,''];if(!report.items.length)lines.push('No registered diagnostic items. This is not independent publication approval.');else for(const item of report.items)lines.push(`- **${item.severity.toUpperCase()}** ${item.stage??'release'} / ${item.code}: ${item.message}. ${item.action}`);return lines.join('\n')+'\n';}
