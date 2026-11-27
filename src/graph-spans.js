import {sha256} from './core.js';
const enc=new TextEncoder();
export const byteLength=s=>enc.encode(s).length;
export function quoteSpan(text,quote){
 if(typeof quote!=='string'||!quote.trim())throw Error('Empty quote');
 const first=text.indexOf(quote);
 if(first<0)throw Error('Quote not present');
 if(text.indexOf(quote,first+quote.length)>=0)throw Error('Ambiguous quote; provide a uniquely located excerpt');
 return {startByte:byteLength(text.slice(0,first)),endByte:byteLength(text.slice(0,first+quote.length)),quoteHash:sha256(quote)};
}
export function verifyQuoteSpan(text,quote,span){
 if(!span||!Number.isSafeInteger(span.startByte)||!Number.isSafeInteger(span.endByte)||span.startByte<0||span.endByte<=span.startByte||span.endByte>byteLength(text))throw Error('Invalid byte span');
 const bytes=enc.encode(text),value=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(span.startByte,span.endByte));
 if(value!==quote||span.quoteHash!==sha256(quote))throw Error('Stale or fabricated quote span');
 return true;
}
export function candidateWindows(text,{maxQuotes=200}={}){
 if(typeof text!=='string'||!text.trim())throw Error('Nonempty source text required');
 if(!Number.isSafeInteger(maxQuotes)||maxQuotes<1||maxQuotes>1000)throw Error('Invalid maxQuotes');
 const lines=text.split('\n');let offset=0,code=false,frontmatter=lines[0]?.trim()==='---';let inFront=frontmatter;
 const eligible=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i],trim=line.trim(),start=offset;offset+=byteLength(line)+(i<lines.length-1?1:0);
  if(i===0&&frontmatter)continue;
  if(inFront){if(trim==='---')inFront=false;continue;}
  if(/^\s*(```|~~~)/.test(line)){code=!code;continue;}
  if(code||!trim||/^\s*(?:#|>|[-*+]\s|\d+[.)]\s|<!--)/.test(line))continue;
  if(trim.length<12||trim.length>500)continue;
  const prefix=line.indexOf(trim),startByte=start+byteLength(line.slice(0,prefix));
  eligible.push({quote:trim,startByte,endByte:startByte+byteLength(trim),line:i+1});
 }
 const candidates=[];
 for(const item of eligible){if(candidates.length>=maxQuotes)break;const span={startByte:item.startByte,endByte:item.endByte,quoteHash:sha256(item.quote)};
  candidates.push({id:`q${candidates.length+1}`,quote:item.quote,offset:item.startByte,span,role:'unclassified',line:item.line});
 }
 return candidates;
}
