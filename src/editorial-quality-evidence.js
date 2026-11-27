import {sha256} from './core.js';
import {verifyIdentity} from './editorial-runtime.js';
import {attest} from './editorial-consolidated.js';
import {qualityRegression} from './editorial-core-qualification.js';
const dimensions=['factRetention','mechanism','progression','compression','fusion'];
const hash=x=>sha256(JSON.stringify(x));
const span=(text,s)=>Number.isSafeInteger(s?.start)&&s.start>=0&&typeof s.quote==='string'&&s.quote.trim()&&text.slice(s.start,s.start+s.quote.length)===s.quote;
export function evidenceBoundQuality(input,policy){
 const {review,...payload}=input;
 if(!['before','after','author'].every(k=>typeof payload[k]==='string'&&payload[k].trim())||!Array.isArray(payload.evidence))throw Error('Invalid quality input');
 const gate=qualityRegression(payload.beforeScores,payload.afterScores);
 const issues=[];const ids=new Set();
 for(const e of payload.evidence){if(!dimensions.includes(e.dimension)||ids.has(e.dimension)||!span(payload.before,e.before)||!span(payload.after,e.after)||typeof e.reason!=='string'||!e.reason.trim())issues.push('INVALID_EVIDENCE:'+e.dimension);ids.add(e.dimension);}
 for(const d of dimensions)if(!ids.has(d))issues.push('MISSING_EVIDENCE:'+d);
 const body={purpose:'editorial-quality-v11.7',author:payload.author,basis:hash(payload),at:policy.at,registryHash:hash(policy.registry)};
 const entry=policy.registry.find(e=>e.id===review?.reviewer);
 const identity=attest(entry,policy.attestations?.find(a=>a.reviewer===entry?.id),policy.authorities??{},policy.at);
 const signed=identity&&verifyIdentity(policy.registry,policy.at,review,body);
 return {status:issues.length||gate.status==='BLOCKED'?'BLOCKED':signed?'SIGNED_REVIEW_ACCEPTED':'INCOMPLETE',issues,regressions:gate.regressions,body,independence:'NOT_VERIFIED'};
}
