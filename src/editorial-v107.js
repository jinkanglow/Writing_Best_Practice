import {sha256} from './core.js';
import {qualifyFusion106} from './editorial-v106.js';
const hash=x=>sha256(JSON.stringify(x));
const text=x=>typeof x==='string'&&!!x.trim();
const norm=x=>x.normalize('NFKC').trim().toLowerCase();
export function detectConflicts(directives){
 if(!Array.isArray(directives)||new Set(directives.map(d=>d.id)).size!==directives.length||directives.some(d=>![d.id,d.target,d.scope,d.skillId].every(text)||!['require','forbid'].includes(d.action)))throw Error('Invalid directives');
 const hits=[];for(let i=0;i<directives.length;i++)for(let j=i+1;j<directives.length;j++){const a=directives[i],b=directives[j];if(norm(a.target)===norm(b.target)&&(a.scope==='*'||b.scope==='*'||norm(a.scope)===norm(b.scope))&&a.action!==b.action)hits.push({id:hash([a.id,b.id].sort()),directives:[a.id,b.id]});}return hits;
}
export async function auditV107(input){
 const {legacy,directives,dependencies,progression,exceptionReviews,review}=input;
 const base=await qualifyFusion106(legacy),f=legacy.fusion,blockers=[...base.blockers],pending=[...base.pending];
 const {review:ignored,...payload}=input,basis=hash(payload),valid=review?.basis===basis&&text(review.reviewer)&&review.author===f.review?.author&&review.author!==review.reviewer;
 const block=(code,id)=>blockers.push({code,id}),wait=(code,id)=>pending.push({code,id});
 const check=id=>{if(!valid||review.decisions?.[id]?.decision!=='approved'||!text(review.decisions[id].reason))wait('REVIEW_REQUIRED',id);};
 const hits=detectConflicts(directives);for(const d of directives)if(!f.skills.some(s=>s.id===d.skillId))block('UNKNOWN_SKILL',d.id);
 for(const s of f.skills)if(!directives.some(d=>d.skillId===s.id))wait('DIRECTIVE_COVERAGE',s.id);
 for(const h of hits)check('conflict:'+h.id);
 if(!Array.isArray(dependencies)||!Array.isArray(progression)||!Array.isArray(exceptionReviews))throw Error('Missing review arrays');
 const units=new Map(f.units.map((u,i)=>[u.id,{u,i}])),edges=new Set();
 for(const e of dependencies){const a=units.get(e.from),b=units.get(e.to),key=JSON.stringify([e.from,e.to]);if(!a||!b||a.i>=b.i||edges.has(key)||!text(e.reason)||!text(e.trigger)||!a.u.span.quote.includes(e.trigger)||!text(e.payoff)||!b.u.span.quote.includes(e.payoff))block('INVALID_DEPENDENCY',key);else{edges.add(key);check('edge:'+key);}}
 if(f.mode==='fiction')for(const u of f.units.slice(1))if(!dependencies.some(e=>e.to===u.id))wait('CAUSAL_LINK_REQUIRED',u.id);
 if(f.mode==='nonfiction'){
 const claims=legacy.editorial?.qualification.context.compression.afterClaims??[],seen=new Set(),covered=new Set();
 let last=-1;for(const p of progression){const position=units.get(p.unitId)?.i;if(position!==undefined&&position<=last)block('PROGRESSION_ORDER',p.unitId);if(position!==undefined)last=position;const u=units.get(p.unitId)?.u;if(!u||covered.has(p.unitId)||!['new-evidence','new-mechanism','calculation','necessary-recap'].includes(p.kind)||!text(p.reason)||!Array.isArray(p.claimIds)||!p.claimIds.length||p.claimIds.some(id=>!u.claimIds.includes(id)||!claims.some(c=>c.id===id))) {block('PROGRESSION_INVALID',p.unitId);continue;}covered.add(p.unitId);const fresh=p.claimIds.some(id=>!seen.has(id));if(!fresh&&p.kind!=='necessary-recap')block('NO_NEW_CLAIM',p.unitId);p.claimIds.forEach(id=>seen.add(id));check('progression:'+p.unitId);}
 for(const u of f.units)if(!covered.has(u.id))wait('PROGRESSION_REQUIRED',u.id);for(const c of claims)if(!seen.has(c.id))wait('CLAIM_COVERAGE',c.id);
 }
 for(const r of exceptionReviews)if(!f.exceptions.some(e=>e.id===r.id))block('UNKNOWN_EXCEPTION',r.id);
 for(const e of f.exceptions){const matches=exceptionReviews.filter(x=>x.id===e.id);const r=matches[0];if(matches.length!==1||!text(r?.alternative)||!text(r?.reason)||r?.quote!==e.span.quote||r?.preservesMeaning!==true)block('EXCEPTION_EVIDENCE_INVALID',e.id);else check('exception:'+e.id);}
 check('coverage');const result={basis,legacyHash:base.reportHash,conflicts:hits,blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW'};return {...result,reportHash:hash(result)};
}
export async function verifyV107(input,report){if(JSON.stringify(await auditV107(input))!==JSON.stringify(report))throw Error('Report mismatch');return {status:'VERIFIED'};}
export async function benchmarkV107(cases){if(!Array.isArray(cases))throw Error('Cases required');const ids=new Set(),results=[];for(const c of cases){if(!text(c.id)||ids.has(c.id)||!['synthetic','real'].includes(c.origin)||!['BLOCKED','INCOMPLETE','READY_FOR_INDEPENDENT_RELEASE_REVIEW'].includes(c.expected))throw Error('Invalid case');ids.add(c.id);if(c.origin==='real'&&(!text(c.locator)||!text(c.permission)||!text(c.author)||!text(c.reviewer)||c.author===c.reviewer||c.inputHash!==hash(c.input)))throw Error('Independent provenance required');const r=await auditV107(c.input);results.push({id:c.id,origin:c.origin,expected:c.expected,actual:r.status,pass:r.status===c.expected,reportHash:r.reportHash});}return {results,total:results.length,passed:results.filter(r=>r.pass).length,declaredRealCases:results.filter(r=>r.origin==='real').length,authenticatedIndependentCases:0};}
