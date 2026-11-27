#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const run=(script,args,expected)=>{
 const p=spawnSync(process.execPath,[join(root,script),...args],{cwd:root,encoding:'utf8',timeout:30000});
 if(p.error||p.status!==expected)throw Error(`${script} expected exit ${expected}, got ${p.status}: ${p.error?.message??p.stderr}`);
 return p;
};
export async function smoke(){
 const dir=await mkdtemp(join(tmpdir(),'writing-production-'));
 try{
  const registry=join(dir,'registry.json'),report=join(dir,'qualification.json');
  const governance='benchmarks/editorial/governance-policy.example.json';
  const bias='benchmarks/editorial/bias-policy.example.json';
  const cli='scripts/editorial-qualification.js';
  run(cli,['audit','--registry',registry,'--governance-policy',governance,'--bias-policy',bias,'--output',report],2);
  const sample=JSON.parse(await readFile(join(root,'examples/governance/registry.example.json'),'utf8'));
  await writeFile(registry,JSON.stringify(sample));
  const audited=run(cli,['audit','--registry',registry,'--governance-policy',governance,'--bias-policy',bias,'--output',report],4);
  const result=JSON.parse(await readFile(report,'utf8'));
  if(result.status==='QUALIFIED')throw Error('Synthetic example unexpectedly qualified');
  run(cli,['verify','--registry',registry,'--governance-policy',governance,'--bias-policy',bias,'--report',report],0);
  const bad=join(dir,'tampered.json');await writeFile(bad,JSON.stringify({...result,status:'QUALIFIED'}));
  run(cli,['verify','--registry',registry,'--governance-policy',governance,'--bias-policy',bias,'--report',bad],2);
  const regression=join(dir,'regression.json');
  run('scripts/editorial-regression.js',['run','--suite','benchmarks/acceptance/cases.json','--output',regression],0);
  run('scripts/editorial-regression.js',['verify','--suite','benchmarks/acceptance/cases.json','--report',regression],0);
  return {status:'PASS',checks:6,qualification:result.status,regression:'PASS',audit:JSON.parse(audited.stdout).status};
 }finally{await rm(dir,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 smoke().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
