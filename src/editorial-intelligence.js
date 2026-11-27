import {sha256,parseMarkdown} from './core.js';
import {auditOriginality} from './editorial-originality.js';
import {scanCatalog} from './anti-slop-catalog-scan.js';
const hash=x=>sha256(JSON.stringify(x));
const str=x=>typeof x==='string'&&x.trim().length>0;
const fail=m=>{throw Error(m)};
function index(xs,name){if(!Array.isArray(xs))fail('Invalid '+name);const m=new Map();for(const x of xs){if(!x||!str(x.id)||m.has(x.id))fail('Invalid/duplicate '+name+' ID');m.set(x.id,x);}return m;}
const refs=(xs,m)=>Array.isArray(xs)&&new Set(xs).size===xs.length&&xs.every(x=>m.has(x));
const norm=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function auditEditorialIntelligence(text,plan,rules,catalog,policy){
 if(!str(text)||!plan||plan.version!==1||plan.documentHash!==sha256(text))fail('Invalid or stale plan');
 if(!policy||!Array.isArray(policy.profiles)||!policy.profiles.includes(plan.profile))fail('Unknown profile');
 const sources=index(plan.sources,'source'),claims=index(plan.claims,'claim'),contributions=index(plan.contributions,'contribution');
 const blockers=[],pending=[],findings=[];const block=(code,id)=>blockers.push({code,id});const wait=(code,id)=>pending.push({code,id});
 const paragraphs=parseMarkdown(text).nodes.filter(n=>['prose','list_item'].includes(n.kind)&&n.maskedText.trim()).map(n=>({line:n.startLine,text:n.maskedText.trim()}));
 const lines=new Map(paragraphs.map(p=>[p.line,p.text]));
 for(const s of sources.values()){if(!str(s.text)||!str(s.locator)||!refs(s.parents,sources))fail('Invalid source '+s.id);}
 const roots=new Map(),active=new Set();function visit(id){if(active.has(id))fail('Source dependency cycle');if(roots.has(id))return roots.get(id);active.add(id);const s=sources.get(id);const r=new Set(s.parents.length?s.parents.flatMap(p=>[...visit(p)]):[id]);active.delete(id);roots.set(id,r);return r;}
 for(const id of sources.keys())visit(id);
 const coverage=new Set(),groups=new Map(),graph=[];
 for(const c of claims.values()){
  if(!lines.has(c.line)||!str(c.anchor)||!lines.get(c.line).includes(c.anchor)||!str(c.proposition)||!str(c.scope)||!['fact','inference','opinion','hypothetical'].includes(c.kind)||!refs(c.sources,sources))fail('Invalid claim '+c.id);
  coverage.add(c.line);if(c.kind==='fact'&&!c.sources.length)block('UNSUPPORTED_FACT',c.id);
  if(c.kind==='inference'&&!c.sources.length)wait('INFERENCE_BASIS_REVIEW',c.id);
  const key=JSON.stringify([norm(c.proposition),norm(c.scope)]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c.id);
  graph.push({claimId:c.id,sourceIds:c.sources,declaredRoots:[...new Set(c.sources.flatMap(s=>[...roots.get(s)]))].sort()});
 }
 for(const p of paragraphs)if(!coverage.has(p.line))wait('UNMAPPED_PARAGRAPH',p.line);
 for(const ids of groups.values())if(ids.length>1)findings.push({kind:'declared-semantic-duplicate',claimIds:ids});
 for(const c of contributions.values()){
  if(!['calculation','reporting','comparison','interpretation','synthesis'].includes(c.kind)||!str(c.method)||!str(c.result)||!str(c.artifact)||!refs(c.claims,claims)||!c.claims.length||!refs(c.sources,sources))fail('Invalid contribution '+c.id);
  if(!c.sources.length&&c.kind!=='reporting')wait('CONTRIBUTION_BASIS_REVIEW',c.id);
 }
 if(!contributions.size)wait('NO_DECLARED_ORIGINAL_CONTRIBUTION','document');
 const originality=auditOriginality(text,rules,[...sources.values()].map(s=>({id:s.id,text:s.text})));
 const lexical=scanCatalog(text,catalog,{profile:plan.profile});
 const reviewItems=[...findings.map(f=>({type:'semantic',finding:f})),...originality.findings.map(f=>({type:'originality',finding:f})),...lexical.findings.map(f=>({type:'lexical',finding:f}))].map(f=>({...f,id:hash(f)}));
 const reviewBasis=hash({plan:{...plan,review:undefined},rules,catalog,policy,reviewItems});
 const review=plan.review;
 if(!review||review.basis!==reviewBasis||!str(review.reviewer)||!str(review.author)||review.reviewer===review.author||!str(review.policyEvidence)||!['approved','rejected'].includes(review.decision))wait('INDEPENDENT_REVIEW_REQUIRED','document');
 else {if(review.decision==='rejected')block('EDITOR_REJECTED','document');const decisions=index(review.decisions,'review decision');for(const item of reviewItems){const d=decisions.get(item.id);if(!d||!str(d.reason)||!['retain','reject'].includes(d.decision))wait('UNRESOLVED_FINDING',item.id);else if(d.decision==='reject')block('REJECTED_FINDING',item.id);}for(const id of decisions.keys())if(!reviewItems.some(i=>i.id===id))fail('Unknown review finding');}
 const payload={version:1,documentHash:sha256(text),reviewBasis,graph,contributions:[...contributions.values()],reviewItems,blockers,pending,status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_RELEASE_REVIEW',limitations:['Canonical propositions are supplied by editors, not inferred by a semantic model.','Declared source roots do not establish independent reporting or truth.','Reviewer identity and originality are not independently authenticated.','This gate supplements existing release gates; it does not authorize publication.']};return {...payload,reportHash:hash(payload)};
}
export function verifyEditorialIntelligence(text,plan,rules,catalog,policy,report){if(JSON.stringify(auditEditorialIntelligence(text,plan,rules,catalog,policy))!==JSON.stringify(report))fail('Stale or modified report');return {status:'VERIFIED'};}
