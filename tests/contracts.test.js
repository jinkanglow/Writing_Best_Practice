import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSkillContract, fuseContracts, loadSkillContract } from '../src/contracts.js';
import { applyBatch } from '../src/patches.js';
import { proposePatch } from '../src/core.js';

test('reads explicit fenced skill contract',async()=>{
 const c=await loadSkillContract('examples/primary-skill.md');
 assert.equal(c.requirements.length,2);
});
test('rejects skill without machine-readable contract',()=>{
 assert.throws(()=>extractSkillContract('# Skill\nMust be excellent'),/expected exactly one/);
});
test('rejects malformed JSON',()=>{
 assert.throws(()=>extractSkillContract('```writing-contract\n{\n```'),/invalid writing-contract/);
});
test('finds conflicting scopes by intersection',async()=>{
 const a=await loadSkillContract('examples/primary-skill.md');
 const b=await loadSkillContract('examples/constraint-skill.md');
 const report=fuseContracts(a,b);
 assert.equal(report.status,'BLOCKED');
 assert.deepEqual(report.conflicts[0].scope,['chapter-3']);
});
test('does not invent semantic fusion',async()=>{
 const a=await loadSkillContract('examples/primary-skill.md');
 assert.equal(fuseContracts(a,a).status,'NO_EXACT_CONFLICT_FOUND');
});
test('applies two non-overlapping UTF-8 patches',()=>{
 const text='中文 ABC 结尾';
 const a=proposePatch(text,{startOffset:0,endOffset:6,replacementText:'开头'});
 const start=Buffer.byteLength('中文 ABC ');
 const b=proposePatch(text,{startOffset:start,endOffset:Buffer.byteLength(text),replacementText:'结束'});
 assert.equal(applyBatch(text,[b,a]),'开头 ABC 结束');
});
test('rejects overlap without modifying input',()=>{
 const text='abcdef';
 const a=proposePatch(text,{startOffset:0,endOffset:3,replacementText:'A'});
 const b=proposePatch(text,{startOffset:2,endOffset:4,replacementText:'B'});
 assert.throws(()=>applyBatch(text,[a,b]),/Overlapping/);
 assert.equal(text,'abcdef');
});
test('rejects stale batch',()=>{
 const p=proposePatch('hello',{startOffset:0,endOffset:1,replacementText:'H'});
 assert.throws(()=>applyBatch('hello!',[p]),/Stale/);
});
test('rejects codepoint split at patch boundary',()=>{
 const text='中文';
 const p=proposePatch(text,{startOffset:0,endOffset:3,replacementText:'a'});
 p.endOffset=1;
 assert.throws(()=>applyBatch(text,[p]),/UTF-8/);
});
