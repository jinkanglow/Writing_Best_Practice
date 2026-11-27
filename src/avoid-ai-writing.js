import {parseMarkdown,sha256} from './core.js';

// Editorial heuristics, not AI authorship classification. Never remove uncertainty or attribution automatically.
export const AVOID_AI_PROFILES=['blog','technical-blog','investor-email','docs','casual','cn-explanatory'];
const patterns=[
 ['CN-FORMULA','P1','zh',/在当今社会|随着时代发展|随着时代的发展|值得我们深思|未来可期|让我们拭目以待|总而言之|综上所述/gu,'Replace generic framing with a concrete observation'],
 ['CN-INFLATION','P1','zh',/具有里程碑意义|谱写.{0,12}新篇章|标志着.{0,24}新时代|着力打造|赋能/gu,'State the measurable change or actual action'],
 ['CN-PSEUDO-CONTRAST','P2','zh',/与其说是[^。！？\n]{1,65}不如说是|这不是[^。！？\n]{1,65}而是/gu,'Review whether both sides convey a substantive contrast'],
 ['EN-CHATBOT','P0','en',/\b(?:I hope this helps|Great question|Let['’]s dive in|As of my last update)\b/giu,'Remove assistant-facing artifacts'],
 ['EN-FORMULA','P1','en',/\b(?:it is worth noting that|in today['’]s fast-paced world|at the end of the day|only time will tell|the future looks bright)\b/giu,'Replace generic framing with specifics'],
 ['EN-INFLATION','P2','en',/\b(?:delve into|tapestry|game.changer|paradigm.shift|cutting.edge|leverage)\b/giu,'Review whether this is the most precise term'],
 ['EN-VAGUE-SOURCE','P1','en',/\b(?:experts believe|studies show|research suggests)\b/giu,'Name the source or verify the attribution'],
 ['CN-VAGUE-SOURCE','P1','zh',/专家认为|研究表明|有研究指出/gu,'Identify the specific study or source']
];
const b=(s,i)=>Buffer.byteLength(s.slice(0,i),'utf8');
function segments(masked){return [...masked.matchAll(/[\p{Script=Han}]+|[A-Za-z][A-Za-z'-]*/gu)];}
function enabled(lang,segment){return lang==='zh'?/[\p{Script=Han}]/u.test(segment):/[A-Za-z]/u.test(segment);}
export function detectAvoidAI(text,{context='blog'}={}){
 if(typeof text!=='string')throw Error('Expected text');
 if(!AVOID_AI_PROFILES.includes(context))throw Error('Unknown context');
 const findings=[];const nodes=parseMarkdown(text).nodes.filter(n=>['prose','list_item'].includes(n.kind));
 for(const node of nodes){
  const masked=node.maskedText;
  for(const [id,severity,language,re,message] of patterns){
   for(const m of masked.matchAll(re)){
    if(!enabled(language,m[0]))continue;
    // English terms in Chinese prose still receive review; language boundaries are enforced by script.
    const start=node.charStart+m.index,end=start+m[0].length;
    findings.push({id,severity,language,line:node.startLine,nodeId:node.id,startByte:b(text,start),endByte:b(text,end),quote:text.slice(start,end),recommendation:message,action:'REVIEW_ONLY'});
   }
  }
  // Chinese exclamation marks: flag in explanatory contexts; don't treat quotes as editable.
  if(context==='cn-explanatory'||context==='investor-email')for(const m of masked.matchAll(/！/gu)){
   const start=node.charStart+m.index;findings.push({id:'CN-EXCLAMATION',severity:'P2',language:'zh',line:node.startLine,nodeId:node.id,startByte:b(text,start),endByte:b(text,start+1),quote:'！',recommendation:'Review whether emphasis is necessary',action:'REVIEW_ONLY'});
  }
 }
 findings.sort((x,y)=>x.startByte-y.startByte||x.id.localeCompare(y.id));
 const counts=Object.fromEntries(['P0','P1','P2'].map(x=>[x,findings.filter(f=>f.severity===x).length]));
 return {schemaVersion:'4.2',documentHash:sha256(text),context,status:findings.length?'REVIEW_REQUIRED':'NO_CONFIGURED_SIGNALS',counts,findings,limitations:['Not an AI authorship detector','Heuristics may flag legitimate terminology and prose','No automatic removal of hedges, sources, quotations, or technical terms','Markdown parsing is not full CommonMark']};
}
export function verifyAvoidAI(text,report,{context='blog'}={}){
 const expected=detectAvoidAI(text,{context});
 if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Avoid-AI report differs from recomputation or is stale');
 return {status:'VERIFIED',documentHash:expected.documentHash,findings:expected.findings.length};
}
