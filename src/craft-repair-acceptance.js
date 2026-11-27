import {sha256} from './core.js';
import {auditRepair} from './craft-repair.js';
import {auditUnifiedRelease} from './craft-unified-release.js';
const digest=x=>sha256(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const nonempty=x=>typeof x==='string'&&x.trim().length>=3;
// Paragraph matching is exact and conservative. It cannot discover semantic dependencies.
export function paragraphChangeMap(before,after){
 if(typeof before!=='string'||typeof after!=='string')throw Error('Expected document strings');
 const split=s=>s.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
 const a=split(before),b=split(after);
 // LCS preserves unchanged paragraphs across insertions and deletions.
 const dp=Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const matches=[];let i=0,j=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){matches.push([i,j]);i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;}
 const oldMatched=new Set(matches.map(x=>x[0])),newMatched=new Set(matches.map(x=>x[1]));
 const changedOld=a.map((_,k)=>k).filter(k=>!oldMatched.has(k));
 const changedNew=b.map((_,k)=>k).filter(k=>!newMatched.has(k));
 const affected=new Set(changedNew);
 for(const k of changedNew){if(k>0)affected.add(k-1);if(k+1<b.length)affected.add(k+1);}
 for(const k of changedOld){const previous=matches.filter(([old])=>old<k).at(-1),next=matches.find(([old])=>old>k);if(previous)affected.add(previous[1]);if(next)affected.add(next[1]);}
 return {beforeCount:a.length,afterCount:b.length,changedOld:changedOld.map(k=>k+1),changedNew:changedNew.map(k=>k+1),affected:[...affected].sort((x,y)=>x-y).map(k=>({paragraph:k+1,hash:sha256(b[k]),reason:newMatched.has(k)?'ADJACENT_TO_CHANGE':'CHANGED'})),afterParagraphHashes:b.map(sha256)};
}
export async function auditRepairAcceptance({baseline,plan,decisions,currentInputs,before,links=[],checks=[],file='article.md',release=null}={}){
 if(typeof before!=='string'||!obj(currentInputs)||typeof currentInputs.text!=='string'||!Array.isArray(links)||!Array.isArray(checks))throw Error('Invalid acceptance inputs');
 const repair=await auditRepair({baseline,plan,decisions,currentInputs,file});
 const map=paragraphChangeMap(before,currentInputs.text);
 const affected=new Map(map.affected.map(p=>[p.paragraph,new Set([p.reason])]));
 const seenLinks=new Set();
 for(const link of links){
  if(!obj(link)||!Number.isInteger(link.from)||!Number.isInteger(link.to)||link.from<1||link.to<1||link.from>map.afterCount||link.to>map.afterCount||link.from===link.to||!['argument','evidence','conclusion','transition'].includes(link.kind))throw Error('Invalid dependency link');
  const id=`${link.from}:${link.to}:${link.kind}`;if(seenLinks.has(id))throw Error('Duplicate dependency link');seenLinks.add(id);
 }
 const frontier=[...affected.keys()],visited=new Set(frontier);
 while(frontier.length){const from=frontier.shift();for(const edge of links.filter(x=>x.from===from)){
  if(!affected.has(edge.to))affected.set(edge.to,new Set());affected.get(edge.to).add(`UPSTREAM_${edge.kind.toUpperCase()}_CHANGED`);
  if(!visited.has(edge.to)){visited.add(edge.to);frontier.push(edge.to);}
 }}
 const impacts=[...affected].sort((a,b)=>a[0]-b[0]).map(([paragraph,reasons])=>({paragraph,hash:map.afterParagraphHashes[paragraph-1],reasons:[...reasons].sort()}));
 const required=new Set(impacts.map(x=>x.paragraph)),seen=new Set(),rejected=[];
 for(const check of checks){
  if(!obj(check)||!required.has(check.paragraph)||seen.has(check.paragraph)||!['APPROVE','REJECT'].includes(check.decision)||check.afterHash!==sha256(currentInputs.text)||check.paragraphHash!==map.afterParagraphHashes[check.paragraph-1]||!nonempty(check.reviewer)||!nonempty(check.rationale))throw Error('Invalid, duplicate or stale impact check');
  seen.add(check.paragraph);if(check.decision==='REJECT')rejected.push(check.paragraph);
 }
 const pending=impacts.filter(x=>!seen.has(x.paragraph)).map(x=>x.paragraph);
 let releaseStatus='NOT_REQUESTED',releaseHash=null;
 if(release!==null){if(!obj(release))throw Error('Invalid release configuration');const r=await auditUnifiedRelease({...currentInputs,...release,text:currentInputs.text,before});releaseStatus=r.status;releaseHash=r.reportHash;}
 const status=repair.status==='BLOCKED'||rejected.length||releaseStatus==='BLOCKED'?'BLOCKED':repair.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW'||pending.length||releaseStatus==='INCOMPLETE'?'INCOMPLETE':'READY_FOR_INDEPENDENT_RELEASE_REVIEW';
 const payload={schemaVersion:'8.7',beforeHash:sha256(before),afterHash:sha256(currentInputs.text),repairHash:repair.reportHash,linksHash:digest(links),checksHash:digest(checks),releaseStatus,releaseHash,status,changes:{changedOld:map.changedOld,changedNew:map.changedNew},impacts,pending,rejected,limitations:['Exact paragraph matching and editor-declared links cannot identify all semantic dependencies','Review acceptance does not establish factual truth or authorize publication']};
 return {...payload,reportHash:digest(payload)};
}
export async function verifyRepairAcceptance(inputs,report){const expected=await auditRepairAcceptance(inputs);if(!same(expected,report))throw Error('Repair acceptance report mismatch');return {status:'REPORT_RECOMPUTED',reportHash:expected.reportHash};}
