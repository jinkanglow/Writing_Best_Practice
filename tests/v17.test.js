import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, parseMarkdown } from '../src/core.js';
import { extractRequirementCandidates } from '../src/extraction.js';
const rules=[{id:'A',detector:'literal',phrases:['不得不说'],severity:'warning',scope:['prose','list_item']}];
test('inline code excluded without shifting offsets',()=>{
 const input='这是 `不得不说` 但不得不说';const r=analyze(input,rules);
 assert.equal(r.findings.length,1);
 assert.equal(r.findings[0].startOffset,Buffer.byteLength('这是 `不得不说` 但'));
});
test('list items scanned, block quotes excluded',()=>{
 const input='- 不得不说\n> 不得不说\n    不得不说';
 assert.equal(analyze(input,rules).findings.length,1);
});
test('fence with longer closing delimiter works',()=>{
 assert.equal(analyze('````js\n不得不说\n`````\n不得不说',rules).findings.length,1);
});
test('CRLF positions preserve original bytes',()=>{
 const input='前文\r\n不得不说';
 assert.equal(analyze(input,rules).findings[0].startOffset,Buffer.byteLength('前文\r\n'));
});
test('heuristic extraction requires review',()=>{
 const r=extractRequirementCandidates('# Style\n- 必须保留人物动机\n- 不得编造事实\n- 示例仅供参考');
 assert.equal(r.candidates.length,2);assert.equal(r.status,'REVIEW_REQUIRED');
 assert.equal(r.candidates[1].proposedObligation,'must_not');
});
test('candidate extraction ignores fenced code',()=>{
 const r=extractRequirementCandidates('```md\n- 必须这样写\n```\n- 必须保留结论');
 assert.equal(r.candidates.length,1);
});
test('parser exposes limitations instead of claiming full AST',()=>{
 const p=parseMarkdown('正文\n');assert.equal(p.text,'正文\n');assert.ok(p.limitations.length);
});
