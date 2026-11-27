import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdown, analyze, validateRules, fuse, proposePatch, applyPatch } from '../src/core.js';
const rules = [{id:'R1',detector:'literal',phrases:['不得不说'],severity:'warning',scope:['prose']}];
test('Chinese byte offsets and source lines', () => {
 const text='标题\n不得不说'; const report=analyze(text,rules);
 assert.equal(report.findings[0].startOffset,Buffer.byteLength('标题\n'));
 assert.equal(report.findings[0].line,2);
});
test('exclude quotation and fenced code', () => {
 const text='> 不得不说\n```\n不得不说\n```\n不得不说';
 assert.equal(analyze(text,rules).findings.length,1);
});
test('supports tilde fences', () => {
 assert.equal(analyze('~~~\n不得不说\n~~~',rules).findings.length,0);
});
test('reject duplicate rules and unsupported detector', () => {
 assert.throws(()=>validateRules([...rules,...rules]));
 assert.throws(()=>validateRules([{...rules[0],detector:'model'}]));
});
test('detect exact fusion conflict', () => {
 const a={requirements:[{id:'a',scope:'ending',value:'dialogue',obligation:'must'}]};
 const b={requirements:[{id:'b',scope:'ending',value:'dialogue',obligation:'must_not'}]};
 assert.equal(fuse(a,b).status,'BLOCKED');
});
test('does not claim semantic fusion resolution', () => {
 assert.equal(fuse({requirements:[]},{requirements:[]}).status,'RESOLVED_EXACT_ONLY');
});
test('patch UTF-8 bytes without overwriting source', () => {
 const original='前言\n不得不说'; const start=Buffer.byteLength('前言\n');
 const patch=proposePatch(original,{startOffset:start,endOffset:Buffer.byteLength(original),replacementText:'具体来说'});
 assert.equal(applyPatch(original,patch),'前言\n具体来说');
 assert.throws(()=>applyPatch(original+'!',patch),/Stale/);
});
test('reject patch splitting UTF-8 characters', () => {
 assert.throws(()=>proposePatch('中文',{startOffset:1,endOffset:3,replacementText:'X'}));
});
test('parser preserves original text', () => {
 const text='---\na: b\n---\n# Title\n\n正文\n';
 assert.equal(parseMarkdown(text).text,text);
 assert.equal(parseMarkdown(text).nodes[1].kind,'frontmatter');
});
