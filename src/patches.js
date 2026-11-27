import { sha256 } from './core.js';
const boundary = (buf, pos) => pos===0 || pos===buf.length || (buf[pos]&0xc0)!==0x80;
export function validateBatch(text, patches) {
  if (!Array.isArray(patches) || patches.length===0) throw new Error('Nonempty patches array required');
  const bytes=Buffer.from(text,'utf8'), hash=sha256(text);
  const sorted=[...patches].sort((a,b)=>a.startOffset-b.startOffset || a.endOffset-b.endOffset);
  for (let i=0;i<sorted.length;i++) {
    const p=sorted[i];
    if (p.documentHash!==hash) throw new Error('Stale document hash');
    if (![p.startOffset,p.endOffset].every(Number.isInteger) || p.startOffset<0 || p.endOffset<p.startOffset || p.endOffset>bytes.length) throw new Error('Invalid patch range');
    if (!boundary(bytes,p.startOffset)||!boundary(bytes,p.endOffset)) throw new Error('Patch splits UTF-8 code point');
    if (typeof p.replacementText!=='string') throw new Error('Missing replacementText');
    if (sha256(bytes.subarray(p.startOffset,p.endOffset).toString('utf8'))!==p.expectedTextHash) throw new Error('Patch precondition failed');
    if (i>0 && p.startOffset<=sorted[i-1].endOffset) throw new Error('Overlapping or ambiguous adjacent insertion patches');
  }
  return sorted;
}
export function applyBatch(text, patches) {
  const sorted=validateBatch(text,patches), original=Buffer.from(text,'utf8'), parts=[];
  let cursor=0;
  for (const p of sorted) {
    parts.push(original.subarray(cursor,p.startOffset),Buffer.from(p.replacementText,'utf8'));
    cursor=p.endOffset;
  }
  parts.push(original.subarray(cursor));
  return Buffer.concat(parts).toString('utf8');
}
