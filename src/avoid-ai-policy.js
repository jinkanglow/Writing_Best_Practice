// Editorial tolerances are review heuristics, not authorship probabilities.
export const CONTEXT_POLICY={
 'blog':{tier1:true,tier2Minimum:2,tier3Threshold:.03,windowSize:100,windowRepeat:3},
 'cn-explanatory':{tier1:true,tier2Minimum:2,tier3Threshold:.03,windowSize:100,windowRepeat:3},
 'investor-email':{tier1:true,tier2Minimum:2,tier3Threshold:.03,windowSize:100,windowRepeat:3},
 'technical-blog':{tier1:true,tier2Minimum:3,tier3Threshold:.05,windowSize:100,windowRepeat:4},
 'docs':{tier1:true,tier2Minimum:3,tier3Threshold:.05,windowSize:100,windowRepeat:4},
 'casual':{tier1:false,tier2Minimum:Infinity,tier3Threshold:1,windowSize:100,windowRepeat:Infinity}
};
export function resolveAvoidAIPolicy({context='blog',voice='professional',tier3Threshold=null,nonNativeTolerance=false}={}){
 if(!Object.hasOwn(CONTEXT_POLICY,context))throw Error('Unknown context');
 if(!['professional','technical','casual','warm','blunt','chinese-explanatory'].includes(voice))throw Error('Unknown voice');
 if(tier3Threshold!==null&&(!Number.isFinite(tier3Threshold)||tier3Threshold<=0||tier3Threshold>1))throw Error('Invalid tier3Threshold');
 if(typeof nonNativeTolerance!=='boolean')throw Error('Invalid nonNativeTolerance');
 const base=CONTEXT_POLICY[context];
 return {context,voice,tier1:base.tier1,tier2Minimum:base.tier2Minimum===Infinity?null:base.tier2Minimum,tier3Threshold:tier3Threshold??(nonNativeTolerance?Math.max(base.tier3Threshold,.05):base.tier3Threshold),windowSize:base.windowSize,windowRepeat:nonNativeTolerance||base.windowRepeat===Infinity?null:base.windowRepeat,nonNativeTolerance,voiceNotes:voice==='blunt'||voice==='casual'?'Do not penalize intentionally short sentence rhythm':'No automatic sentence rhythm exemption'};
}
