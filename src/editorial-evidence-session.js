import {AsyncLocalStorage} from 'node:async_hooks';
import {evidenceStore} from './editorial-native.js';
const storage=new AsyncLocalStorage();
function newState(){return {store:evidenceStore(),sources:new Map(),quotes:new Map(),stats:{sourceHashes:0,quoteChecks:0,cacheHits:0}};}
export async function evidenceSession(fn){const state=newState();const result=await storage.run(state,fn);return {result,stats:{...state.stats}};}
export function sourceDigest(text){const s=storage.getStore();if(!s)return storage.run(newState(),()=>sourceDigest(text));if(s.sources.has(text)){s.stats.cacheHits++;return s.sources.get(text);}const h=s.store.register(JSON.stringify(text),text);s.sources.set(text,h);s.stats.sourceHashes++;return h;}
export function sourceContains(text,quote){const s=storage.getStore();if(!s)return storage.run(newState(),()=>sourceContains(text,quote));const key=JSON.stringify([text,quote]);if(s.quotes.has(key)){s.stats.cacheHits++;return s.quotes.get(key);}const digest=s.store.register(JSON.stringify(text),text);const found=quote? s.store.check(JSON.stringify(text),quote,digest):text.includes(quote);s.quotes.set(key,found);s.stats.quoteChecks++;return found;}
export function requireEvidenceSession(){if(!storage.getStore())throw Error('Evidence session required');}
export function strictSourceDigest(text){requireEvidenceSession();return sourceDigest(text);}
export function strictSourceContains(text,quote){requireEvidenceSession();return sourceContains(text,quote);}

// Preserve both legacy uniqueness semantics (overlapping vs non-overlapping).
export function sourceLocation(text,quote){sourceContains(text,quote);return {first:text.indexOf(quote),last:text.lastIndexOf(quote),nonOverlapping:text.split(quote).length-1};}
