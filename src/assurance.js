import {sourceContains} from './editorial-evidence-session.js';
import { createHash } from 'node:crypto';
import { parseMarkdownV17 } from './markdown.js';
import { applyBatch } from './patches.js';
const sha = s => createHash('sha256').update(s).digest('hex');
const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const allowed = new Set(['supported','contradicted','insufficient_evidence']);

// An adapter boundary: no provider is silently invoked and no model output is trusted.
export function prepareSemanticTasks(text, contract, {file='<input>'}={}) {
  if (!obj(contract) || !Array.isArray(contract.requirements)) throw new Error('Invalid contract');
  const doc=parseMarkdownV17(text,file), ids=new Set();
  const tasks=[];
  for (const r of contract.requirements) {
    if (!obj(r) || typeof r.id!=='string' || ids.has(r.id)) throw new Error('Invalid or duplicate requirement ID');
    ids.add(r.id);
    if (r.check?.kind==='semantic_review') tasks.push({id:r.id,requirement:r.value,scope:r.scope,sourceNodes:doc.nodes.filter(n=>n.kind!=='code_block'&&n.kind!=='frontmatter').map(n=>({id:n.id,line:n.startLine,text:n.text})),decision:null,evidence:[],reviewer:null});
  }
  return {schemaVersion:'2.0',file,documentHash:doc.hash,contractHash:sha(JSON.stringify(contract)),tasks,status:tasks.length?'PENDING':'NO_TASKS',limitations:['Adapter output requires independent validation','Model results are not factual verification']};
}

export function verifySemanticTasks(text,contract,response,{file='<input>'}={}) {
  const expected=prepareSemanticTasks(text,contract,{file});
  if (!obj(response)||response.schemaVersion!=='2.0'||response.documentHash!==expected.documentHash||response.contractHash!==expected.contractHash||!Array.isArray(response.tasks)) throw new Error('Stale or malformed semantic response');
  const nodes=new Map(parseMarkdownV17(text,file).nodes.map(n=>[n.id,n]));
  const expectedIds=new Set(expected.tasks.map(t=>t.id)),seen=new Set(),results=[];
  for(const task of response.tasks){
    if(!obj(task)||!expectedIds.has(task.id)||seen.has(task.id))throw new Error('Unknown or duplicate semantic task');
    seen.add(task.id);
    if(task.decision==null){results.push({id:task.id,status:'NOT_VERIFIED'});continue;}
    if(!allowed.has(task.decision)||typeof task.reviewer!=='string'||!task.reviewer.trim()||!Array.isArray(task.evidence)||!task.evidence.length)throw new Error('Invalid semantic decision or missing reviewer/evidence');
    for(const e of task.evidence){
      const n=nodes.get(e?.nodeId);
      if(!n||typeof e.quote!=='string'||!e.quote||!sourceContains(n.text,e.quote)||['code_block','frontmatter'].includes(n.kind))throw new Error('Unverifiable source quotation');
      const req=contract.requirements.find(r=>r.id===task.id);
      if(Array.isArray(req.scope)&&!req.scope.includes('*')){
        const doc=parseMarkdownV17(text,file);let section='*';
        for(const node of doc.nodes){if(node.kind==='heading')section=node.text.replace(/^\s*#{1,6}\s*/,'').trim().toLowerCase().replace(/\s+/g,'-');if(node.id===n.id)break;}
        if(!req.scope.includes(section))throw new Error('Evidence outside approved scope');
      }
    }
    results.push({id:task.id,status:task.decision==='supported'?'REVIEW_SUPPORTED':task.decision==='contradicted'?'REVIEW_CONTRADICTED':'NOT_VERIFIED',reviewer:task.reviewer,evidence:task.evidence});
  }
  for(const t of expected.tasks)if(!seen.has(t.id))results.push({id:t.id,status:'NOT_VERIFIED'});
  const status=results.some(x=>x.status==='REVIEW_CONTRADICTED')?'REVIEW_CONFLICT':results.some(x=>x.status==='NOT_VERIFIED')?'INCOMPLETE':'REVIEW_COMPLETE';
  return {schemaVersion:'2.0',status,results,documentHash:expected.documentHash,limitations:['Source quotation validity does not establish reviewer accuracy or factual truth']};
}

// Byte-exact preservation, not a semantic equivalence claim.
export function verifyProtectedPatches(text, patches, protectedSpans) {
  if(!Array.isArray(protectedSpans))throw new Error('protectedSpans must be an array');
  const bytes=Buffer.from(text,'utf8'), hash=sha(text), ids=new Set();
  for(const p of protectedSpans){
    if(!obj(p)||typeof p.id!=='string'||ids.has(p.id)||p.documentHash!==hash||!Number.isInteger(p.startOffset)||!Number.isInteger(p.endOffset)||p.startOffset<0||p.endOffset>bytes.length||p.startOffset>=p.endOffset)throw new Error('Invalid protected span');
    ids.add(p.id);
    if(p.expectedTextHash!==sha(bytes.subarray(p.startOffset,p.endOffset).toString('utf8')))throw new Error('Protected span hash mismatch');
    for(const patch of patches){
      // Insertion at the beginning or end is allowed, but not inside a protected span.
      const overlaps=patch.startOffset===patch.endOffset ? patch.startOffset>p.startOffset&&patch.startOffset<p.endOffset : patch.startOffset<p.endOffset&&patch.endOffset>p.startOffset;
      if(overlaps)throw new Error(`Patch intersects protected span: ${p.id}`);
    }
  }
  const revised=applyBatch(text,patches);
  return {schemaVersion:'2.0',status:'PASS',protectedCount:protectedSpans.length,documentHash:hash,revisedHash:sha(revised),revisedText:revised,limitations:['Checks byte-exact protected ranges only; does not prove semantic preservation elsewhere']};
}
