import {createHash} from 'node:crypto';
import {prepareRevisionAudit} from './revision.js';
import {evaluateRevisionGate} from './release-gate.js';
const sha=x=>createHash('sha256').update(x).digest('hex');
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const kinds=new Set(['thesis','fact','causal_link','character_state']);
export function auditAnchorCoverage(before,anchors,inventory){
  prepareRevisionAudit(before,before,anchors);
  if(!Array.isArray(inventory)||!inventory.length)throw Error('Nonempty assertion inventory required');
  const seen=new Set(), items=inventory.map(item=>{
    if(!object(item)||typeof item.id!=='string'||!item.id.trim()||seen.has(item.id)||!kinds.has(item.kind)||typeof item.quote!=='string'||!item.quote||typeof item.anchorId!=='string')throw Error('Invalid or duplicate inventory item');
    seen.add(item.id);
    if(before.split(item.quote).length!==2)throw Error(`Inventory quote missing or ambiguous: ${item.id}`);
    const anchor=anchors.find(a=>a.id===item.anchorId);
    const covered=Boolean(anchor&&anchor.kind===item.kind&&anchor.quote.includes(item.quote));
    return {id:item.id,kind:item.kind,anchorId:item.anchorId,covered,reason:covered?'DECLARED_ANCHOR_MATCH':anchor?'ANCHOR_MISMATCH':'ANCHOR_MISSING'};
  });
  return {schemaVersion:'2.9',status:items.every(x=>x.covered)?'DECLARED_COVERAGE_COMPLETE':'INCOMPLETE',beforeHash:sha(before),inventoryHash:sha(JSON.stringify(inventory)),anchorHash:sha(JSON.stringify(anchors)),covered:items.filter(x=>x.covered).length,total:items.length,items,limitations:['Externally supplied inventory may omit important assertions','Exact mapping does not verify semantics or facts']};
}
export function buildReleaseEvidence(before,after,anchors,inventory,{review=null,contractReport=null}={}){
  const coverage=auditAnchorCoverage(before,anchors,inventory),gate=evaluateRevisionGate(before,after,anchors,{review,contractReport});
  const status=gate.status==='BLOCKED'?'BLOCKED':gate.status==='INCOMPLETE'||coverage.status==='INCOMPLETE'?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE';
  const payload={schemaVersion:'2.9',before,after,anchors,inventory,review,contractReport,coverage,gate,status};
  return {...payload,bundleHash:sha(JSON.stringify(payload)),limitations:['SHA-256 is not a signature','Reviewer identities are self-declared','Coverage depends on inventory completeness']};
}
export function verifyReleaseEvidence(bundle){
  if(!object(bundle)||bundle.schemaVersion!=='2.9'||typeof bundle.before!=='string'||typeof bundle.after!=='string'||!Array.isArray(bundle.anchors)||!Array.isArray(bundle.inventory)||typeof bundle.bundleHash!=='string')throw Error('Invalid release evidence bundle');
  const expected=buildReleaseEvidence(bundle.before,bundle.after,bundle.anchors,bundle.inventory,{review:bundle.review,contractReport:bundle.contractReport});
  if(JSON.stringify(expected)!==JSON.stringify(bundle))throw Error('Release evidence bundle integrity mismatch');
  return {status:'INTEGRITY_VERIFIED',bundleHash:expected.bundleHash,releaseStatus:expected.status,limitations:['Integrity does not prove authorship, factual accuracy or authorization']};
}
