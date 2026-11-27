import {sourceDigest,sourceContains} from './editorial-evidence-session.js';
import {parseMarkdown,sha256} from './core.js';
const tokens=s=>s.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
const prose=s=>parseMarkdown(s).nodes.filter(n=>n.kind==='prose').map(n=>({text:n.maskedText.trim(),line:n.startLine})).filter(n=>n.text);
const norm=s=>tokens(s).join(' ');
export function auditOriginality(text,rules,sources=[]){
 if(typeof text!=='string'||!text.trim()||!Array.isArray(sources)||sources.some(s=>!s||typeof s.id!=='string'||!s.id.trim()||typeof s.text!=='string'||!s.text.trim())||new Set(sources.map(s=>s.id)).size!==sources.length)throw Error('Invalid draft or sources');
 const t=rules?.thresholds;if(!t||!['transitionPatterns','qualificationPatterns'].every(k=>Array.isArray(rules[k])&&rules[k].every(x=>typeof x==='string'&&x.trim()))||!['transitionCount','qualificationCount','minimumSharedTokens'].every(k=>Number.isInteger(t[k])&&t[k]>0)||!(t.sourceOverlap>0&&t.sourceOverlap<=1))throw Error('Invalid rules');
 const paragraphs=prose(text),findings=[];
 for(const [key,threshold] of [['transitionPatterns',t.transitionCount],['qualificationPatterns',t.qualificationCount]]){
 const hits=[];for(const p of paragraphs)for(const pattern of rules[key]){const escaped=pattern.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re=new RegExp((/^[a-z]/i.test(pattern)?'\\b':'')+escaped+(/[a-z]$/i.test(pattern)?'\\b':''),'giu');for(const m of p.text.matchAll(re))hits.push({line:p.line,pattern});}
 if(hits.length>=threshold)findings.push({kind:key,hits});}
 const seen=new Map();for(const p of paragraphs){const n=norm(p.text);if(tokens(p.text).length<t.minimumSharedTokens)continue;if(seen.has(n))findings.push({kind:'repeated-paragraph',lines:[seen.get(n),p.line]});else seen.set(n,p.line);}
 const sourceMatches=[];for(const source of sources){for(const a of paragraphs){const x=new Set(tokens(a.text));if(x.size<t.minimumSharedTokens)continue;for(const b of prose(source.text)){const y=new Set(tokens(b.text));const shared=[...x].filter(w=>y.has(w)).length;const score=shared/new Set([...x,...y]).size;if(shared>=t.minimumSharedTokens&&score>=t.sourceOverlap)sourceMatches.push({sourceId:source.id,draftLine:a.line,sourceLine:b.line,shared,score});}}}
 if(sourceMatches.length)findings.push({kind:'source-overlap-review',matches:sourceMatches});
 return {version:1,draftHash:sha256(text),rulesHash:sha256(JSON.stringify(rules)),sources:sources.map(s=>({id:s.id,hash:sourceDigest(s.text)})),status:findings.length?'REVIEW_REQUIRED':'NO_CONFIGURED_SIGNALS',sourceReview:sources.length?'COMPARISON_ONLY':'NOT_PERFORMED',findings,semanticReview:'REQUIRED',limitations:['Signals are not authorship or plagiarism determinations.','Exact paragraph repetition and token overlap miss paraphrase and conceptual dependence.','Thresholds are editorial defaults, not validated detection metrics.']};
}
export function verifyOriginality(text,rules,sources,report){if(JSON.stringify(auditOriginality(text,rules,sources))!==JSON.stringify(report))throw Error('Stale or modified report');return {status:'VERIFIED'};}

