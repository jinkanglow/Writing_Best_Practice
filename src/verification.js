import { parseMarkdownV17 } from './markdown.js';
import { validateSkillContract } from './contracts.js';

// Only explicitly configured literal assertions are machine-verifiable.
// A bare 'value' is an abstract label, not a phrase to search for.
export function verifyContract(text, contract, {file='<input>'}={}) {
  validateSkillContract(contract);
  const doc=parseMarkdownV17(text,file);
  const results=[];
  let section='*';
  const scoped=[];
  for(const node of doc.nodes){
    if(node.kind==='heading') section=node.text.replace(/^\s*#{1,6}\s*/, '').trim().toLowerCase().replace(/\s+/g,'-');
    scoped.push({...node,section});
  }
  for(const r of contract.requirements){
    if(!['must','must_not'].includes(r.obligation)){
      results.push({id:r.id,status:'NOT_VERIFIED',reason:'Non-binding obligation requires editorial review'});continue;
    }
    if(r.check?.kind==='semantic_review'){results.push({id:r.id,status:'NOT_VERIFIED',reason:'Semantic requirement needs evidence review; run evidence prepare and evidence verify'});continue;}
    if(!r.check || r.check.kind!=='literal' || typeof r.check.text!=='string' || !r.check.text){
      results.push({id:r.id,status:'NOT_VERIFIED',reason:'No supported explicit literal check; abstract values cannot be verified'});continue;
    }
    const scope=r.scope;
    const applicable=scoped.filter(n=>(scope.includes('*')||scope.includes(n.section))&&['prose','heading','list_item'].includes(n.kind));
    if(!scope.includes('*') && !scoped.some(n=>scope.includes(n.section))){
      results.push({id:r.id,status:'NOT_VERIFIED',reason:'Target section not found'});continue;
    }
    const hits=applicable.filter(n=>n.maskedText.includes(r.check.text)).map(n=>({nodeId:n.id,line:n.startLine}));
    const passes=r.obligation==='must'?hits.length>0:hits.length===0;
    results.push({id:r.id,status:passes?'PASS':'FAIL',check:'literal',scope:r.scope,hits});
  }
  const status=results.some(r=>r.status==='FAIL')?'FAIL':results.some(r=>r.status==='NOT_VERIFIED')?'INCOMPLETE':'PASS';
  return {schemaVersion:'1.8',file,documentHash:doc.hash,status,results,limitations:['Literal checks only; no semantic entailment','Section scopes match normalized Markdown heading text','Nested Markdown and HTML blocks are not fully parsed']};
}

export function compileReviewedCandidates(report, decisions){
  if(report.schemaVersion!=='1.7'||!Array.isArray(report.candidates))throw new Error('Expected v1.7 extraction report');
  if(!Array.isArray(decisions))throw new Error('Decisions must be an array');
  const ids=new Set(report.candidates.map(c=>c.id)),seen=new Set(),requirements=[];
  for(const d of decisions){
    if(!ids.has(d.id)||seen.has(d.id))throw new Error(`Unknown or duplicate candidate decision: ${d.id}`);
    seen.add(d.id);
    if(d.action==='reject')continue;
    if(d.action!=='approve')throw new Error(`Invalid action for ${d.id}`);
    if(!['must','must_not','should','may'].includes(d.obligation))throw new Error(`Invalid obligation for ${d.id}`);
    if(typeof d.value!=='string'||!d.value.trim()||!Array.isArray(d.scope)||!d.scope.length||d.scope.some(s=>typeof s!=='string'||!s.trim()))throw new Error(`Incomplete reviewed requirement: ${d.id}`);
    const requirement={id:d.id,obligation:d.obligation,value:d.value,scope:d.scope};
    if(d.check!==undefined){if(!d.check||!['literal','semantic_review'].includes(d.check.kind)||(d.check.kind==='literal'&&(typeof d.check.text!=='string'||!d.check.text)))throw new Error(`Unsupported check: ${d.id}`);requirement.check=d.check;}
    requirements.push(requirement);
  }
  return {contract:{version:'1.6',requirements},review:{total:report.candidates.length,approved:requirements.length,rejected:decisions.filter(d=>d.action==='reject').length,pending:report.candidates.length-seen.size,status:report.candidates.length===seen.size?'COMPLETE':'PENDING'}};
}
