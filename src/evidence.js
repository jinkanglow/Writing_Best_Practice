import {sourceContains} from './editorial-evidence-session.js';
import { parseMarkdownV17 } from './markdown.js';
import { createHash } from 'node:crypto';

const sha = text => createHash('sha256').update(text).digest('hex');
const statuses = new Set(['supported','contradicted','insufficient_evidence']);
const isObject = x => x && typeof x === 'object' && !Array.isArray(x);

export function prepareEvidenceReview(text, contract, {file='<input>'}={}) {
  if (!isObject(contract) || !Array.isArray(contract.requirements)) throw new Error('Invalid contract');
  const doc=parseMarkdownV17(text,file);
  const reviewable=contract.requirements.filter(r => r.check?.kind==='semantic_review');
  return {schemaVersion:'1.9',file,documentHash:doc.hash,contractHash:sha(JSON.stringify(contract)),status:reviewable.length?'PENDING':'NO_SEMANTIC_REQUIREMENTS',items:reviewable.map(r=>({id:r.id,requirement:r.value,scope:r.scope,decision:null,evidence:[],reviewer:null,notes:''})),limitations:['No automatic semantic inference or external verification','Evidence must reference exact source text in the current document','Review records are reviewer attestations, not proof of correctness']};
}

export function verifyEvidenceReview(text, contract, review, {file='<input>'}={}) {
  const doc=parseMarkdownV17(text,file);
  if (!isObject(review) || review.schemaVersion!=='1.9' || review.documentHash!==doc.hash || review.contractHash!==sha(JSON.stringify(contract)) || !Array.isArray(review.items)) throw new Error('Review does not match current document and contract');
  const required=contract.requirements.filter(r=>r.check?.kind==='semantic_review');
  const ids=new Set(),results=[];
  for(const item of review.items){
    if(!isObject(item)||typeof item.id!=='string'||ids.has(item.id)||!required.some(r=>r.id===item.id)) throw new Error('Unknown or duplicate review item');
    ids.add(item.id);
  }
  for(const r of required){
    const item=review.items.find(x=>x.id===r.id);
    if(!item || item.decision===null || item.decision===undefined){results.push({id:r.id,status:'NOT_VERIFIED',reason:'No reviewer decision'});continue;}
    if(!statuses.has(item.decision))throw new Error(`Invalid decision: ${r.id}`);
    if(typeof item.reviewer!=='string'||!item.reviewer.trim())throw new Error(`Missing reviewer: ${r.id}`);
    if(!Array.isArray(item.evidence)||!item.evidence.length)throw new Error(`Missing evidence: ${r.id}`);
    const citations=[];
    for(const e of item.evidence){
      if(!isObject(e)||typeof e.nodeId!=='string'||typeof e.quote!=='string'||!e.quote)throw new Error(`Invalid evidence: ${r.id}`);
      const node=doc.nodes.find(n=>n.id===e.nodeId);
      if(!node||!sourceContains(node.text,e.quote))throw new Error(`Evidence quote not found in source node: ${r.id}`);
      if(!r.scope.includes('*')){
        let section='*';for(const n of doc.nodes){if(n.kind==='heading')section=n.text.replace(/^\s*#{1,6}\s*/,'').trim().toLowerCase().replace(/\s+/g,'-');if(n.id===node.id)break;}
        if(!r.scope.includes(section))throw new Error(`Evidence outside requirement scope: ${r.id}`);
      }
      citations.push({nodeId:e.nodeId,line:node.startLine,quote:e.quote});
    }
    results.push({id:r.id,status:item.decision==='supported'?'REVIEW_SUPPORTED':item.decision==='contradicted'?'REVIEW_CONTRADICTED':'NOT_VERIFIED',reviewer:item.reviewer,evidence:citations,notes:typeof item.notes==='string'?item.notes:''});
  }
  const status=results.some(r=>r.status==='REVIEW_CONTRADICTED')?'REVIEW_CONFLICT':results.some(r=>r.status==='NOT_VERIFIED')?'INCOMPLETE':'REVIEW_COMPLETE';
  return {schemaVersion:'1.9',file,documentHash:doc.hash,status,results,limitations:['Reviewer attestations are not independently validated','REVIEW_COMPLETE does not certify writing quality or factual truth']};
}
