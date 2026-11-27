import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const sha=x=>createHash('sha256').update(x).digest('hex');
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
export async function verifyBenchmarkProvenance(datasetPath,manifest) {
  if(!obj(manifest)||manifest.schemaVersion!=='2.2'||!['synthetic','human_labeled','model_generated'].includes(manifest.labelOrigin)||typeof manifest.datasetSha256!=='string'||!/^[0-9a-f]{64}$/.test(manifest.datasetSha256))throw new Error('Invalid benchmark provenance manifest');
  const actual=sha(await readFile(datasetPath));
  if(actual!==manifest.datasetSha256)throw new Error('Benchmark dataset hash mismatch');
  if(manifest.labelOrigin==='human_labeled'&&(!Array.isArray(manifest.annotators)||!manifest.annotators.length||!manifest.annotationProtocol||typeof manifest.annotationProtocol!=='string'))throw new Error('Human-labeled claim requires annotators and annotation protocol');
  return {schemaVersion:'2.2',status:'PROVENANCE_CHECKED',datasetSha256:actual,labelOrigin:manifest.labelOrigin,independentHumanBenchmark:manifest.labelOrigin==='human_labeled',limitations:['Metadata is self-declared; this check cannot authenticate annotator identities or label quality']};
}
