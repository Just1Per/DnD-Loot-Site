/** Offline aggregate diagnostic: never prints original values, paths or tokens. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export function imageReferenceSummary(plan){
 if(!Array.isArray(plan?.items)||!plan.storage?.sourceBucket)throw Error('Expected a saved separate-archive plan.');
 const fields={},counts={items:plan.items.length,withImageBaseId:0,withoutExplicitImage:0};
 function kind(value){
  if(/^\.?\/?placeholder\.png$/.test(value))return 'placeholder';
  if(/^gs:\/\//i.test(value))return 'gs-uri';
  let url;try{url=new URL(value)}catch{return value.startsWith('/')?'root-relative':value.startsWith('dnd-item-images/')?'storage-relative':'relative-or-invalid'}
  if(url.protocol==='data:')return 'inline-data';
  if(url.protocol!=='https:')return 'other-protocol';
  if(url.hostname==='firebasestorage.googleapis.com'){
   const match=url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
   if(!match)return 'firebase-other-path';
   try{return decodeURIComponent(match[1])===plan.storage.sourceBucket?'firebase-source-bucket':'firebase-other-bucket'}catch{return 'invalid-encoding'}
  }
  if(url.hostname==='storage.googleapis.com')return url.pathname.startsWith('/'+plan.storage.sourceBucket+'/')?'gcs-source-bucket':'gcs-other-bucket';
  return 'other-https';
 }
 for(const item of plan.items){
  const raw=item.source?.fields||{};if(raw.imageBaseId?.stringValue)counts.withImageBaseId++;
  let present=false;
  for(const field of ['imageUrl','thumbnailUrl','thumbUrl','image']){
   const value=raw[field]?.stringValue;if(!value)continue;present=true;
   const category=kind(value);fields[field]??={};fields[field][category]=(fields[field][category]||0)+1;
  }
  if(!present)counts.withoutExplicitImage++;
 }
 return {format:1,productionWrites:0,offline:true,...counts,referenceFormats:fields};
}
async function main(){
 if(process.argv.length!==3)throw Error('Supply the local library-migration-plan.json path.');
 console.log(JSON.stringify(imageReferenceSummary(JSON.parse(await fs.readFile(path.resolve(process.argv[2]),'utf8'))),null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('Offline image diagnostic could not read a valid plan. No private values are logged.');process.exitCode=1;});
