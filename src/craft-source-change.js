import {sha256} from './core.js';
import {auditEvidenceBound} from './craft-evidence-bound.js';
import {auditCraftSourceProvenance} from './craft-source-provenance.js';
const hash=x=>sha256(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const nonempty=x=>typeof x==='string'&&!!x.trim();
const pinned=x=>Array.isArray(x)&&x.every(s=>s&&nonempty(s.id)&&nonempty(s.sha256)&&/^[a-f0-9]{64}$/.test(s.sha256)&&nonempty(s.path))&&new Set(x.map(s=>s.id)).size===x.length;
/** Conservative dependency propagation. A changed source invalidates every claim directly linked to it and every dependent claim. */
export async function auditSourceChangeImpact({text,plan,records,root,baseline,current,acquisitions=[],allowedHosts=[],reviews=[]}){
 if(!pinned(baseline)||!pinned(current)||!Array.isArray(reviews))throw Error('Invalid source manifests or reviews');
 const evidence=auditEvidenceBound(text,plan,records);
 const provenance=await auditCraftSourceProvenance({text,plan,records,root,manifest:current,acquisitions,allowedHosts});
 const old=new Map(baseline.map(x=>[x.id,x])),now=new Map(current.map(x=>[x.id,x]));
 const changed=[];
 for(const id of [...new Set([...old.keys(),...now.keys()])].sort()){
  const a=old.get(id),b=now.get(id);
  if(!a)changed.push({sourceId:id,kind:'ADDED'});
  else if(!b)changed.push({sourceId:id,kind:'REMOVED'});
  else if(a.sha256!==b.sha256||a.path!==b.path)changed.push({sourceId:id,kind:'MODIFIED'});
 }
 const claimMap=new Map(records.claims.map(c=>[c.id,c]));
 const affected=new Map();
 for(const l of records.links){if(changed.some(s=>s.sourceId===l.sourceId))affected.set(l.claimId,new Set([l.sourceId]));}
 // Follow reverse dependency edges until fixed point, including cycles.
 let progress=true;
 while(progress){progress=false;for(const c of records.claims){
  const parents=(Array.isArray(c.dependsOn)?c.dependsOn:[]).filter(id=>affected.has(id));
  if(parents.length){const sources=new Set([...(affected.get(c.id)||[]),...parents.flatMap(id=>[...affected.get(id)])]);
   if(!affected.has(c.id)||sources.size!==affected.get(c.id).size){affected.set(c.id,sources);progress=true;}}
 }}
 const impacted=[...affected].sort(([a],[b])=>a.localeCompare(b)).map(([claimId,sources])=>({claimId,paragraphId:claimMap.get(claimId)?.paragraphId??null,sourceIds:[...sources].sort()}));
 const reviewMap=new Map(),issues=[],pending=[];
 for(const r of reviews){if(!r||!nonempty(r.claimId)||reviewMap.has(r.claimId)||!['RECHECKED','REJECT'].includes(r.decision)||!nonempty(r.reviewer)||!nonempty(r.rationale)||!nonempty(r.documentHash)||!nonempty(r.currentManifestHash))throw Error('Invalid or duplicate change review');reviewMap.set(r.claimId,r);if(!affected.has(r.claimId))issues.push({code:'ORPHAN_CHANGE_REVIEW',claimId:r.claimId});}
 for(const a of impacted){const r=reviewMap.get(a.claimId);if(!r){pending.push({code:'SOURCE_CHANGE_REVIEW_REQUIRED',claimId:a.claimId});continue;}
  if(r.documentHash!==sha256(text)||r.currentManifestHash!==hash(current)||r.baselineManifestHash!==hash(baseline))issues.push({code:'STALE_CHANGE_REVIEW',claimId:a.claimId});
  if(r.decision==='REJECT')issues.push({code:'CHANGE_REVIEW_REJECTED',claimId:a.claimId});
 }
 if(provenance.status==='BLOCKED')issues.push({code:'CURRENT_SOURCE_PROVENANCE_BLOCKED'});
 else if(provenance.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push({code:'CURRENT_SOURCE_PROVENANCE_INCOMPLETE'});
 if(evidence.status==='BLOCKED')issues.push({code:'EVIDENCE_BOUND_BLOCKED'});
 else if(evidence.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push({code:'EVIDENCE_BOUND_INCOMPLETE'});
 const status=issues.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'7.8',documentHash:sha256(text),planHash:hash(plan),recordsHash:hash(records),baselineManifestHash:hash(baseline),currentManifestHash:hash(current),provenanceReportHash:provenance.reportHash,evidenceReportHash:evidence.reportHash,reviewsHash:hash(reviews),status,changedSources:changed,impactedClaims:impacted,impactedParagraphs:[...new Set(impacted.map(x=>x.paragraphId).filter(Boolean))].sort(),issues,pending,limitations:['Only registered source-to-claim and claim dependency edges propagate changes','Rechecks are editor attestations, not proof of correctness','Unchanged hashes do not establish source freshness or truth']};
 return {...payload,reportHash:hash(payload)};
}
export async function verifySourceChangeImpact(inputs,report){const expected=await auditSourceChangeImpact(inputs);if(!same(expected,report))throw Error('Source change impact report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
