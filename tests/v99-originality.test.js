import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {auditOriginality as audit,verifyOriginality as verify} from '../src/editorial-originality.js';
const r=JSON.parse(fs.readFileSync(new URL('../rules/editorial-originality.json',import.meta.url)));const a=(s,src=[])=>audit(s,r,src);
test('transition cluster',()=>assert.equal(a('That distinction matters. This is why. The next question is demand.').findings[0].kind,'transitionPatterns'));
test('single legitimate transition',()=>assert.equal(a('That distinction matters.').status,'NO_CONFIGURED_SIGNALS'));
test('qualification cluster',()=>assert.equal(a('A does not establish B. C does not necessarily mean D. E cannot conclude F.').findings[0].kind,'qualificationPatterns'));
test('duplicate paragraph',()=>assert.equal(a('One two three four five six.\n\nOne two three four five six.').findings[0].kind,'repeated-paragraph'));
test('source overlap',()=>assert.equal(a('One two three four five six.',[{id:'s',text:'One two three four five six.'}]).findings[0].kind,'source-overlap-review'));
test('no source is not verified',()=>assert.equal(a('A claim.').sourceReview,'NOT_PERFORMED'));
test('code ignored',()=>assert.equal(a('```txt\nThat distinction matters. This is why. The next question is.\n```').status,'NO_CONFIGURED_SIGNALS'));
test('Chinese signals',()=>assert.equal(a('这一区别很重要。更有用的结论是。下一个问题是。').status,'REVIEW_REQUIRED'));
test('report tampering',()=>assert.throws(()=>verify('A claim.',r,[],{...a('A claim.'),status:'PASS'})));
test('stale source',()=>assert.throws(()=>verify('A claim.',r,[{id:'s',text:'new'}],a('A claim.',[{id:'s',text:'old'}]))));
test('valid report',()=>assert.equal(verify('A claim.',r,[],a('A claim.')).status,'VERIFIED'));
test('invalid source',()=>assert.throws(()=>a('A claim.',[{id:'s',text:''}])));
test('invalid rules',()=>assert.throws(()=>audit('A claim.',{},[])));
test('distinct facts not duplicates',()=>assert.equal(a('One two three four five six.\n\nOne two three four five seven.').status,'NO_CONFIGURED_SIGNALS'));

