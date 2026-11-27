import {sha256} from './core.js';
import {auditV105,verifyV105} from './editorial-v105.js';
const hash=x=>sha256(JSON.stringify(x));
const text=x=>typeof x==='string'&&!!x.trim();
const span=(draft,s)=>Number.isSafeInteger(s?.start)&&s.start>=0&&text(s.quote)&&draft.slice(s.start,s.start+s.quote.length)===s.quote;
const unique=(xs)=>Array.isArray(xs)&&xs.every(x=>text(x?.id))&&new Set(xs.map(x=>x.id)).size===xs.length;
export function auditFusion106(input){
 const {draft,mode,skills,constraints,anchors,conflicts,exceptions,units,review}=input;
 if(!text(draft)||!['fiction','nonfiction'].includes(mode)||![skills,constraints,anchors,conflicts,exceptions,units].every(unique)||skills.length<2||!anchors.length||!constraints.length||!units.length)throw Error('Invalid fusion contract');
 const {review:ignored,...payload}=input;const basis=hash(payload),blockers=[],pending=[];
 const block=(code,id)=>blockers.push({code,id}),wait=(code,id)=>pending.push({code,id});
 const valid=review?.basis===basis&&text(review.author)&&text(review.reviewer)&&review.author!==review.reviewer;
 const approved=id=>valid&&review.decisions?.[id]?.decision==='approved'&&text(review.decisions[id].reason);
 const check=id=>{if(!approved(id))wait('SEMANTIC_REVIEW_REQUIRED',id)};
 if(skills[0].role!=='primary'||skills.slice(1).some(s=>s.role!=='constraint')||skills.some(s=>!text(s.content)))block('SKILL_ROLE_INVALID','skills');
 for(const c of constraints){if(!skills.slice(1).some(s=>s.id===c.skillId)||!text(c.rule)||!['integrity','style'].includes(c.kind))block('CONSTRAINT_INVALID',c.id);check('constraint:'+c.id);}
 for(const s of skills.slice(1))if(!constraints.some(c=>c.skillId===s.id))block('SKILL_UNMAPPED',s.id);
 for(const a of anchors){if(!text(a.requirement)||!text(a.translation)||!span(draft,a.span)||!Array.isArray(a.constraintIds)||!a.constraintIds.length||a.constraintIds.some(id=>!constraints.some(c=>c.id===id)))block('ANCHOR_INVALID',a.id);check('anchor:'+a.id);}
 for(const c of conflicts){if(!anchors.some(a=>a.id===c.anchorId)||!Array.isArray(c.constraintIds)||!c.constraintIds.length||c.constraintIds.some(id=>!constraints.some(x=>x.id===id))||!text(c.resolution)||c.status!=='resolved')block('CONFLICT_UNRESOLVED',c.id);check('conflict:'+c.id);}
 for(const e of exceptions){const c=constraints.find(c=>c.id===e.constraintId);if(c?.kind!=='style'||!span(draft,e.span)||!text(e.reason)||!anchors.some(a=>a.id===e.anchorId&&a.constraintIds.includes(e.constraintId)&&span(draft,a.span)&&e.span.start>=a.span.start&&e.span.start+e.span.quote.length<=a.span.start+a.span.quote.length))block('EXCEPTION_INVALID',e.id);check('exception:'+e.id);}
 let previous=null;const contributions=new Set();for(const u of units){if(!span(draft,u.span)||!anchors.some(a=>a.id===u.anchorId)||!text(u.cause)||!text(u.effect))block('UNIT_INVALID',u.id);if(previous&&u.span?.start<previous.span?.start+previous.span?.quote?.length)block('UNIT_ORDER',u.id);
 if(mode==='fiction'){if(!text(u.character)||!text(u.before)||!text(u.after)||!text(u.motive))block('CHARACTER_CAUSALITY_MISSING',u.id);const prior=units.slice(0,units.indexOf(u)).reverse().find(p=>p.character===u.character);if(prior&&prior.after!==u.before&&!text(u.bridge))block('EMOTIONAL_DISCONTINUITY',u.id);}
 else{if(!text(u.contribution)||!Array.isArray(u.claimIds)||!u.claimIds.length||u.claimIds.some(x=>!text(x)))block('ARGUMENT_INVALID',u.id);if(contributions.has(u.contribution))wait('REPEATED_CONTRIBUTION',u.id);contributions.add(u.contribution);}
 check('unit:'+u.id);previous=u;}
 for(const a of anchors)if(!units.some(u=>u.anchorId===a.id))block('ANCHOR_UNIT_MISSING',a.id);
 check('coverage');check('conflict-coverage');check('voice');
 const result={basis,draftHash:sha256(draft),blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW'};return {...result,reportHash:hash(result)};
}
export async function qualifyFusion106(input){const fusion=auditFusion106(input.fusion),blockers=[...fusion.blockers],pending=[...fusion.pending];let legacy=null;if(input.fusion.mode==='nonfiction'){if(!input.editorial)pending.push({code:'EDITORIAL_REQUIRED'});else if(input.editorial.qualification.context.compression.after!==input.fusion.draft)blockers.push({code:'DRAFT_MISMATCH'});else{legacy=await auditV105(input.editorial);blockers.push(...legacy.blockers);pending.push(...legacy.pending);const claims=input.editorial.qualification.context.compression.afterClaims;for(const u of input.fusion.units)for(const id of u.claimIds??[])if(!claims.some(c=>c.id===id&&u.span.quote.includes(c.anchor)))blockers.push({code:'CLAIM_UNIT_MISMATCH',id});}}const result={fusionHash:fusion.reportHash,legacyHash:legacy?.reportHash??null,blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW'};return {...result,reportHash:hash(result)};}
export async function verifyFusion106(input,report){if(JSON.stringify(await qualifyFusion106(input))!==JSON.stringify(report))throw Error('Report mismatch');return {status:'VERIFIED'};}
