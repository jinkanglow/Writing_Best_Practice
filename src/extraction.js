import { createHash } from 'node:crypto';
const digest = s => createHash('sha256').update(s).digest('hex').slice(0,12);
// Candidate extraction is NOT an enforceable contract. Explicit human review is required.
export function extractRequirementCandidates(markdown, file='<input>') {
  const lines=markdown.split(/\r?\n/), candidates=[];
  let heading='', fence=null;
  for(let i=0;i<lines.length;i++) {
    const line=lines[i],trim=line.trim();
    const f=trim.match(/^(`{3,}|~{3,})/);
    if(f){if(!fence)fence=f[1][0];else if(f[1][0]===fence)fence=null;continue;}
    if(fence||!trim||/^>/.test(trim))continue;
    const h=trim.match(/^#{1,6}\s+(.+)/);if(h){heading=h[1];continue;}
    const bullet=trim.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    const sentence=bullet?.[1]??trim;
    const explicit=/(?:\bmust\b|\bnever\b|\brequired\b|\bprohibited\b|\bshould\b|必须|不得|禁止|务必|需要|应当|不要)/i.test(sentence);
    if(!explicit)continue;
    const obligation=/(?:\bnever\b|\bprohibited\b|不得|禁止|不要)/i.test(sentence)?'must_not':/(?:\bshould\b|应当)/i.test(sentence)?'should':'must';
    candidates.push({id:`C-${digest(`${file}:${i+1}:${sentence}`)}`,file,line:i+1,section:heading,text:sentence,proposedObligation:obligation,proposedScope:['*'],status:'needs_review',confidence:'heuristic',warning:'Not enforceable; scope, value and obligation require human confirmation'});
  }
  return {schemaVersion:'1.7',file,status:'REVIEW_REQUIRED',candidates,limitations:['Keyword heuristic only','Does not infer semantic meaning or applicability','No automatic conversion to enforceable contract']};
}
