import {sha256} from './core.js';
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const idOK=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(x);
const byteOffset=(text,index)=>Buffer.byteLength(text.slice(0,index),'utf8');
function occurrences(text,quote){const found=[];let at=0;while((at=text.indexOf(quote,at))!==-1){found.push({startOffset:byteOffset(text,at),endOffset:byteOffset(text,at+quote.length)});at+=quote.length;}return found;}
export function auditEditorialSafety(before,after,inventory){
 if(typeof before!=='string'||typeof after!=='string'||!Array.isArray(inventory))throw Error('Expected two documents and an inventory array');
 const seen=new Set(),items=[];
 for(const entry of inventory){
  if(!isObj(entry)||!idOK(entry.id)||seen.has(entry.id)||!['qualification','attribution','risk','technical_term','fact','claim','causal_link','character_state'].includes(entry.kind)||typeof entry.quote!=='string'||!entry.quote.trim())throw Error('Invalid or duplicate editorial safety inventory item');
  seen.add(entry.id);
  const beforeHits=occurrences(before,entry.quote),afterHits=occurrences(after,entry.quote);
  if(beforeHits.length!==1)throw Error(`Inventory quote must occur exactly once in original: ${entry.id}`);
  items.push({id:entry.id,kind:entry.kind,quoteHash:sha256(entry.quote),beforeSpan:beforeHits[0],afterSpans:afterHits,status:afterHits.length===1?'TEXT_RETAINED':'REVIEW_REQUIRED',reason:afterHits.length===0?'DECLARED_TEXT_REMOVED':afterHits.length>1?'DECLARED_TEXT_DUPLICATED':'EXACT_QUOTE_PRESENT'});
 }
 return {schemaVersion:'3.4',beforeHash:sha256(before),afterHash:sha256(after),inventoryHash:sha256(JSON.stringify(inventory)),status:items.some(i=>i.status==='REVIEW_REQUIRED')?'INCOMPLETE':'TEXT_CHECK_COMPLETE',items,limitations:['Exact text retention does not establish semantic preservation','Inventory is explicitly supplied; omitted facts and qualifiers cannot be discovered','A retained quote may change meaning when its surrounding context changes']};
}
export function verifyEditorialSafety(before,after,inventory,report){
 if(!isObj(report)||report.schemaVersion!=='3.4')throw Error('Invalid editorial safety report');
 const expected=auditEditorialSafety(before,after,inventory);
 for(const key of ['beforeHash','afterHash','inventoryHash','status'])if(report[key]!==expected[key])throw Error(`Editorial safety ${key} mismatch`);
 if(JSON.stringify(report.items)!==JSON.stringify(expected.items))throw Error('Editorial safety findings mismatch');
 return {status:'REPORT_RECOMPUTED',items:expected.items.length,reviewRequired:expected.items.filter(i=>i.status==='REVIEW_REQUIRED').length};
}
