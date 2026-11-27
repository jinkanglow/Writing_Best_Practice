import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

// A machine-readable fenced contract is required. Natural-language requirements
// remain guidance; we never pretend to have compiled them automatically.
export function extractSkillContract(markdown, file = '<input>') {
  const matches = [...markdown.matchAll(/^\s*(`{3,}|~{3,})writing-contract\s*\r?\n([\s\S]*?)^\s*\1\s*$/gm)];
  if (matches.length !== 1) throw new Error(`${file}: expected exactly one fenced writing-contract JSON block; found ${matches.length}`);
  let data;
  try { data = JSON.parse(matches[0][2]); } catch (e) { throw new Error(`${file}: invalid writing-contract JSON: ${e.message}`); }
  return validateSkillContract(data, file);
}
export function validateSkillContract(data, file = '<input>') {
  if (!data || data.version !== '1.6' || !Array.isArray(data.requirements)) throw new Error(`${file}: contract requires version 1.6 and requirements array`);
  const ids = new Set();
  for (const r of data.requirements) {
    if (!r || typeof r.id !== 'string' || !/^[a-zA-Z0-9][\w.-]*$/.test(r.id) || ids.has(r.id)) throw new Error(`${file}: duplicate or invalid requirement id`);
    ids.add(r.id);
    if (!['must','must_not','should','may'].includes(r.obligation)) throw new Error(`${file}: invalid obligation in ${r.id}`);
    if (typeof r.value !== 'string' || !r.value.trim()) throw new Error(`${file}: invalid value in ${r.id}`);
    if (!Array.isArray(r.scope) || !r.scope.length || r.scope.some(x => typeof x !== 'string' || !x.trim())) throw new Error(`${file}: scope must be a nonempty string array in ${r.id}`);
    if (r.check !== undefined && (!r.check || !['literal','semantic_review'].includes(r.check.kind) || (r.check.kind === 'literal' && (typeof r.check.text !== 'string' || !r.check.text)))) throw new Error(`${file}: unsupported check in ${r.id}`);
  }
  return data;
}
export async function loadSkillContract(path) {
  const text = await readFile(path, 'utf8');
  if (extname(path).toLowerCase() === '.json') return validateSkillContract(JSON.parse(text), path);
  return extractSkillContract(text, path);
}
const intersect = (a,b) => a.includes('*') ? b : b.includes('*') ? a : a.filter(x => b.includes(x));
export function fuseContracts(primary, constraint) {
  validateSkillContract(primary, 'primary'); validateSkillContract(constraint, 'constraint');
  const requirements = [...primary.requirements.map(x=>({...x, origin:'primary'})), ...constraint.requirements.map(x=>({...x,origin:'constraint'}))];
  const conflicts = [];
  for (let i=0;i<requirements.length;i++) for (let j=i+1;j<requirements.length;j++) {
    const a=requirements[i],b=requirements[j];
    if (a.value === b.value && ((a.obligation==='must'&&b.obligation==='must_not')||(a.obligation==='must_not'&&b.obligation==='must'))) {
      const scope=intersect(a.scope,b.scope);
      if (scope.length) conflicts.push({ids:[a.id,b.id],type:'exact_conflict',scope,value:a.value});
    }
  }
  return {schemaVersion:'1.6',status:conflicts.length?'BLOCKED':'NO_EXACT_CONFLICT_FOUND',requirements,conflicts,limitations:['Natural-language semantic conflicts are not resolved','No prose generation or scene translation is performed']};
}
