import {sourceDigest,sourceContains,sourceLocation} from './editorial-evidence-session.js';
import {sha256} from './core.js';
import {auditSourceGovernance} from './source-governance.js';
import {auditFinancialFacts} from './financial-facts.js';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const digest=x=>sha256(JSON.stringify(x));
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
function inspect(text,inventory,links,sources,side){
 if(!obj(inventory)||inventory.documentHash!==sha256(text)||!Array.isArray(inventory.facts))throw Error(`Invalid ${side} inventory`);
 if(!Array.isArray(links))throw Error(`Expected ${side} links`);
 const sourceMap=new Map(sources.map(s=>[s.id,s]));
 const factMap=new Map(inventory.facts.map(f=>[f.id,f]));
 const seen=new Set(),bound=[],pending=[],conflicts=[];
 for(const link of links){
  if(!obj(link)||!nonempty(link.factId)||seen.has(link.factId)||!nonempty(link.sourceId)||!nonempty(link.quote)||!nonempty(link.reviewer)||!nonempty(link.rationale))throw Error(`Invalid or duplicate ${side} link`);
  seen.add(link.factId);
  const fact=factMap.get(link.factId),source=sourceMap.get(link.sourceId);
  if(!fact)throw Error(`Unknown ${side} fact`);
  if(!source)throw Error(`Unknown ${side} source`);
  if(sourceLocation(source.text,link.quote).nonOverlapping!==1)throw Error(`Evidence quote must occur exactly once in ${side} source`);
  if(!link.quote.includes(fact.tuple.value.trim()))conflicts.push({factId:link.factId,reason:'EVIDENCE_EXCERPT_MISSING_LITERAL_VALUE'});
  else {const start=sourceLocation(source.text,link.quote).first;bound.push({factId:link.factId,sourceId:link.sourceId,sourceHash:sourceDigest(source.text),quoteHash:sha256(link.quote),startByte:Buffer.byteLength(source.text.slice(0,start)),endByte:Buffer.byteLength(source.text.slice(0,start+link.quote.length))});}
 }
 for(const fact of inventory.facts)if(!seen.has(fact.id))pending.push(fact.id);
 return {bound,pending,conflicts};
}
/** Evidence traceability only, not independent verification of the facts or sources. */
export function auditFactEvidence({before,after,beforeInventory,afterInventory,sources,beforeLinks=[],afterLinks=[],review=[],sourceGovernancePolicy=null}){
 const facts=auditFinancialFacts({before,after,beforeInventory,afterInventory,review});
 if(!obj(sources)||!Array.isArray(sources.sources))throw Error('Expected source bundle');
 const ids=new Set();
 for(const s of sources.sources){if(!obj(s)||!nonempty(s.id)||ids.has(s.id)||!nonempty(s.text)||!nonempty(s.uri))throw Error('Invalid or duplicate source');ids.add(s.id);}
 const left=inspect(before,beforeInventory,beforeLinks,sources.sources,'before');
 const right=inspect(after,afterInventory,afterLinks,sources.sources,'after');
 const blockers=[...left.conflicts.map(x=>`BEFORE_${x.reason}`),...right.conflicts.map(x=>`AFTER_${x.reason}`)];
 if(facts.status==='BLOCKED')blockers.push('FACT_REVIEW_REJECTED');
 const pending=[];
 if(left.pending.length||right.pending.length)pending.push('FACT_EVIDENCE_MISSING');
 if(facts.status==='INCOMPLETE')pending.push('FACT_REVIEW_INCOMPLETE');
 const governance=sourceGovernancePolicy===null?null:auditSourceGovernance({beforeInventory,afterInventory,sources,beforeLinks,afterLinks,policy:sourceGovernancePolicy});
 if(governance?.status==='BLOCKED')blockers.push('SOURCE_GOVERNANCE_BLOCKED');
 else if(governance?.status==='INCOMPLETE')pending.push('SOURCE_GOVERNANCE_INCOMPLETE');
 const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'5.5',status,beforeHash:sha256(before),afterHash:sha256(after),sourceBundleHash:digest(sources),beforeLinksHash:digest(beforeLinks),afterLinksHash:digest(afterLinks),factAuditHash:facts.reportHash,sourceGovernanceHash:governance?.reportHash??null,beforeEvidence:left,afterEvidence:right,blockers,pending,limitations:['Exact literal value in a source excerpt does not prove factual correctness','Source text and URI are editor supplied, not independently authenticated','A quote can omit material context or refer to a different period','Reviewer identity is not authenticated','Cross-sentence relationships are not semantically reconstructed']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyFactEvidence(inputs,report){const expected=auditFactEvidence(inputs);if(!obj(report)||JSON.stringify(expected)!==JSON.stringify(report))throw Error('Fact evidence report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
