import test from 'node:test';
import assert from 'node:assert/strict';
import {smoke} from '../scripts/production-smoke.js';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
test('v9.5 production smoke covers errors, incomplete decision, verification, tampering and regression',async()=>{
 const result=await smoke();assert.equal(result.status,'PASS');assert.equal(result.checks,6);assert.equal(result.qualification,'NOT_READY');
});
test('v9.5 package declares supported runtime and binary',async()=>{
 const pkg=JSON.parse(await readFile(`${root}/package.json`,'utf8'));
 assert.equal(pkg.engines.node,'>=20');assert.equal(pkg.bin['writing-quality'],'./bin/writing-quality.js');assert.match(pkg.version,/^(?:9\.(?:[5-9]|[1-9][0-9]+)|(?:[1-9][0-9]+)\.[0-9]+)\.[0-9]+$/);
});
