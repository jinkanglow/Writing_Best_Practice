# RC13 — Research-to-publication benchmark

Four historical, real-source cases, with bilingual tasks. These are original research prompts, not a collection of previously published independent articles. Sources are frozen as dated fact summaries, not full archived documents. No model runs or independent reviews are represented as completed.

## Controlled comparison

For each case and language, run RC11 and RC12 (and optionally RC13 as a third arm) in fresh sessions with identical model snapshot, system prompt, decoding settings, tool access (off for frozen-source runs), source packet and output budget. Load each version's actual skill and referenced knowledge; record hashes and the complete effective instructions. Repeat three times per arm. Randomize and blind output identifiers before review; retain mapping separately. Record all runs including failures. Do not use the examples below as generation inputs or reveal model version to reviewers.

Task: write a three-paragraph analytical article in the requested language, at most 250 English words or 500 Chinese non-whitespace characters. Retain every mandatory fact and material qualifier; integrate the strongest competing explanation, calculation where applicable, and a prospective observation that changes the thesis. No invented evidence. Use only the dated packet, not subsequent events.

## Cases

### F — Apple fiscal Q4 2024
Sources: [release, 31 Oct 2024](https://www.apple.com/newsroom/2024/10/apple-reports-fourth-quarter-results/); [financial statements](https://www.apple.com/newsroom/pdfs/fy2024-q4/FY24_Q4_Consolidated_Financial_Statements.pdf). Same corporate origin, not independent corroboration.

F1: Quarter ended 28 September 2024. F2: Sales USD 94,930m versus 89,498m year earlier. F3: Services USD 24,972m versus 22,314m. F4: Reported diluted EPS $0.97; excluding specified one-time charge related to reversal of European General Court State Aid decision, $1.64. Research question: how much of sales growth came from services, and why does adjusted EPS not establish cash conversion? Check: (24972−22314)/(94930−89498)=48.93%; EPS difference $0.67, not cash expense per share. Watch subsequent comparable segment growth and reported/adjusted earnings reconciliation; no valuation claim without price.

### M — US GDP, March 2025 vintage
Sources: [BEA third estimate, 27 Mar 2025](https://www.bea.gov/news/2025/gross-domestic-product-4th-quarter-and-year-2024-third-estimate-gdp-industry-and); [second estimate, 27 Feb 2025](https://www.bea.gov/news/2025/gross-domestic-product-4th-quarter-and-year-2024-second-estimate). Same agency, distinct vintages.

M1: Q4 2024 real GDP annualized growth revised from 2.3% to 2.4%; Q3 3.1%. M2: Revision mainly from lower imports estimate, partly offset by lower consumption estimate. M3: Consumption and government spending rose; investment fell. Research question: why does an upward revision coexist with deceleration? Check: revision +0.1 percentage point, slowdown −0.7 percentage point. Import subtraction is accounting, not proof that lower imports cause stronger domestic demand. Watch subsequent investment and consumption data.

### P — EU AI Act adoption, historical policy snapshot
Sources: [Council meeting 21 May 2024](https://www.consilium.europa.eu/en/meetings/tte/2024/05/21/); [Council release](https://www.consilium.europa.eu/en/press/press-releases/2024/05/21/artificial-intelligence-ai-act-council-gives-final-green-light-to-the-first-worldwide-rules-on-ai/pdf/); [Council legislative file ST-9990-2024](https://data.consilium.europa.eu/doc/document/ST-9990-2024-INIT/en/pdf).

P1: Council adopted act on 21 May 2024. P2: Risk-based obligations include lifecycle risk management, logging, transparency and human oversight for high-risk systems. P3: Some public-service deployers must assess fundamental-rights impacts before deployment. P4: Original law envisaged regulatory sandboxes. Question: how could risk classification change compliance costs and deployment choices? Distinguish adoption from enforcement, avoid assuming firm exits or quantifying costs. Watch compliance expenditure, actual enforcement and deployment evidence; sandbox support is a competing mechanism. Historical snapshot, not current legal advice.

### T — Cloudflare control-plane outage
Source: [Cloudflare postmortem, 4 Nov 2023](https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/), first-party account.

T1: Reported incident window Nov 2 11:44 UTC to Nov 4 04:25 UTC. T2: Most control-plane functions restored at disaster recovery facility Nov 2 17:57 UTC. T3: Raw logs unavailable to most customers for incident duration. Question: why is recovery of most control-plane functions not equivalent to full service recovery? Check: 6h13m to most-control-plane recovery; 40h41m full incident window. Avoid asserting universal customer downtime or root cause not supplied. Watch per-service recovery drills and log availability in future exercises.

## Review contract

Each reviewer maps mandatory fact IDs to exact article spans, checks derived arithmetic and records the source-to-thesis chain, competing explanation and forecast trigger. Review factual entailment, not substring presence alone. Report retained mandatory facts / total; unsupported claims; material qualifier losses; distinct evidence-backed analytical contributions; length (English whitespace words, Chinese non-whitespace characters); contributions per 100 units. Compare density only when factual retention and accuracy are equal; do not compare Chinese and English length directly. Hard fail material fabrication, scope drift or omitted mandatory qualifier. Score mechanism, originality, progression, voice and naturalness separately 0–4 with cited draft spans and rationale. Originality means new derivation relative to the packet, not novelty across all published research. Independent reviewers must disclose conflicts and sign their actual assessment through existing review mechanisms; no synthetic signature substitutes.

Status: four real-source packets prepared. RC11/RC12 model comparison, blind review and article-quality improvement remain NOT_RUN. No scores inferred from regression tests.
