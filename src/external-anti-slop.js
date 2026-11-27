import {parseMarkdown,sha256} from './core.js';

// Adapted editorial signals, not a classifier of authorship. The upstream project's
// blanket prohibitions are intentionally NOT inherited.
export const EXTERNAL_SLOP_SOURCE='https://github.com/jalaalrd/anti-ai-slop-writing';
export const EXTERNAL_SLOP_POLICY='review-only-v1';
const phrases=[
 ['GENERIC-OPENING',/\b(?:in today['’]s (?:fast.paced |ever.changing )?(?:world|landscape)|it['’]s (?:important|worth) to note that|at its core|in the realm of|when it comes to)\b/giu],
 ['GENERIC-CLOSING',/\b(?:in conclusion|at the end of the day|the bottom line is|in a nutshell|without further ado)\b/giu],
 ['MARKETING-INFLATION',/\b(?:unlock the power of|take it to the next level|supercharge your|move the needle|bridge the gap|seamless(?:ly)?|game.chang(?:ing|er))\b/giu],
 ['ASSISTANT-OPENING',/\b(?:certainly|absolutely|great question|i['’]d be happy to|as an ai|as a language model)\b(?=\s*[,!.])/giu],
 ['GENERIC-VOCAB',/\b(?:delv(?:e|es|ing)|tapestry|pivotal|groundbreaking|multifaceted|synerg(?:y|ies))\b/giu]
];
function byteAt(s,i){return Buffer.byteLength(s.slice(0,i),'utf8');}
export function auditExternalAntiSlop(text){
 if(typeof text!=='string')throw new TypeError('Expected text string');
 const findings=[];
 for(const node of parseMarkdown(text).nodes.filter(n=>['prose','list_item'].includes(n.kind))){
  for(const [code,re] of phrases){
   for(const m of node.maskedText.matchAll(re)){
    const start=node.charStart+m.index;
    findings.push({code,level:'LEXICAL',line:node.startLine,startByte:byteAt(text,start),endByte:byteAt(text,start+m[0].length),quote:text.slice(start,start+m[0].length),action:'REVIEW_ONLY'});
   }
  }
 }
 findings.sort((a,b)=>a.startByte-b.startByte||a.code.localeCompare(b.code));
 return {schemaVersion:1,policy:EXTERNAL_SLOP_POLICY,source:EXTERNAL_SLOP_SOURCE,documentHash:sha256(text),status:findings.length?'REVIEW_REQUIRED':'NO_CONFIGURED_SIGNALS',findings,limitations:['Not an AI-authorship detector','Matches are editorial prompts, not automatic deletion orders','No claim of semantic, narrative, or factual verification','Quoted or attributed content must not be rewritten automatically']};
}
export function verifyExternalAntiSlop(text,report){
 const expected=auditExternalAntiSlop(text);
 if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Stale or modified anti-slop report');
 return {status:'VERIFIED',findings:expected.findings.length};
}
