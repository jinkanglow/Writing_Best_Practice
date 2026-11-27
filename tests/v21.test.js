import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBenchmark, readBenchmarkJSONL } from '../src/benchmark.js';
import { execFileSync } from 'node:child_process';
const row=(id,gold,prediction,category='fiction')=>({id,gold,prediction,category});
test('confusion matrix counts four classes',()=>{
 const r=evaluateBenchmark([row('1','violation','violation'),row('2','no_violation','violation'),row('3','no_violation','no_violation'),row('4','violation','no_violation')]);
 assert.deepEqual([r.overall.tp,r.overall.fp,r.overall.tn,r.overall.fn],[1,1,1,1]);
 assert.equal(r.overall.precision,.5);assert.equal(r.overall.falsePositiveRate,.5);
});
test('abstention tracked separately and reduces coverage',()=>{
 const r=evaluateBenchmark([row('1','violation','abstain'),row('2','no_violation','no_violation')]);
 assert.equal(r.overall.abstain,1);assert.equal(r.overall.coverage,.5);assert.equal(r.overall.recallOnDecided,null);
});
test('no positive predictions returns null precision',()=>{
 const r=evaluateBenchmark([row('1','no_violation','no_violation')]);assert.equal(r.overall.precision,null);
});
test('reject duplicate ids',()=>assert.throws(()=>evaluateBenchmark([row('x','violation','violation'),row('x','violation','violation')]),/Invalid/));
test('reject unknown labels',()=>assert.throws(()=>evaluateBenchmark([row('x','maybe','violation')]),/Invalid/));
test('reject empty datasets',()=>assert.throws(()=>evaluateBenchmark([]),/nonempty/));
test('category metrics separate',()=>{
 const r=evaluateBenchmark([row('1','violation','violation','zh'),row('2','no_violation','violation','en')]);
 assert.equal(r.byCategory.zh.tp,1);assert.equal(r.byCategory.en.fp,1);
});
test('sample JSONL loads',async()=>{const rows=await readBenchmarkJSONL('benchmarks/sample.jsonl');assert.equal(rows.length,5);});
test('benchmark CLI runs',()=>{
 const output=execFileSync(process.execPath,['bin/writing-quality.js','benchmark','evaluate','benchmarks/sample.jsonl'],{encoding:'utf8'});
 const report=JSON.parse(output);assert.equal(report.overall.total,5);assert.equal(report.overall.abstain,1);
});
