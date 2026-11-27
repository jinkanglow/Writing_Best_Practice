import {sha256} from './core.js';
import {auditArgumentGraph} from './argument-graph.js';
import {quoteSpan,verifyQuoteSpan,candidateWindows} from './graph-spans.js';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const kinds=new Set(['supports','qualifies','causes','contradicts','attributed_to']);
const roles=new Set(['claim','evidence','qualifier','cause','effect','source','conclusion','other']);
const exact=(text,quote)=>{const i=text.indexOf(quote);return i>=0&&text.indexOf(quote,i+quote.length)<0;};
export function prepareGraphExtraction(before,{maxQuotes=200}={}){
 if(typeof before!=='string'||!before.trim())throw Error('Nonempty source text required');
 if(!Number.isSafeInteger(maxQuotes)||maxQuotes<1||maxQuotes>1000)throw Error('Invalid maxQuotes');
 const candidates=candidateWindows(before,{maxQuotes});
 const payload={schemaVersion:'4.1',beforeHash:sha256(before),sourceLength:Buffer.byteLength(before),candidates,limitations:['Candidates are line-level quotations, not verified claims or argument relations','Headings, quoted blocks and short lines may be omitted']};
 return {...payload,requestHash:sha256(JSON.stringify(payload))};
}
export function validateGraphProposal(before,request,proposal){
 if(!object(request)||request.beforeHash!==sha256(before)||request.requestHash!==sha256(JSON.stringify(Object.fromEntries(Object.entries(request).filter(([k])=>k!=='requestHash')))))throw Error('Stale or invalid extraction request');
 if(!object(proposal)||proposal.requestHash!==request.requestHash||!Array.isArray(proposal.nodes)||!Array.isArray(proposal.edges)||!proposal.nodes.length)throw Error('Invalid graph proposal');
 if(proposal.nodes.length>500||proposal.edges.length>1000)throw Error('Graph exceeds limits');
 const ids=new Set();
 for(const n of proposal.nodes){if(!object(n)||typeof n.id!=='string'||!/^[-\w]{1,64}$/.test(n.id)||ids.has(n.id)||!roles.has(n.role)||typeof n.quote!=='string'||!n.quote.trim()||!exact(before,n.quote))throw Error('Invalid, ambiguous or fabricated node quote');if(n.span)verifyQuoteSpan(before,n.quote,n.span);ids.add(n.id);}
 const edgeIds=new Set();
 for(const e of proposal.edges){if(!object(e)||typeof e.id!=='string'||!/^[-\w]{1,64}$/.test(e.id)||edgeIds.has(e.id)||!ids.has(e.from)||!ids.has(e.to)||e.from===e.to||!kinds.has(e.kind))throw Error('Invalid graph relation');edgeIds.add(e.id);}
 const graph={beforeHash:sha256(before),nodes:proposal.nodes.map(({id,quote,role,span})=>({id,quote,role,span:span||quoteSpan(before,quote)})),edges:proposal.edges.map(({id,from,to,kind})=>({id,from,to,kind}))};
 const payload={schemaVersion:'4.1',status:'REVIEW_REQUIRED',beforeHash:sha256(before),requestHash:request.requestHash,graph,proposalHash:sha256(JSON.stringify(proposal)),limitations:['Quoted evidence existence does not establish the correctness of any proposed relation','This output is not an approved argument graph']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export function approveGraphProposal(before,validation,decisions){
 if(!object(validation)||validation.beforeHash!==sha256(before)||validation.status!=='REVIEW_REQUIRED'||validation.reportHash!==sha256(JSON.stringify(Object.fromEntries(Object.entries(validation).filter(([k])=>k!=='reportHash')))))throw Error('Invalid graph validation');
 if(!object(decisions)||decisions.reportHash!==validation.reportHash||!Array.isArray(decisions.decisions))throw Error('Invalid or stale decisions');
 const seen=new Set(),allowed=new Set(validation.graph.edges.map(e=>e.id));
 for(const d of decisions.decisions){if(!object(d)||!allowed.has(d.edgeId)||seen.has(d.edgeId)||!['approve','reject'].includes(d.action)||typeof d.reviewer!=='string'||!d.reviewer.trim()||typeof d.reason!=='string'||!d.reason.trim())throw Error('Invalid decision');seen.add(d.edgeId);}
 const missing=[...allowed].filter(id=>!seen.has(id));const rejected=decisions.decisions.filter(d=>d.action==='reject').map(d=>d.edgeId);
 const status=missing.length?'INCOMPLETE':rejected.length?'BLOCKED':'APPROVED_FOR_AUDIT';
 const approvedEdges=validation.graph.edges.filter(e=>decisions.decisions.some(d=>d.edgeId===e.id&&d.action==='approve'));
 const graph={...validation.graph,edges:approvedEdges};
 // Existing audit still requires a separate review of relations after revisions.
 if(status==='APPROVED_FOR_AUDIT')auditArgumentGraph(before,before,graph);
 return {schemaVersion:'4.1',status,graph,missing,rejected,decisionsHash:sha256(JSON.stringify(decisions)),limitations:['Approval records are self-reported and do not authenticate reviewer identity','Approval is not evidence that the relation is factually correct']};
}
