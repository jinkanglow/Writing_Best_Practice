// Deterministic evaluation of externally labelled semantic findings.
// A prediction is positive only when it explicitly asserts a violation;
// abstentions are measured separately and never counted as correct negatives.
import { readFile } from 'node:fs/promises';
const validGold = new Set(['violation','no_violation']);
const validPrediction = new Set(['violation','no_violation','abstain']);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const ratio = (n,d) => d ? n/d : null;
export function evaluateBenchmark(rows) {
  if (!Array.isArray(rows) || rows.length===0) throw new Error('Benchmark must be a nonempty array');
  const seen = new Set(), byCategory = new Map();
  const make = () => ({tp:0,fp:0,tn:0,fn:0,abstain:0,total:0});
  const all = make();
  for (const row of rows) {
    if (!object(row) || typeof row.id!=='string' || !row.id.trim() || seen.has(row.id) || typeof row.category!=='string' || !row.category.trim() || !validGold.has(row.gold) || !validPrediction.has(row.prediction)) throw new Error(`Invalid benchmark row: ${row?.id ?? '<unknown>'}`);
    seen.add(row.id);
    const bucket = byCategory.get(row.category) ?? make();
    byCategory.set(row.category,bucket);
    for (const c of [all,bucket]) {
      c.total++;
      if(row.prediction==='abstain') c.abstain++;
      else if(row.gold==='violation' && row.prediction==='violation') c.tp++;
      else if(row.gold==='violation') c.fn++;
      else if(row.prediction==='violation') c.fp++;
      else c.tn++;
    }
  }
  const summary = c => ({...c,coverage:ratio(c.total-c.abstain,c.total),precision:ratio(c.tp,c.tp+c.fp),recallOnDecided:ratio(c.tp,c.tp+c.fn),falsePositiveRate:ratio(c.fp,c.fp+c.tn),note:'Recall excludes abstentions; report coverage alongside it. Null means denominator is zero.'});
  return {schemaVersion:'2.1',status:'EVALUATED',overall:summary(all),byCategory:Object.fromEntries([...byCategory].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,summary(v)])),limitations:['Labels are supplied externally and are not independently verified','Metrics do not establish generalization to other languages, genres or distributions']};
}
export async function readBenchmarkJSONL(path) {
  const input=await readFile(path,'utf8');
  const lines=input.split(/\r?\n/).filter(s=>s.trim());
  return lines.map((line,i)=>{try{return JSON.parse(line);}catch{throw new Error(`Invalid JSONL at line ${i+1}`);}});
}
