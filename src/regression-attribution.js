import {analyze,sha256,applyPatch,validateRules} from './core.js';
import {inspectStyle,DEFAULT_STYLE_POLICY} from './style-signals.js';
import {validateBatch,applyBatch} from './patches.js';
const signature=f=>JSON.stringify([f.ruleId,f.severity,f.match]);
const counts=items=>{const m=new Map();for(const f of items)m.set(signature(f),(m.get(signature(f))??0)+1);return m;};
const difference=(baseline,after)=>{
 const a=counts(baseline),b=counts(after),result=[];
 for(const [key,n] of b){const previous=a.get(key)??0;if(n>previous){const [ruleId,severity,match]=JSON.parse(key);result.push({ruleId,severity,match,introduced:n-previous});}}
 return result;
};
function findings(text,rules,policy){return [...analyze(text,rules).findings,...inspectStyle(text,policy).findings];}
export function attributeRegressions(before,patches,rules,policy=DEFAULT_STYLE_POLICY){
 if(typeof before!=='string'||!Array.isArray(patches))throw Error('Invalid attribution inputs');validateRules(rules);
 validateBatch(before,patches);
 const baseline=findings(before,rules,policy),after=applyBatch(before,patches),combined=findings(after,rules,policy);
 const perPatch=patches.map((patch,index)=>{
  const hypothetical=applyPatch(before,patch);
  return {index,patchHash:sha256(JSON.stringify(patch)),standaloneIntroduced:difference(baseline,findings(hypothetical,rules,policy)),scope:'SINGLE_PATCH_COUNTERFACTUAL'};
 });
 return {schemaVersion:'3.3',beforeHash:sha256(before),afterHash:sha256(after),patchSetHash:sha256(JSON.stringify(patches)),status:'REVIEW_REQUIRED',combinedIntroduced:difference(baseline,combined),perPatch,limitations:['Single-patch counterfactuals do not prove causal attribution when patches interact','Heuristic style signals require editorial review','No automatic semantic preservation verification']};
}
