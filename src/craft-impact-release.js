import {auditDependencyCoverage} from './craft-dependency-coverage.js';
import {auditSourceChangeImpact} from './craft-source-change.js';
import {auditEvidenceBound} from './craft-evidence-bound.js';
import {auditCoherence} from './craft-coherence.js';
import {sha256} from './core.js';
import {evaluateFinalGateWithCounterarguments} from './counterargument-release.js';
import {reviewParagraphImpact} from './craft-revision-impact.js';
import {auditStructureRegression} from './craft-structure-regression.js';
export async function evaluateFinalGateWithCraftImpact(inputs){
 const base=await evaluateFinalGateWithCounterarguments(inputs);
 const blockers=[...base.blockers],pending=[...base.pending];
 let impact=null,structure=null,coherence=null,evidenceBound=null,sourceChange=null,dependencyCoverage=null;
 if(inputs.requireCraftImpact===true&&inputs.craftImpact==null)pending.push('CRAFT_IMPACT_REQUIRED');
 if(inputs.craftImpact!=null){
  const c=inputs.craftImpact;
  impact=reviewParagraphImpact(c.before,c.plan,c.reviews,c.proposal,c.decisions,c.links,c.impact,c.checks);
  if(impact.beforeHash!==sha256(inputs.before)||impact.afterHash!==sha256(inputs.after))blockers.push('CRAFT_IMPACT_DOCUMENT_MISMATCH');
  if(impact.status==='BLOCKED')blockers.push('CRAFT_IMPACT_BLOCKED');
  else if(impact.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push('CRAFT_IMPACT_INCOMPLETE');
 }
 if(inputs.requireStructureRegression===true&&inputs.structureRegression==null)pending.push('STRUCTURE_REGRESSION_REQUIRED');
 if(inputs.structureRegression!=null){
  const s=inputs.structureRegression;
  structure=auditStructureRegression(inputs.before,inputs.after,s);
  if(structure.status==='BLOCKED')blockers.push('STRUCTURE_REGRESSION_BLOCKED');
  else if(structure.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push('STRUCTURE_REGRESSION_INCOMPLETE');
 }
 if(inputs.requireCoherence===true&&inputs.coherence==null)pending.push('COHERENCE_REQUIRED');
 if(inputs.coherence!=null){
  const c=inputs.coherence;
  coherence=auditCoherence(inputs.after,c.plan,c.entries);
  if(coherence.status==='BLOCKED')blockers.push('COHERENCE_BLOCKED');
  else if(coherence.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push('COHERENCE_INCOMPLETE');
 }
 if(inputs.requireEvidenceBound===true&&inputs.evidenceBound==null)pending.push('EVIDENCE_BOUND_REQUIRED');
 if(inputs.evidenceBound!=null){
  const e=inputs.evidenceBound;
  evidenceBound=auditEvidenceBound(inputs.after,e.plan,e.records);
  if(evidenceBound.status==='BLOCKED')blockers.push('EVIDENCE_BOUND_BLOCKED');
  else if(evidenceBound.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push('EVIDENCE_BOUND_INCOMPLETE');
 }
 if(inputs.requireSourceChange===true&&inputs.sourceChange==null)pending.push('SOURCE_CHANGE_REQUIRED');
 if(inputs.sourceChange!=null){
  const s=inputs.sourceChange;
  sourceChange=await auditSourceChangeImpact({...s,text:inputs.after});
  if(sourceChange.status==='BLOCKED')blockers.push('SOURCE_CHANGE_BLOCKED');
  else if(sourceChange.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push('SOURCE_CHANGE_INCOMPLETE');
 }
 if(inputs.requireDependencyCoverage===true&&inputs.dependencyCoverage==null)pending.push('DEPENDENCY_COVERAGE_REQUIRED');
 if(inputs.dependencyCoverage!=null){
  const c=inputs.dependencyCoverage;
  dependencyCoverage=auditDependencyCoverage(inputs.after,c.plan,c.records,c.decisions??[]);
  if(dependencyCoverage.status==='BLOCKED')blockers.push('DEPENDENCY_COVERAGE_BLOCKED');
  else if(dependencyCoverage.status!=='READY_FOR_INDEPENDENT_RELEASE_REVIEW')pending.push('DEPENDENCY_COVERAGE_INCOMPLETE');
 }
 const {reportHash:_,...rest}=base;
 const payload={...rest,schemaVersion:'7.9',status:blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE',blockers,pending,requireCraftImpact:inputs.requireCraftImpact===true,craftImpactHash:impact?sha256(JSON.stringify(impact)):null,requireStructureRegression:inputs.requireStructureRegression===true,structureRegressionHash:structure?.reportHash??null,requireCoherence:inputs.requireCoherence===true,coherenceHash:coherence?.reportHash??null,requireEvidenceBound:inputs.requireEvidenceBound===true,evidenceBoundHash:evidenceBound?.reportHash??null,requireSourceChange:inputs.requireSourceChange===true,sourceChangeHash:sourceChange?.reportHash??null,requireDependencyCoverage:inputs.requireDependencyCoverage===true,dependencyCoverageHash:dependencyCoverage?.reportHash??null,limitations:[...base.limitations,'Structural review is human-declared and does not establish literary quality or semantic entailment']};
 return {...payload,reportHash:sha256(JSON.stringify(payload))};
}
export async function verifyFinalGateWithCraftImpact(inputs,report){const expected=await evaluateFinalGateWithCraftImpact(inputs);if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Craft impact release report mismatch');return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};}
