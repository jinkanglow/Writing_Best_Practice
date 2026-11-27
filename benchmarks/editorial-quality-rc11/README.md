# RC11 bilingual judgment benchmark
Status: prepared; manual examples only. No independent model runs or reviewers. Fictional data, not company disclosures.

## Shared packet
A: Same consolidated scope, annual revenue 100m to 120m; operating profit 20m to 18m; operating cash flow 24m to 22m; cash capex 8m to 16m. B: Management attributes increased costs to launch spending, without quantifying recurring costs. C: Opening debt 50m, new borrowing 10m, repayments 5m, no other adjustments; 30m fixed-rate debt matures next year. D: A press report calls profit 21m, explicitly adjusted; no reconciliation to reported operating profit. E: Website visits rose 80%, with no conversion data. All amounts in the same currency.

Task: preserve the author's judgment that growth has not yet improved cash generation. Explain the decisive variables, conflicting profit measures, debt stock and refinancing exposure; distinguish attribution from causality. Maximum 180 English words or 420 Chinese non-whitespace characters. Do not infer conversion, refinancing rates or valuation.

## Expected checks
Revenue +20%; reported operating profit -10%; margin 20% to 15%; cash flow after cash capex 16m to 6m (-62.5%); closing debt 55m; maturity 30m next year; adjusted 21m not comparable without bridge; visits not evidence of monetization. Management attribution is not causal proof. Preserve source boundaries and author judgment.

## Manual candidate (English)
Revenue rose 20% to 120m, but reported operating profit fell from 20m to 18m, cutting the margin from 20% to 15%. The press report's adjusted profit of 21m cannot be reconciled without an adjustment bridge. Management attributes higher costs to product launches; recurring costs remain unquantified. Website visits rose 80%, but conversion is unknown.

Operating cash flow fell from 24m to 22m while cash capex doubled from 8m to 16m, leaving 6m after capex versus 16m previously, down 62.5%. Growth has not improved cash generation.

Debt rose from 50m to 55m after 10m of borrowing and 5m of repayments. With 30m of fixed-rate debt maturing next year, refinancing terms and recurring costs matter more to the thesis than traffic growth. Neither future interest expense nor margin recovery is established.

## Manual candidate (Chinese)
收入增长20%至1.2亿，报告经营利润却从2000万降至1800万，利润率由20%降至15%。媒体报道的2100万是调整后利润，缺少调节表，不能直接比较。管理层将成本增加归因于新品上市，但未量化经常性成本。网站访问量增长80%，转化率未知。

经营现金流由2400万降至2200万，现金资本开支从800万翻倍至1600万，扣除资本开支后的现金流由1600万降至600万，降幅62.5%。收入增长尚未改善现金创造能力。

期初债务5000万，新增借款1000万、偿还500万，期末为5500万。明年有3000万固定利率债务到期。再融资条款与经常性成本比访问量更能决定后续判断；未来利息支出及利润率修复仍未确定。

## Execution protocol
Use RC9 protocol with RC10 and RC11 separately, same model snapshot, settings, source packet, tool permissions and budget. Run both languages independently; record prompt/output hashes, randomize labels, retain raw outputs. Review factual integrity before scoring materiality, causal identification, dynamic reasoning, conflict handling, voice, compression and naturalness. Record exact supporting spans and errors. Manual candidates are not model outputs or independent scores. Compare lengths within each language only. A material factual error or lost qualifier is a hard fail. Independent reviewers must supply their own signed assessments.
