import {sha256} from './core.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const str=x=>typeof x==='string'&&x.trim().length>0;
const digest=x=>sha256(JSON.stringify(x));
const kinds=new Set(['primary-filing','primary-official','secondary-report','editor-estimate']);
const date=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
function auditSide(inventory,links,map,side,policy){
 const findings=[];const seen=new Set();
 for(const link of links){
  const f=inventory.facts.find(x=>x.id===link.factId),s=map.get(link.sourceId);
  if(!f||!s)continue; // existing evidence audit handles invalid references
  const k=`${side}:${f.id}`;if(seen.has(k))continue;seen.add(k);
  const context={side,factId:f.id,sourceId:s.id};
  if(!str(s.kind)||!kinds.has(s.kind))findings.push({...context,code:'SOURCE_CLASSIFICATION_MISSING',level:'PENDING'});
  if(!str(s.version)||!str(s.retrievedAt)||!date(s.retrievedAt))findings.push({...context,code:'SOURCE_VERSION_METADATA_MISSING',level:'PENDING'});
  if(s.publishedAt!==undefined&&(!date(s.publishedAt)||date(s.retrievedAt)&&s.publishedAt>s.retrievedAt))findings.push({...context,code:'SOURCE_DATE_INVALID',level:'BLOCK'});
  if(s.supersedes!==undefined&&!str(s.supersedes))findings.push({...context,code:'INVALID_SUPERSEDES',level:'BLOCK'});
  if(s.period!==undefined&&!str(s.period))findings.push({...context,code:'INVALID_SOURCE_PERIOD',level:'BLOCK'});
  if(str(f.tuple.period)&&s.period!==f.tuple.period)findings.push({...context,code:'SOURCE_PERIOD_MISMATCH',level:'BLOCK',expected:f.tuple.period,actual:s.period??null});
  if(str(f.tuple.source)&&f.tuple.source!==s.id)findings.push({...context,code:'DECLARED_SOURCE_ID_MISMATCH',level:'BLOCK',expected:f.tuple.source,actual:s.id});
  if(policy.requirePrimary&&s.kind!=='primary-filing'&&s.kind!=='primary-official')findings.push({...context,code:'NON_PRIMARY_SOURCE',level:'PENDING'});
  if(s.kind==='editor-estimate'&&(!str(link.methodology)||!str(link.assumptions)))findings.push({...context,code:'ESTIMATE_METHODOLOGY_MISSING',level:'PENDING'});
  if(str(s.supersedes)&&!map.has(s.supersedes))findings.push({...context,code:'SUPERSEDED_SOURCE_NOT_IN_BUNDLE',level:'PENDING'});
 }
 return findings;
}
/** Checks editor-declared metadata and exact period/source linkage; never authenticates remote documents. */
export function auditSourceGovernance({beforeInventory,afterInventory,sources,beforeLinks=[],afterLinks=[],policy={}}){
 if(!obj(sources)||!Array.isArray(sources.sources)||!obj(beforeInventory)||!obj(afterInventory)||!Array.isArray(beforeInventory.facts)||!Array.isArray(afterInventory.facts)||!Array.isArray(beforeLinks)||!Array.isArray(afterLinks)||!obj(policy)||Object.keys(policy).some(x=>x!=='requirePrimary')||(policy.requirePrimary!==undefined&&typeof policy.requirePrimary!=='boolean'))throw Error('Invalid source governance inputs');
 const map=new Map();
 for(const s of sources.sources){if(!obj(s)||!str(s.id)||map.has(s.id))throw Error('Invalid or duplicate source ID');map.set(s.id,s);}
 const findings=[...auditSide(beforeInventory,beforeLinks,map,'before',policy),...auditSide(afterInventory,afterLinks,map,'after',policy)];
 // Multiple versions of one document must have distinct IDs and explicit supersession metadata.
 for(const s of sources.sources){if(str(s.supersedes)&&s.supersedes===s.id)findings.push({side:'bundle',sourceId:s.id,code:'SELF_SUPERSESSION',level:'BLOCK'});}
 const blockers=findings.filter(f=>f.level==='BLOCK');const pending=findings.filter(f=>f.level==='PENDING');
 const payload={schemaVersion:'5.5',status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW',inputHash:digest({beforeInventory,afterInventory,sources,beforeLinks,afterLinks,policy}),findings,blockers: blockers.length,pending:pending.length,limitations:['Source classifications and metadata are supplied by editors, not authenticated','Exact period equality is conservative; aliases and fiscal calendars require human review','A source excerpt containing a number does not prove that the source supports the claim','Source version fields do not prove that the document is the latest available']};
 return {...payload,reportHash:digest(payload)};
}
export function verifySourceGovernance(inputs,report){const expected=auditSourceGovernance(inputs);if(!obj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Source governance report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
