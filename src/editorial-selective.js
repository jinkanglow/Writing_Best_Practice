import {sha256} from './core.js';
import {runEditorial,verifyIdentity} from './editorial-runtime.js';
import {evidenceSession} from './editorial-evidence-session.js';
import {attest,consolidate} from './editorial-consolidated.js';
import {decisionRegistry} from './editorial-execution-graph.js';
import {blindPair} from './editorial-integration.js';
const hash=x=>sha256(JSON.stringify(x));
// Session-local cache; never accept caller-provided cached decisions.
export function selectiveRuntime(){let cache=new Map(),busy=false;return {async run(input,policy){if(busy)throw Error('Concurrent run');busy=true;try{input=structuredClone(input);policy=structuredClone(policy);const next=new Map(),executed=[],reused=[];async function stage(id,basis,fn){const key=hash(basis),old=cache.get(id);let value;if(old?.key===key){value=old.value;reused.push(id);}else{value=await fn();executed.push(id);}next.set(id,{key,value});return value;}
const runtime=await stage('runtime',[input,policy.registry,policy.at],()=>evidenceSession(()=>runEditorial(input,policy)));
const identity=await stage('identity',[input.approval?.reviewer,policy.registry,policy.attestations,policy.authorities,policy.at],()=>{const entry=policy.registry.find(e=>e.id===input.approval?.reviewer);return attest(entry,policy.attestations?.find(a=>a.reviewer===entry?.id),policy.authorities??{},policy.at);});
const audit=await stage('audit',[runtime,identity,policy],()=>{const blockers=consolidate(runtime.result.blockers),pending=consolidate(runtime.result.pending);if(!identity)pending.push({code:'IDENTITY_ATTESTATION_REQUIRED'});const r={legacyHash:runtime.result.reportHash,policyHash:hash(policy),stats:runtime.stats,blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'REVIEW_AUTHORIZED'};return {...r,reportHash:hash(r)};});
const decisions=await stage('decisions',[audit.blockers,audit.pending],()=>decisionRegistry([...audit.blockers.map(x=>({...x,severity:'blocker'})),...audit.pending.map(x=>({...x,severity:'pending'}))]));
cache=next;return structuredClone({audit,decisions,release:{status:audit.status,decisionCount:decisions.length},executed,reused});}finally{busy=false;}}};}
export function authenticatedBlindPair(pair,policy){pair=structuredClone(pair);policy=structuredClone(policy);const session=blindPair(pair);return {packet:structuredClone(session.packet),score(submission){const entry=policy.registry.find(e=>e.id===pair.reviewer);if(!attest(entry,policy.attestations?.find(a=>a.reviewer===entry?.id),policy.authorities??{},policy.at))throw Error('Identity attestation required');const body={purpose:'blind-editorial-v11.5',author:pair.author,packetHash:hash(session.packet),token:submission.token,scores:submission.scores};if(submission.reviewer!==pair.reviewer||!verifyIdentity(policy.registry,policy.at,submission,body))throw Error('Invalid signature');return {...session.score(submission),identityVerified:true,independence:'NOT_VERIFIED'};}};}
