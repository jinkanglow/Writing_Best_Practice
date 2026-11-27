/** Deterministic editorial change signals, not a semantic or factual verifier. */
const patterns={
 percentage_point:/[+-]?(?:\d+(?:\.\d+)?)\s*(?:个百分点|percentage\s+points?|pp)/giu,
 percentage:/[+-]?(?:\d+(?:\.\d+)?)\s*(?:%|％|百分之\s*\d+(?:\.\d+)?)/giu,
 currency:/\b(?:USD|MYR|RM|EUR|GBP|CNY|JPY|NT\$|US\$)\s*[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\s*(?:million|billion|trillion|万|亿|万亿))?|(?:美元|人民币|新台币|马币|欧元|英镑|日元)\s*[+-]?(?:\d+(?:\.\d+)?)(?:\s*(?:万|亿|万亿))?/giu,
 relative_period:/同比|环比|较上年同期|较上季度|year[- ]over[- ]year|quarter[- ]over[- ]quarter|month[- ]over[- ]month|\bYoY\b|\bQoQ\b|\bMoM\b/giu,
 negation:/尚未|未曾|没有|并非|不能|无法|不再|未必|不得|不|无|never|not|no longer|cannot|can't|without/giu,
 range:/[+-]?\d+(?:\.\d+)?\s*(?:至|到|—|–|~|～|-)\s*[+-]?\d+(?:\.\d+)?\s*(?:%|％|美元|亿元|元|bp|bps)?/giu,
 ticker:/\b(?:NASDAQ|NYSE|ASX|TWSE|HKEX|KLSE|BMY|LSE)\s*:\s*[A-Z0-9.\-]{1,12}\b/gu
};
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const tokens=(s,re)=>[...s.matchAll(re)].map(m=>m[0].trim());
const diff=(a,b)=>{const c=new Map();for(const t of a)c.set(t,(c.get(t)||0)+1);for(const t of b)c.set(t,(c.get(t)||0)-1);return [...c].filter(([,n])=>n).map(([token,delta])=>({token,delta}));};
/** Compare exactly the human-approved edit spans. Return risk categories and evidence. */
export function inspectNumericalIntegrity(changes){
 if(!Array.isArray(changes))throw Error('Expected changes array');
 const findings=[];
 for(const change of changes){
  if(!isObject(change)||typeof change.before!=='string'||typeof change.after!=='string'||typeof change.taskId!=='string')throw Error('Invalid change');
  for(const [category,re] of Object.entries(patterns)){
   const changed=diff(tokens(change.before,re),tokens(change.after,re));
   if(changed.length)findings.push({taskId:change.taskId,category,removed:changed.filter(x=>x.delta>0),added:changed.filter(x=>x.delta<0),review:'REQUIRED'});
  }
 }
 return findings;
}
