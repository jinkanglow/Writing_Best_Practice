import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const fail=(s)=>{console.error(s);process.exitCode=1;};
const skill=read('SKILL.md');
const refs=[...skill.matchAll(/`(references\/[^`]+\.md)`/g)].map(x=>x[1]);
for(const f of refs)if(!fs.existsSync(path.join(root,f)))fail(`Missing reference: ${f}`);
const catalog=JSON.parse(read('rules/anti-slop-catalog.json'));
const schema=JSON.parse(read('schemas/anti-slop-catalog.schema.json'));
for(const key of schema.required)if(!(key in catalog))fail(`Missing catalog key: ${key}`);
for(const key of ['vocabulary','phrases','openers']){
 if(!Array.isArray(catalog[key])||catalog[key].some(x=>typeof x!=='string'||!x.trim()))fail(`Invalid ${key}`);
 if(new Set(catalog[key].map(x=>x.toLowerCase())).size!==catalog[key].length)fail(`Duplicate ${key}`);
}
for(const file of fs.readdirSync(path.join(root,'profiles')).filter(x=>x.endsWith('.json'))){JSON.parse(read('profiles/'+file));}
for(const file of fs.readdirSync(path.join(root,'references')).filter(x=>x.endsWith('.md'))){
 const s=read('references/'+file);
 if(!s.trim().startsWith('#'))fail(`Reference missing heading: ${file}`);
}
if(!process.exitCode)console.log(`KNOWLEDGE_OK references=${fs.readdirSync(path.join(root,'references')).length} profiles=${fs.readdirSync(path.join(root,'profiles')).length} vocabulary=${catalog.vocabulary.length} phrases=${catalog.phrases.length}`);
