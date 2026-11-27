import {sha256} from './core.js';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const string=x=>typeof x==='string'&&x.trim().length>0;
const hash=x=>sha256(JSON.stringify(x));
const key=x=>JSON.stringify([x.entity,x.metric,x.period,x.unit,x.condition,x.accountingBasis??null,x.consolidationScope??null,x.measurementBasis??null]);
const baseKey=x=>JSON.stringify([x.entity,x.metric,x.period,x.unit,x.condition]);
const compare=(a,b)=>a.localeCompare(b,'en');
/** Checks declared version topology and contradictory source-backed observations; does not establish source truth. */
export function auditSourceConflicts({sources,observations=[],resolutions=[]}){
 if(!object(sources)||!Array.isArray(sources.sources)||!Array.isArray(observations)||!Array.isArray(resolutions))throw Error('Invalid source conflict inputs');
 const sourceMap=new Map();
 for(const s of sources.sources){if(!object(s)||!string(s.id)||sourceMap.has(s.id))throw Error('Invalid or duplicate source ID');sourceMap.set(s.id,s);}
 const findings=[];
 const push=(code,level,details)=>findings.push({code,level,...details});
 for(const s of sourceMap.values()){
  if(s.supersedes===undefined)continue;
  if(!string(s.supersedes)||s.supersedes===s.id){push('INVALID_VERSION_EDGE','BLOCK',{sourceId:s.id});continue;}
  if(!sourceMap.has(s.supersedes)){push('MISSING_VERSION_PARENT','PENDING',{sourceId:s.id,parentId:s.supersedes});continue;}
  const parent=sourceMap.get(s.supersedes);
  if(string(s.documentId)&&string(parent.documentId)&&s.documentId!==parent.documentId)push('CROSS_DOCUMENT_SUPERSESSION','BLOCK',{sourceId:s.id,parentId:parent.id});
  if(string(s.publishedAt)&&string(parent.publishedAt)&&s.publishedAt<parent.publishedAt)push('VERSION_CHRONOLOGY_CONFLICT','BLOCK',{sourceId:s.id,parentId:parent.id});
 }
 for(const s of sourceMap.values()){
  const visited=new Set();let cursor=s;
  while(cursor&&string(cursor.supersedes)&&sourceMap.has(cursor.supersedes)){
   if(visited.has(cursor.id)){push('VERSION_CYCLE','BLOCK',{sourceId:s.id});break;}
   visited.add(cursor.id);cursor=sourceMap.get(cursor.supersedes);
  }
 }
 const byId=new Map(),groups=new Map(),baseGroups=new Map();
 for(const o of observations){
  if(!object(o)||!string(o.id)||byId.has(o.id)||!string(o.sourceId)||!object(o.fact)||!['entity','metric','period','unit','condition','value'].every(f=>typeof o.fact[f]==='string'))throw Error('Invalid or duplicate observation');
  byId.set(o.id,o);
  if(!sourceMap.has(o.sourceId))push('OBSERVATION_SOURCE_MISSING','BLOCK',{observationId:o.id,sourceId:o.sourceId});
  const k=key(o.fact);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o);
  const bk=baseKey(o.fact);if(!baseGroups.has(bk))baseGroups.set(bk,[]);baseGroups.get(bk).push(o);
 }
 for(const items of baseGroups.values()){
  if(items.length<2)continue;
  for(const field of ['accountingBasis','consolidationScope','measurementBasis']){
   const declared=items.filter(o=>string(o.fact[field]));
   if(declared.length&&declared.length<items.length)push('SCOPE_METADATA_INCOMPLETE','PENDING',{field,observationIds:items.filter(o=>!string(o.fact[field])).map(o=>o.id).sort(compare)});
  }
 }
 const conflicts=[];
 for(const [k,items] of groups){
  const values=new Set(items.map(x=>x.fact.value));
  if(values.size<2)continue;
  const ids=items.map(x=>x.id).sort(compare);
  const conflictId=hash({key:k,ids});
  conflicts.push({id:conflictId,factKey:JSON.parse(k),observationIds:ids,values:[...values].sort(compare)});
 }
 conflicts.sort((a,b)=>compare(a.id,b.id));
 const resolutionsByConflict=new Map();
 for(const r of resolutions){
  if(!object(r)||!string(r.conflictId)||resolutionsByConflict.has(r.conflictId)||!['correction','methodology-change','unresolved'].includes(r.reason)||!string(r.reviewer)||!string(r.rationale))throw Error('Invalid or duplicate conflict resolution');
  resolutionsByConflict.set(r.conflictId,r);
 }
 const known=new Set(conflicts.map(x=>x.id));
 for(const r of resolutions)if(!known.has(r.conflictId))push('UNKNOWN_CONFLICT_RESOLUTION','BLOCK',{conflictId:r.conflictId});
 for(const c of conflicts){
  const r=resolutionsByConflict.get(c.id);
  if(!r||r.reason==='unresolved'){push('UNRESOLVED_SOURCE_CONFLICT','PENDING',{conflictId:c.id});continue;}
  if(!string(r.selectedObservationId)||!c.observationIds.includes(r.selectedObservationId)){push('INVALID_CONFLICT_SELECTION','BLOCK',{conflictId:c.id});continue;}
  const chosen=byId.get(r.selectedObservationId),source=sourceMap.get(chosen.sourceId);
  if(r.reason==='correction'){
   const others=c.observationIds.map(id=>byId.get(id)).filter(o=>o.id!==chosen.id);
   const related=others.some(o=>{let cursor=source,seen=new Set();while(cursor&&string(cursor.supersedes)&&!seen.has(cursor.id)){seen.add(cursor.id);if(cursor.supersedes===o.sourceId)return true;cursor=sourceMap.get(cursor.supersedes);}return false;});
   if(!related)push('CORRECTION_WITHOUT_VERSION_LINEAGE','BLOCK',{conflictId:c.id});
  }
  if(r.reason==='methodology-change'&&(!string(r.methodologyBefore)||!string(r.methodologyAfter)))push('METHODOLOGY_CHANGE_UNDOCUMENTED','PENDING',{conflictId:c.id});
 }
 const blockers=findings.filter(f=>f.level==='BLOCK').length,pending=findings.filter(f=>f.level==='PENDING').length;
 const payload={schemaVersion:'5.7',inputHash:hash({sources,observations,resolutions}),status:blockers?'BLOCKED':pending?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',conflicts,findings,blockers,pending,limitations:['Observations and version links are editor-supplied and not authenticated','Observations are grouped by exact entity, metric, period, unit, condition and optional accounting scope fields','Numeric values are compared as strings; no FX, scale, or accounting reconciliation','A reviewer resolution is a documented choice, not proof of correctness']};
 return {...payload,reportHash:hash(payload)};
}
export function verifySourceConflicts(inputs,report){const expected=auditSourceConflicts(inputs);if(!object(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Source conflict report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
