// Provider-neutral, offline semantic exchange. No model is invoked.
import { createHash } from 'node:crypto';
import { prepareSemanticTasks, verifySemanticTasks } from './assurance.js';
const hash = x => createHash('sha256').update(x).digest('hex');
const isObject = x => x && typeof x === 'object' && !Array.isArray(x);
const safeId = x => typeof x === 'string' && /^[a-zA-Z0-9._:-]{1,128}$/.test(x);
export function prepareProviderRequest(text, contract, {file='<input>', provider='manual', model='unconfigured'}={}) {
  if(!safeId(provider)||!safeId(model))throw new Error('Invalid provider/model identifier');
  const prepared=prepareSemanticTasks(text,contract,{file});
  const tasks=prepared.tasks.map(t=>({id:t.id,requirement:t.requirement,scope:t.scope,sourceNodes:t.sourceNodes}));
  const request={schemaVersion:'2.2',protocol:'offline-semantic-exchange',provider,model,documentHash:prepared.documentHash,contractHash:prepared.contractHash,tasks,security:{sourceTextIsUntrusted:true,modelCannotChangeRules:true,requiresExactQuotes:true}};
  return {...request,requestHash:hash(JSON.stringify(request))};
}
export function verifyProviderResponse(text,contract,request,response,{file='<input>'}={}) {
  const expected=prepareProviderRequest(text,contract,{file,provider:request?.provider,model:request?.model});
  if(!isObject(request)||request.requestHash!==expected.requestHash||JSON.stringify(request)!==JSON.stringify(expected))throw new Error('Stale or tampered provider request');
  if(!isObject(response)||response.schemaVersion!=='2.2'||response.requestHash!==expected.requestHash||response.provider!==expected.provider||response.model!==expected.model||!Array.isArray(response.tasks))throw new Error('Stale or malformed provider response');
  const ids=new Set(expected.tasks.map(t=>t.id)),seen=new Set();
  const normalized=[];
  for(const t of response.tasks){
    if(!isObject(t)||!ids.has(t.id)||seen.has(t.id))throw new Error('Unknown or duplicate provider task');
    seen.add(t.id);
    if(!['supported','contradicted','insufficient_evidence'].includes(t.decision))throw new Error('Invalid provider decision');
    if(!Array.isArray(t.evidence)||t.evidence.length===0)throw new Error('Missing provider evidence');
    normalized.push({id:t.id,decision:t.decision,reviewer:`provider:${response.provider}/${response.model}`,evidence:t.evidence});
  }
  const prepared=prepareSemanticTasks(text,contract,{file});
  const report=verifySemanticTasks(text,contract,{...prepared,tasks:normalized},{file});
  return {...report,schemaVersion:'2.2',provider:response.provider,model:response.model,requestHash:expected.requestHash,assessment:'MODEL_ASSISTED_NOT_INDEPENDENTLY_VERIFIED',limitations:[...report.limitations,'Model judgments are not independent human labels or external fact verification']};
}
