import {parseMarkdown,sha256} from './core.js';

// Original, configurable editorial heuristics. These are not AI-authorship detectors.
export const DEFAULT_STYLE_POLICY=Object.freeze({
  version:'3.3',
  openers:['moreover','furthermore','additionally','in conclusion','值得注意的是','总而言之'],
  phrases:['it is worth noting that','in today\'s fast-paced world','在当今快速变化的时代','值得我们深思'],
  maxEmDashesPerParagraph:2,
  maxExclamationsPerParagraph:2,
  repeatedOpenerThreshold:3,
  minSentencesForRepetition:4
});
const validInt=(x)=>Number.isInteger(x)&&x>=0&&x<=1000;
export function validateStylePolicy(policy){
 if(!policy||typeof policy!=='object'||Array.isArray(policy))throw Error('Invalid style policy');
 for(const k of ['openers','phrases'])if(!Array.isArray(policy[k])||policy[k].some(x=>typeof x!=='string'||!x.trim()))throw Error(`Invalid style policy ${k}`);
 for(const k of ['maxEmDashesPerParagraph','maxExclamationsPerParagraph','repeatedOpenerThreshold','minSentencesForRepetition'])if(!validInt(policy[k]))throw Error(`Invalid style policy ${k}`);
 return policy;
}
const charByte=(text,pos)=>Buffer.byteLength(text.slice(0,pos),'utf8');
function makeFinding(text,node,localStart,localEnd,id,message){
 const start=node.charStart+localStart,end=node.charStart+localEnd;
 return {ruleId:id,severity:'warning',nodeId:node.id,line:node.startLine,startOffset:charByte(text,start),endOffset:charByte(text,end),match:text.slice(start,end),explanation:message,confidence:'HEURISTIC_REVIEW_ONLY'};
}
export function inspectStyle(text,policy=DEFAULT_STYLE_POLICY){
 if(typeof text!=='string')throw Error('Expected document text');validateStylePolicy(policy);
 const doc=parseMarkdown(text),findings=[];
 const nodes=doc.nodes.filter(n=>['prose','list_item'].includes(n.kind));
 for(const node of nodes){
  const masked=node.maskedText;
  for(const phrase of policy.phrases){
   let from=0;const lower=masked.toLocaleLowerCase(),target=phrase.toLocaleLowerCase();
   while(true){const at=lower.indexOf(target,from);if(at<0)break;findings.push(makeFinding(text,node,at,at+phrase.length,'STYLE-STOCK-PHRASE','Formulaic expression; assess in context'));from=at+Math.max(1,phrase.length);}
  }
  for(const [symbol,limit,id] of [['—',policy.maxEmDashesPerParagraph,'STYLE-EM-DASH'],['!',policy.maxExclamationsPerParagraph,'STYLE-EXCLAMATION']]){
   const positions=[...masked.matchAll(new RegExp(symbol==='!'?'!':'—','gu'))].map(m=>m.index);
   if(positions.length>limit)for(const at of positions.slice(limit))findings.push(makeFinding(text,node,at,at+symbol.length,id,`More than ${limit} occurrences in a Markdown text node; editorial review only`));
  }
  // Sentence-initial markers: do not flag every occurrence in ordinary prose.
  const boundaries=[0,...[...masked.matchAll(/[.!?。！？]\s*/gu)].map(m=>m.index+m[0].length)];
  for(const at of boundaries){
   const tail=masked.slice(at),prefix=tail.match(/^\s*/u)?.[0].length??0;
   for(const opener of policy.openers){const begin=at+prefix;const rest=masked.slice(begin);if(rest.toLocaleLowerCase().startsWith(opener.toLocaleLowerCase())&&(!/^[a-z]/i.test(opener)||!/[a-z]/i.test(rest[opener.length]??''))){findings.push(makeFinding(text,node,begin,begin+opener.length,'STYLE-FORMULAIC-OPENER','Conventional transition; review necessity'));break;}}
  }
 }
 const sentenceStarts=[];
 for(const node of nodes){
  for(const m of node.maskedText.matchAll(/(?:^|[.!?。！？]\s+)([A-Za-z]{3,})(?=\s)/gu))sentenceStarts.push({word:m[1].toLowerCase(),node,at:m.index+m[0].lastIndexOf(m[1])});
 }
 if(sentenceStarts.length>=policy.minSentencesForRepetition){
  const grouped=new Map();for(const x of sentenceStarts){if(!grouped.has(x.word))grouped.set(x.word,[]);grouped.get(x.word).push(x);}
  for(const [word,items] of grouped)if(items.length>=policy.repeatedOpenerThreshold)for(const x of items.slice(policy.repeatedOpenerThreshold-1))findings.push(makeFinding(text,x.node,x.at,x.at+word.length,'STYLE-REPEATED-START',`Sentence opener '${word}' repeats ${items.length} times`));
 }
 findings.sort((a,b)=>a.startOffset-b.startOffset||a.ruleId.localeCompare(b.ruleId));
 return {schemaVersion:'3.3',documentHash:sha256(text),policyHash:sha256(JSON.stringify(policy)),status:findings.length?'REVIEW_REQUIRED':'NO_CONFIGURED_SIGNALS',findings,limitations:['Style signals do not identify AI authorship','Heuristic counts depend on Markdown line segmentation','No factual accuracy or semantic quality determination']};
}
