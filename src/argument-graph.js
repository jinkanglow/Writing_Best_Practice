import {sha256} from './core.js';
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const kinds=new Set(['supports','qualifies','causes','contradicts','attributed_to']);
export function auditArgumentGraph(before,after,graph,review=null){
 if(!isObject(graph)||graph.beforeHash!==sha256(before)||!Array.isArray(graph.nodes)||!graph.nodes.length||!Array.isArray(graph.edges))throw Error('Invalid or stale argument graph');
 const ids=new Set();
 for(const n of graph.nodes){if(!isObject(n)||typeof n.id!=='string'||!n.id||ids.has(n.id)||typeof n.quote!=='string'||!n.quote||!before.includes(n.quote))throw Error('Invalid graph node or source quote');ids.add(n.id);}
 const edges=new Set();
 for(const e of graph.edges){if(!isObject(e)||typeof e.id!=='string'||!e.id||edges.has(e.id)||!ids.has(e.from)||!ids.has(e.to)||!kinds.has(e.kind)||e.from===e.to)throw Error('Invalid graph edge');edges.add(e.id);}
 if(review!==null&&(!isObject(review)||review.beforeHash!==sha256(before)||review.afterHash!==sha256(after)||review.graphHash!==sha256(JSON.stringify(graph))||!Array.isArray(review.decisions)))throw Error('Invalid or stale graph review');
 const reviewed=new Map();
 for(const d of review?.decisions??[]){if(!isObject(d)||!edges.has(d.edgeId)||reviewed.has(d.edgeId)||!['approve','reject'].includes(d.action)||typeof d.reviewer!=='string'||!d.reviewer.trim()||typeof d.reason!=='string'||!d.reason.trim())throw Error('Invalid graph decision');reviewed.set(d.edgeId,d);}
 const present=new Map(graph.nodes.map(n=>[n.id,after.includes(n.quote)]));
 const findings=graph.edges.map(e=>{
  const d=reviewed.get(e.id),endpointsPresent=present.get(e.from)&&present.get(e.to);
  return {edgeId:e.id,kind:e.kind,from:e.from,to:e.to,status:d?.action==='reject'?'REJECTED':d?.action==='approve'?'APPROVED_FOR_HUMAN_RELEASE':endpointsPresent?'RELATION_UNVERIFIED':'REVIEW_REQUIRED',endpointsPresent,reviewer:d?.reviewer??null};
 });
 const status=findings.some(f=>f.status==='REJECTED')?'BLOCKED':findings.some(f=>!['APPROVED_FOR_HUMAN_RELEASE'].includes(f.status))?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'3.9',status,beforeHash:sha256(before),afterHash:sha256(after),graphHash:sha256(JSON.stringify(graph)),reviewHash:review?sha256(JSON.stringify(review)):null,findings,limitations:['Text presence cannot establish a semantic relation','Reviewer approval is a workflow decision, not independent factual verification']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export function verifyArgumentGraph(before,after,graph,review,report){const actual=auditArgumentGraph(before,after,graph,review);if(JSON.stringify(actual)!==JSON.stringify(report))throw Error('Graph report differs from recomputation');return {status:'GRAPH_REPORT_RECOMPUTED',decision:actual.status,reportHash:actual.reportHash};}
