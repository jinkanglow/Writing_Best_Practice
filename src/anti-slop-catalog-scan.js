import {parseMarkdown,sha256} from './core.js';
const byte=(s,i)=>Buffer.byteLength(s.slice(0,i),'utf8');
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const word=c=>/[A-Za-z0-9]/.test(c||'');
export function scanCatalog(text,catalog,{profile='analytical-nonfiction',strict=false}={}){
 if(typeof text!=='string')throw Error('text must be a string');
 if(!catalog||!['vocabulary','phrases','openers'].every(k=>Array.isArray(catalog[k])&&catalog[k].every(x=>typeof x==='string'&&x.trim())))throw Error('Invalid anti-slop catalog');
 if(typeof profile!=='string'||!profile.trim())throw Error('Invalid profile');
 const findings=[],seen=new Set();
 for(const node of parseMarkdown(text).nodes){
  if(!['prose','list_item'].includes(node.kind))continue;
  const masked=node.maskedText;
  for(const [category,items] of [['vocabulary',catalog.vocabulary],['phrases',catalog.phrases],['openers',catalog.openers]]){
   for(const term of items){
    const re=new RegExp(escape(term).replace(/\\ /g,'\\s+'),'giu');
    for(const match of masked.matchAll(re)){
     const start=match.index,end=start+match[0].length;
     if(word(term[0])&&word(masked[start-1]))continue;
     if(word(term.at(-1))&&word(masked[end]))continue;
     if(category==='openers' && masked.slice(0,start).trim()!=='')continue;
     const absolute=node.charStart+start, key=`${absolute}:${end-start}:${category}`;
     if(seen.has(key))continue;seen.add(key);
     const contextSensitive=/^(landscape|robust|comprehensive|nuanced|leverage|epic|testament|critical|crucial)$/i.test(term);
     findings.push({category,term,quote:text.slice(absolute,absolute+match[0].length),line:node.startLine,startByte:byte(text,absolute),endByte:byte(text,absolute+match[0].length),severity:contextSensitive?'CONTEXT_REVIEW':'STYLE_REVIEW',action:'REVIEW_ONLY'});
    }
   }
  }
 }
 findings.sort((a,b)=>a.startByte-b.startByte||a.category.localeCompare(b.category)||a.term.localeCompare(b.term));
 return {schemaVersion:'1.0',documentHash:sha256(text),catalogHash:sha256(JSON.stringify(catalog)),profile,strict,status:findings.length?'REVIEW_REQUIRED':'NO_CONFIGURED_MATCHES',findings,counts:{total:findings.length,contextReview:findings.filter(f=>f.severity==='CONTEXT_REVIEW').length},limitations:['A matched phrase is not proof of AI authorship','Contextual uses, names, and domain terms require human judgment','No semantic repetition or literary merit scoring','Only Markdown prose and list items are scanned']};
}
export function verifyCatalogScan(text,catalog,report,options={}){
 const actual=scanCatalog(text,catalog,options);
 if(JSON.stringify(actual)!==JSON.stringify(report))throw Error('Report stale or modified');
 return {status:'VERIFIED',findings:actual.findings.length};
}
