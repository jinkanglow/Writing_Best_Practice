import {sha256} from './core.js';
import {auditRewriteRisks} from './rewrite-risk.js';
import {executeAvoidAIRevision} from './avoid-ai-revision.js';
import {auditClaims} from './claim-integrity.js';
import {auditArgumentGraph} from './argument-graph.js';

const digest=x=>sha256(JSON.stringify(x));
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

/** Recompute the exact approved rewrite, then independently audit declared claims and relations. */
export function assureClaimAwareRewrite({before,after,plan,decisions,protectedQuotes=[],claims,claimReview=null,argumentGraph,argumentReview=null}){
 if(typeof before!=='string'||typeof after!=='string')throw Error('Both document texts required');
 if(!claims||!argumentGraph)throw Error('Claims inventory and argument graph are mandatory for claim-aware assurance');
 const {revisedText,...execution}=executeAvoidAIRevision(before,plan,decisions,{protectedQuotes});
 if(revisedText!==after)throw Error('After text differs from approved patch execution');
 const riskAudit=auditRewriteRisks({before,after,plan,decisions,protectedQuotes});
 const claimAudit=auditClaims(before,after,claims,claimReview);
 const graphAudit=auditArgumentGraph(before,after,argumentGraph,argumentReview);
 const blockers=[],pending=[];
 if(claimAudit.status==='BLOCKED')blockers.push('CLAIM_REVIEW_REJECTED');
 else if(claimAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('CLAIM_REVIEW_INCOMPLETE');
 if(graphAudit.status==='BLOCKED')blockers.push('ARGUMENT_REVIEW_REJECTED');
 else if(graphAudit.status!=='READY_FOR_HUMAN_REVIEW')pending.push('ARGUMENT_REVIEW_INCOMPLETE');
 if(riskAudit.status==='REVIEW_REQUIRED')pending.push('LEXICAL_RISK_REVIEW_REQUIRED');
 if(execution.status==='INCOMPLETE')pending.push('WRITING_REVISION_INCOMPLETE');
 if(execution.status==='BLOCKED')blockers.push('WRITING_REVISION_BLOCKED');
 const status=blockers.length?'BLOCKED':pending.length?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 const payload={schemaVersion:'4.7',status,beforeHash:sha256(before),afterHash:sha256(after),planHash:plan.planHash,executionReportHash:execution.reportHash,riskReportHash:riskAudit.reportHash,claimsReportHash:claimAudit.reportHash,graphReportHash:graphAudit.reportHash,claimsHash:digest(claims),claimReviewHash:claimReview?digest(claimReview):null,argumentGraphHash:digest(argumentGraph),argumentReviewHash:argumentReview?digest(argumentReview):null,protectedQuotesHash:digest(protectedQuotes),blockers,pending,limitations:['Declared claim inventory and graph may omit important assertions','Exact-text retention does not establish semantic equivalence','Human review labels are not authenticated and do not establish factual truth','No automated release authorization']};
 return {...payload,reportHash:digest(payload)};
}
export function verifyClaimAwareRewrite(inputs,report){
 const expected=assureClaimAwareRewrite(inputs);
 if(JSON.stringify(expected)!==JSON.stringify(report))throw Error('Claim-aware assurance report mismatch');
 return {status:'REPORT_RECOMPUTED',decision:expected.status,reportHash:expected.reportHash};
}
