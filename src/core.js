import { parseMarkdownV17 } from './markdown.js';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

export const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const byteOffset = (text, index) => Buffer.byteLength(text.slice(0, index), 'utf8');
const lineNumber = (text, index) => text.slice(0, index).split('\n').length;

// Lossless line-oriented parser: all spans point into the untouched original source.
export const parseMarkdown = parseMarkdownV17;

export function validateRules(rules) {
  if (!Array.isArray(rules)) throw new Error('Rules must be an array');
  const ids = new Set();
  for (const r of rules) {
    if (!r || typeof r.id !== 'string' || !r.id || ids.has(r.id)) throw new Error(`Invalid/duplicate rule id: ${r?.id}`);
    ids.add(r.id);
    if (!['literal', 'regex'].includes(r.detector)) throw new Error(`Unsupported detector: ${r.id}`);
    if (!Array.isArray(r.phrases) || !r.phrases.length || r.phrases.some(p => typeof p !== 'string' || !p)) throw new Error(`Invalid phrases: ${r.id}`);
    if (!['error','warning','info'].includes(r.severity)) throw new Error(`Invalid severity: ${r.id}`);
    if (r.detector === 'regex') for (const p of r.phrases) new RegExp(p, 'gu');
  }
  return rules;
}

export function analyze(text, rules, { file = '<input>' } = {}) {
  const doc = parseMarkdown(text, file); validateRules(rules);
  const findings = [];
  for (const node of doc.nodes) {
    if (['code_block', 'quotation', 'frontmatter', 'blank', 'separator'].includes(node.kind)) continue;
    for (const rule of rules) {
      if (rule.scope && !rule.scope.includes(node.kind)) continue;
      for (const phrase of rule.phrases) {
        const regex = rule.detector === 'regex' ? new RegExp(phrase, 'gu') : new RegExp(escapeRegex(phrase), 'gu');
        for (const match of node.maskedText.matchAll(regex)) {
          const start = node.charStart + match.index, end = start + match[0].length;
          findings.push({ ruleId: rule.id, severity: rule.severity, verdict: 'violation', file, nodeId: node.id, line: node.startLine, column: match.index + 1, startOffset: byteOffset(text, start), endOffset: byteOffset(text, end), match: match[0], explanation: rule.message ?? 'Configured expression matched' });
        }
      }
    }
  }
  return { schemaVersion: '1.7', documentHash: doc.hash, file, findings, counts: { error: findings.filter(f => f.severity === 'error').length, warning: findings.filter(f => f.severity === 'warning').length, info: findings.filter(f => f.severity === 'info').length }, status: findings.some(f => f.severity === 'error') ? 'FAIL' : findings.length ? 'PASS_WITH_REVIEW' : 'PASS' };
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Exact, same-scope contradictory obligations only. Semantic conflicts are not claimed.
export function fuse(primary, constraint) {
  const requirements = [...primary.requirements.map(r => ({ ...r, origin: 'primary' })), ...constraint.requirements.map(r => ({ ...r, origin: 'constraint' }))];
  const conflicts = [];
  for (let i = 0; i < requirements.length; i++) for (let j = i + 1; j < requirements.length; j++) {
    const a = requirements[i], b = requirements[j];
    if (a.scope === b.scope && a.value === b.value && a.obligation !== b.obligation && ['must', 'must_not'].includes(a.obligation) && ['must', 'must_not'].includes(b.obligation)) conflicts.push({ ids: [a.id, b.id], type: 'exact_conflict', scope: a.scope, value: a.value });
  }
  return { schemaVersion: '1.5', status: conflicts.length ? 'BLOCKED' : 'RESOLVED_EXACT_ONLY', requirements, conflicts, limitations: ['Only exact same-scope must/must_not conflicts are detected', 'No semantic conflict resolution or prose translation is implemented'] };
}

export function proposePatch(text, { startOffset, endOffset, replacementText }) {
  const buffer = Buffer.from(text, 'utf8');
  if (!Number.isInteger(startOffset) || !Number.isInteger(endOffset) || startOffset < 0 || endOffset < startOffset || endOffset > buffer.length) throw new Error('Invalid patch range');
  const selected = buffer.subarray(startOffset, endOffset);
  if (selected.toString('utf8').includes('\ufffd')) throw new Error('Patch range splits UTF-8 character');
  return { documentHash: sha256(text), startOffset, endOffset, expectedTextHash: sha256(selected.toString('utf8')), replacementText };
}
export function applyPatch(text, patch) {
  if (sha256(text) !== patch.documentHash) throw new Error('Stale document hash');
  const buffer = Buffer.from(text, 'utf8');
  if (!Number.isInteger(patch.startOffset) || !Number.isInteger(patch.endOffset) || patch.startOffset < 0 || patch.endOffset < patch.startOffset || patch.endOffset > buffer.length) throw new Error('Invalid patch range');
  const selected = buffer.subarray(patch.startOffset, patch.endOffset).toString('utf8');
  if (selected.includes('\ufffd') || sha256(selected) !== patch.expectedTextHash) throw new Error('Patch precondition failed');
  if (typeof patch.replacementText !== 'string') throw new Error('Missing replacementText');
  return Buffer.concat([buffer.subarray(0, patch.startOffset), Buffer.from(patch.replacementText, 'utf8'), buffer.subarray(patch.endOffset)]).toString('utf8');
}
export async function loadJSON(path) { return JSON.parse(await readFile(path, 'utf8')); }
export async function saveJSON(path, obj) { await writeFile(path, JSON.stringify(obj, null, 2) + '\n'); }
