import {createHash} from 'node:crypto';
const sha = s => createHash('sha256').update(s).digest('hex');
const object = x => x!==null && typeof x==='object' && !Array.isArray(x);
const kinds = new Set(['thesis','fact','causal_link','character_state']);
const decisions = new Set(['allow','reject']);

// A deterministic anchor audit. Textual presence is not semantic equivalence.
export function prepareRevisionAudit(before, after, anchors) {
  if(!Array.isArray(anchors))throw new Error('Anchors must be an array');
  const ids=new Set(), items=[];
  for(const a of anchors){
    if(!object(a)||typeof a.id!=='string'||!a.id.trim()||ids.has(a.id)||!kinds.has(a.kind)||typeof a.quote!=='string'||!a.quote||!before.includes(a.quote))throw new Error('Invalid, duplicate or ungrounded anchor');
    ids.add(a.id);
    const occurrences=before.split(a.quote).length-1;
    if(occurrences!==1)throw new Error(`Ambiguous original anchor: ${a.id}`);
    const present=after.includes(a.quote);
    items.push({id:a.id,kind:a.kind,quote:a.quote,originalOffset:Buffer.byteLength(before.slice(0,before.indexOf(a.quote)),'utf8'),status:present?'EXACT_PRESERVED':'REVIEW_REQUIRED'});
  }
  return {schemaVersion:'2.6',beforeHash:sha(before),afterHash:sha(after),status:items.some(i=>i.status==='REVIEW_REQUIRED')?'INCOMPLETE':'PASS',items,limitations:['Exact quote matching cannot prove semantic preservation','Missing quote does not imply meaning changed','Unlisted claims and implications are not checked']};
}

// Decisions are externally supplied and tied to both immutable text versions.
export function reviewRevisionAudit(before,after,anchors,reviews){
  const prepared=prepareRevisionAudit(before,after,anchors);
  if(!object(reviews)||reviews.schemaVersion!=='2.6'||reviews.beforeHash!==prepared.beforeHash||reviews.afterHash!==prepared.afterHash||!Array.isArray(reviews.decisions))throw new Error('Stale or invalid review envelope');
  const pending=new Map(prepared.items.filter(i=>i.status==='REVIEW_REQUIRED').map(i=>[i.id,i]));
  const seen=new Set(), findings=[];
  for(const d of reviews.decisions){
    if(!object(d)||!pending.has(d.id)||seen.has(d.id)||!decisions.has(d.decision)||typeof d.reviewer!=='string'||!d.reviewer.trim()||typeof d.rationale!=='string'||!d.rationale.trim())throw new Error('Invalid or duplicate review decision');
    seen.add(d.id);
    if(typeof d.revisedQuote!=='string'||!d.revisedQuote||!after.includes(d.revisedQuote))throw new Error('Review evidence not found in revised text');
    findings.push({id:d.id,status:d.decision==='allow'?'REVIEW_ALLOWED':'REVIEW_REJECTED',reviewer:d.reviewer,rationale:d.rationale,revisedQuote:d.revisedQuote});
  }
  for(const [id] of pending)if(!seen.has(id))findings.push({id,status:'REVIEW_REQUIRED'});
  const status=findings.some(x=>x.status==='REVIEW_REJECTED')?'BLOCKED':findings.some(x=>x.status==='REVIEW_REQUIRED')?'INCOMPLETE':'REVIEW_COMPLETE';
  return {...prepared,status,findings,limitations:[...prepared.limitations,'Reviewer decisions are self-declared and are not independent semantic verification']};
}
