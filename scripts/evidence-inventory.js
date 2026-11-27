import {readdirSync,readFileSync} from 'node:fs';
const root=new URL('../src/',import.meta.url);const rows=[];
for(const file of readdirSync(root).filter(x=>x.endsWith('.js')).sort())for(const [i,line] of readFileSync(new URL(file,root),'utf8').split('\n').entries()){
 const routed=[...line.matchAll(/\b(?:sourceDigest|sourceContains|sourceLocation|strictSourceDigest|strictSourceContains)\s*\(/g)];
 const candidates=[...line.matchAll(/\bsha256\s*\(|\.(?:includes|indexOf|lastIndexOf|split)\s*\(/g)];
 if(routed.length||candidates.length)rows.push({file,line:i+1,routedTokens:routed.length,reviewCandidateTokens:candidates.length,code:line.trim()});
}
console.log(JSON.stringify({method:'lexical inventory; includes non-evidence operations and misses indirect calls; no coverage percentage asserted',routedTokens:rows.reduce((n,r)=>n+r.routedTokens,0),reviewCandidateTokens:rows.reduce((n,r)=>n+r.reviewCandidateTokens,0),rows},null,2));
