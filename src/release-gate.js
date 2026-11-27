import {prepareRevisionAudit,reviewRevisionAudit} from './revision.js';

const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
/** Fail-closed, deterministic release gate. Human approval is not semantic proof. */
export function evaluateRevisionGate(before,after,anchors,{review=null,contractReport=null}={}){
  const audit=prepareRevisionAudit(before,after,anchors);
  const reasons=[];
  if(anchors.length===0)reasons.push({code:'NO_ANCHORS',detail:'No protected assertions were supplied'});
  let reviewed=null;
  if(review!==null){
    reviewed=reviewRevisionAudit(before,after,anchors,review);
    if(reviewed.status==='BLOCKED')reasons.push({code:'REVIEW_REJECTED',detail:'At least one protected change was rejected'});
    if(reviewed.status==='INCOMPLETE')reasons.push({code:'REVIEW_PENDING',detail:'Protected changes lack decisions'});
  }else if(audit.status==='INCOMPLETE')reasons.push({code:'REVIEW_MISSING',detail:'Changed protected assertions require review'});
  if(contractReport!==null){
    if(!isObject(contractReport)||!['PASS','FAIL','INCOMPLETE'].includes(contractReport.status))throw new Error('Invalid contract report');
    // A report without a verifiable document hash is not evidence for this revision.
    if(contractReport.documentHash!==audit.afterHash)reasons.push({code:'CONTRACT_REPORT_STALE',detail:'Contract report is not bound to revised text'});
    if(contractReport.status==='FAIL')reasons.push({code:'CONTRACT_FAILED',detail:'Deterministic contract violations'});
    if(contractReport.status==='INCOMPLETE')reasons.push({code:'CONTRACT_INCOMPLETE',detail:'Unverified contract requirements'});
  }
  const blocked=reasons.some(x=>['REVIEW_REJECTED','CONTRACT_FAILED','CONTRACT_REPORT_STALE'].includes(x.code));
  return {schemaVersion:'2.8',status:blocked?'BLOCKED':reasons.length?'INCOMPLETE':'READY_FOR_HUMAN_RELEASE',beforeHash:audit.beforeHash,afterHash:audit.afterHash,anchorCount:anchors.length,changedAnchors:audit.items.filter(x=>x.status==='REVIEW_REQUIRED').length,reasons,reviewStatus:reviewed?.status??null,limitations:['This gate does not establish semantic equivalence','Exact text can change meaning through context','Reviewer identities and judgments are self-declared','Unlisted assertions are not protected','READY_FOR_HUMAN_RELEASE is not automatic publication authorization']};
}
