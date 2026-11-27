#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {auditFusionPlan,verifyFusionPlan} from '../src/fusion-plan.js';
const [command,...args]=process.argv.slice(2);
const flag = name => {const i=args.indexOf(`--${name}`);return i<0?null:args[i+1]};
try {
  if(!['audit','verify'].includes(command)||!flag('plan')||(command==='verify'&&!flag('report'))) throw new Error('Usage: fusion-plan audit --plan FILE [--output FILE] | verify --plan FILE --report FILE');
  const plan=JSON.parse(await readFile(flag('plan'),'utf8'));
  const result=command==='audit'?auditFusionPlan(plan):verifyFusionPlan(plan,JSON.parse(await readFile(flag('report'),'utf8')));
  if(flag('output')) {await mkdir(dirname(flag('output')),{recursive:true});await writeFile(flag('output'),JSON.stringify(result,null,2)+'\n');}
  console.log(JSON.stringify(result,null,2));
  if(result.status==='BLOCKED'||result.status==='INVALID_REPORT')process.exitCode=4;
} catch(e) {console.error('Fusion plan error: '+e.message);process.exitCode=2;}
