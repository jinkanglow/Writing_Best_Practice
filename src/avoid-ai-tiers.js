import {parseMarkdown,sha256} from './core.js';
import {resolveAvoidAIPolicy} from './avoid-ai-policy.js';

// Independent editorial heuristics. Not an authorship classifier or a mandate to delete qualifiers.
export const TIER_CONTEXTS=['blog','technical-blog','investor-email','docs','casual','cn-explanatory'];
export const TIER_VOICES=['professional','technical','casual','warm','blunt','chinese-explanatory'];
export const TIER_LEXICON={
 en:{
  tier1:['delve','tapestry','beacon','game-changer','cutting-edge','at its core','only time will tell','the future looks bright','it is worth noting that'],
  tier2:['harness','navigate','foster','elevate','unleash','streamline','empower','bolster','spearhead','nuanced','crucial','multifaceted'],
  tier3:['significant','significantly','innovative','innovation','effective','effectively','dynamic','dynamics','scalable','scalability','compelling','unprecedented','remarkable']
 },
 zh:{
  tier1:['在当今社会','随着时代发展','值得我们深思','未来可期','让我们拭目以待','总而言之','综上所述','赋能','着力打造'],
  tier2:['值得注意的是','不可忽视的是','无独有偶','全面深化','持续推进','深入贯彻','闭环','拉通'],
  tier3:['真正的','确实','显著','重要','关键']
 }
};
const byte=(s,i)=>Buffer.byteLength(s.slice(0,i),'utf8');
const byteToChar=(s,n)=>Buffer.from(s,'utf8').subarray(0,n).toString('utf8').length;
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const enBoundary=(s,start,end)=>!/[A-Za-z]/.test(s[start-1]??'')&&!/[A-Za-z]/.test(s[end]??'');
function hits(s,term,lang){
 const re=new RegExp(esc(term),'giu'),out=[];
 for(const m of s.matchAll(re))if(lang==='zh'||enBoundary(s,m.index,m.index+m[0].length))out.push({index:m.index,text:m[0]});
 return out;
}
function paragraphGroups(nodes){
 const groups=[];let current=[];let lastLine=-2;
 for(const n of nodes){
  if(n.startLine!==lastLine+1&&current.length){groups.push(current);current=[];}
  current.push(n);lastLine=n.startLine;
 }
 if(current.length)groups.push(current);
 return groups;
}
export function inspectAvoidAITiers(text,{context='blog',voice='professional',tier3Threshold=null,nonNativeTolerance=false}={}){
 if(typeof text!=='string')throw Error('Expected text');
 if(!TIER_CONTEXTS.includes(context)||!TIER_VOICES.includes(voice))throw Error('Unknown context or voice');
 if(tier3Threshold!==null&&(!Number.isFinite(tier3Threshold)||tier3Threshold<=0||tier3Threshold>1))throw Error('Invalid tier3Threshold');
 const policy=resolveAvoidAIPolicy({context,voice,tier3Threshold,nonNativeTolerance});
 const nodes=parseMarkdown(text).nodes.filter(n=>['prose','list_item'].includes(n.kind));
 const findings=[], all=[];
 for(const node of nodes){
  for(const lang of ['en','zh'])for(const tier of ['tier1','tier2','tier3'])for(const term of TIER_LEXICON[lang][tier])for(const hit of hits(node.maskedText,term,lang)){
   const start=node.charStart+hit.index,end=start+hit.text.length;
   all.push({tier,lang,term,nodeId:node.id,line:node.startLine,startByte:byte(text,start),endByte:byte(text,end),quote:text.slice(start,end)});
  }
 }
 const add=(hit,id,severity,reason)=>findings.push({...hit,id,severity,reason,action:'REVIEW_ONLY'});
 for(const h of all.filter(h=>h.tier==='tier1'&&policy.tier1))add(h,'LEXICON-T1','P1','Potentially formulaic wording; retain if context requires it');
 const groupByLine=new Map();
 for(const [i,group] of paragraphGroups(nodes).entries())for(const node of group)groupByLine.set(node.id,i);
 const clusters=new Map();
 for(const h of all.filter(h=>h.tier==='tier2')){
  const key=`${h.lang}:${groupByLine.get(h.nodeId)}`;
  if(!clusters.has(key))clusters.set(key,[]);clusters.get(key).push(h);
 }
 for(const hitsInGroup of clusters.values())if(policy.tier2Minimum!==null&&hitsInGroup.length>=policy.tier2Minimum)for(const h of hitsInGroup)add(h,'LEXICON-T2-CLUSTER','P2','Two or more Tier 2 occurrences in one paragraph');
 const counts={};
 for(const lang of ['en','zh']){
  const relevant=nodes.map(n=>n.maskedText).join('\n');
  const denominator=lang==='en'?(relevant.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length:(relevant.match(/\p{Script=Han}/gu)||[]).length;
  const tierHits=all.filter(h=>h.lang===lang&&h.tier==='tier3');
  const density=denominator?tierHits.length/denominator:null;
  const threshold=policy.tier3Threshold;
  counts[lang]={units:denominator,tier3Occurrences:tierHits.length,density,threshold};
  if(density!==null&&density>threshold)for(const h of tierHits)add(h,'LEXICON-T3-DENSITY','P2','Tier 3 vocabulary density exceeds configured threshold');
  // Sliding window counts repeated occurrences of the SAME term, not all Tier 3 terms.
  // Use only visible prose/list text. Units are English words or Han characters.
  if(policy.windowRepeat!==null){
   const units=[];const re=lang==='en'?/[A-Za-z]+(?:['’-][A-Za-z]+)*/g:/\p{Script=Han}/gu;
   for(const n of nodes)for(const m of n.maskedText.matchAll(re))units.push({start:n.charStart+m.index,end:n.charStart+m.index+m[0].length});
   const byTerm=new Map();
   for(const h of tierHits){if(!byTerm.has(h.term))byTerm.set(h.term,[]);byTerm.get(h.term).push(h);}
   for(const occurrences of byTerm.values()){
    for(let i=0;i<occurrences.length;i++){
     const h=occurrences[i],index=units.findIndex(u=>u.start<=byteToChar(text,h.startByte)&&u.end>byteToChar(text,h.startByte));
     if(index<0)continue;
     const right=Math.min(units.length,index+policy.windowSize);
     const windowEnd=byte(text,units[right-1].end);
     const repeated=occurrences.filter(x=>x.startByte>=h.startByte&&x.startByte<windowEnd);
     if(repeated.length>=policy.windowRepeat)for(const x of repeated){
      if(!findings.some(f=>f.id==='LEXICON-T3-WINDOW'&&f.startByte===x.startByte&&f.term===x.term))add(x,'LEXICON-T3-WINDOW','P2','Repeated Tier 3 term in a configured sliding window');
     }
    }
   }
  }
 }
 // Exemptions are editorial decisions, not assumptions about author identity.
 findings.sort((a,b)=>a.startByte-b.startByte||a.id.localeCompare(b.id));
 return {schemaVersion:'4.4',documentHash:sha256(text),context,voice,policy,status:findings.length?'REVIEW_REQUIRED':'NO_CONFIGURED_SIGNALS',statistics:counts,findings,limitations:['Vocabulary frequency is not evidence of AI authorship','Density thresholds are configurable editorial heuristics, not validated statistical cutoffs','No automatic removal of uncertainty, attribution, quotes, or terminology','Paragraph grouping uses a conservative Markdown scanner']};
}
export function verifyAvoidAITiers(text,report,options={}){
 const expected=inspectAvoidAITiers(text,options);
 if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Tier audit report differs from recomputation or is stale');
 return {status:'VERIFIED',documentHash:expected.documentHash,findings:expected.findings.length};
}
