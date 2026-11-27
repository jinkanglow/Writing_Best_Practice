import {sha256} from './core.js';
import {prepareParagraphRevision} from './craft-paragraph.js';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const normalized=s=>s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
/** Conservative structural signals only: duplicates are lexical, transitions and dependencies require editorial declaration. */
export function auditStructureRegression(before,after,{profile='analytical-nonfiction',links=[],checks=[]}={}){
 if(typeof before!=='string'||typeof after!=='string')throw Error('Expected source documents');
 const original=prepareParagraphRevision(before,{profile});
 const revised=prepareParagraphRevision(after,{profile});
 if(!Array.isArray(links)||!Array.isArray(checks))throw Error('Expected editorial arrays');
 const ids=new Set(revised.paragraphs.map(p=>p.id));
 const seen=new Set(),issues=[];
 const byText=new Map();
 for(const p of revised.paragraphs){
  const n=normalized(p.text);
  if(n.length>=35){if(byText.has(n))issues.push({code:'DUPLICATE_PARAGRAPH_TEXT',paragraphId:p.id,relatedId:byText.get(n)});else byText.set(n,p.id);}
 }
 const edgeKeys=new Set();
 for(const edge of links){
  if(!edge||!ids.has(edge.from)||!ids.has(edge.to)||edge.from===edge.to||!['argument','evidence','conclusion','transition'].includes(edge.kind))throw Error('Invalid revised-document dependency');
  const key=`${edge.from}:${edge.to}:${edge.kind}`;if(edgeKeys.has(key))throw Error('Duplicate dependency');edgeKeys.add(key);
 }
 for(const check of checks){
  if(!check||!ids.has(check.id)||seen.has(check.id)||!['PASS','FAIL'].includes(check.decision)||typeof check.reviewer!=='string'||!check.reviewer.trim()||typeof check.rationale!=='string'||!check.rationale.trim()||check.afterHash!==sha256(after))throw Error('Invalid or stale structure review');
  seen.add(check.id);if(check.decision==='FAIL')issues.push({code:'EDITOR_REJECTED_STRUCTURE',paragraphId:check.id});
 }
 const pending=revised.paragraphs.filter(p=>!seen.has(p.id)).map(p=>p.id);
 const status=issues.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'7.4',beforeHash:sha256(before),afterHash:sha256(after),profile,originalParagraphCount:original.paragraphs.length,revisedParagraphCount:revised.paragraphs.length,linksHash:sha256(JSON.stringify(links)),checksHash:sha256(JSON.stringify(checks)),status,issues,pending,limitations:['Duplicate detection is exact after punctuation/whitespace normalization, not semantic similarity','Human checks cannot prove sound transitions or valid conclusions','Unregistered dependencies remain invisible']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export function verifyStructureRegression(before,after,options,report){const expected=auditStructureRegression(before,after,options);if(!same(expected,report))throw Error('Structure report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
