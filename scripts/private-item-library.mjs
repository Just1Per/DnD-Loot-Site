/** Manual operator import. A private original archive is never an import template. */
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {digest} from './build-srd-item-hashes.mjs';
import {stableJson,decodeValue,writePrivateFile} from './audit-item-catalogue.mjs';
import {fieldsHash} from './item-catalogue-migration.mjs';
import {assertPrivateOutput} from './prepare-item-catalogue-decisions.mjs';

const check=(condition,message)=>{if(!condition)throw Error(message);};
const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function buildLibraryImportPlan(template,{project,ownerId,entryId,campaignId,campaignName,requestId=randomUUID()}={}){
 check(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project||'')&&id(ownerId)&&id(entryId)&&id(campaignId)&&id(requestId),'Pin project, library owner, template, campaign and request IDs');
 check(typeof campaignName==='string'&&campaignName.trim(),'Pin the exact destination campaign name');
 check(template?.name===`projects/${project}/databases/(default)/documents/privateItemLibraries/${ownerId}/templates/${entryId}`&&typeof template.updateTime==='string','Only an exact versioned private library template can be imported');
 const data=Object.fromEntries(Object.entries(template.fields||{}).map(([key,value])=>[key,decodeValue(value)]));
 check(data.ownerId===ownerId&&data.reuseStatus==='reviewed-template','Original archives cannot be reused as templates');
 const item=data.item,rights=item?.rights;
 const allowed=['name','description','category','rarity','source','attunement','classes','properties','quote','mechanics','edition','rights'];
 check(item&&Object.keys(item).every(key=>allowed.includes(key))&&typeof item.name==='string'&&item.name.trim()&&item.name.length<=200&&typeof item.description==='string'&&item.description.length<=30000,'Template must contain a bounded reviewed item without public URLs or publication markers');
 check(rights&&['ORIGINAL','CC-BY-4.0'].includes(rights.license)&&['attribution','evidence','reviewedBy','reviewedAt'].every(key=>typeof rights[key]==='string'&&rights[key].trim())&&Number.isFinite(Date.parse(rights.reviewedAt)),'Reusable templates require explicit rights evidence and review');
 if(rights.license==='CC-BY-4.0')check(/^https:\/\//.test(rights.sourceUrl||'')&&hash(rights.referenceSha256),'SRD templates require a source URL and digest');
 check(Array.isArray(data.assets)&&data.assets.length<=20,'Invalid library illustrations');
 for(const asset of data.assets)check(hash(asset.sha256)&&typeof asset.privatePath==='string'&&new RegExp(`^private-item-library-images/${ownerId}/[a-f0-9]{64}/${asset.sha256}$`).test(asset.privatePath),'Illustration belongs to a different library or has no verified checksum');
 const plan={format:1,operation:'private-library-import',project,ownerId,entryId,campaignId,campaignName,requestId,source:template,sourceSha256:fieldsHash(template.fields),itemId:'library-'+digest(requestId).slice(0,40)};
 return {...plan,planSha256:digest(stableJson(plan))};
}
export function assertLibraryImportPlan(plan){
 const rebuilt=buildLibraryImportPlan(plan?.source,plan||{});
 check(stableJson(rebuilt)===stableJson(plan),'Private library import plan was changed or has an invalid digest');return plan;
}
export async function importLibraryTemplate(plan,port,{apply=false,confirmPlanSha256}={}){
 assertLibraryImportPlan(plan);
 if(apply)check(confirmPlanSha256===plan.planSha256,'Explicit import plan digest confirmation required');
 return port.importLibraryTemplate(plan,{apply});
}
async function main(){
 const [mode,...args]=process.argv.slice(2),options={};
 const allowed=mode==='plan-import'?['--project','--owner','--template','--campaign','--campaign-name','--bucket','--output']:['--plan','--bucket','--backup-dir','--confirm-plan'];
 check(['plan-import','check-import','apply-import'].includes(mode),'Use plan-import, check-import or apply-import');
 for(let i=0;i<args.length;i+=2){check(allowed.includes(args[i])&&args[i+1]&&!args[i+1].startsWith('--')&&!options[args[i]],'Invalid or duplicate named option');options[args[i]]=args[i+1];}
 check(!process.env.GITHUB_ACTIONS,'Private library operations are local operator actions, never public CI jobs');
 const {createMigrationPort}=await import('./item-catalogue-migration-firebase.mjs');
 if(mode==='plan-import'){
  const output=await assertPrivateOutput(options['--output']);
  check(id(options['--owner'])&&id(options['--template']),'Exact library owner and template required');
  const port=await createMigrationPort({project:options['--project'],bucket:options['--bucket'],backupDirectory:path.dirname(output)});
  const template=await port.readLibraryTemplate(options['--owner'],options['--template']);
  const plan=buildLibraryImportPlan(template,{project:options['--project'],ownerId:options['--owner'],entryId:options['--template'],campaignId:options['--campaign'],campaignName:options['--campaign-name']});
  await importLibraryTemplate(plan,port);await writePrivateFile(output,plan);
  console.log(JSON.stringify({planSha256:plan.planSha256,itemId:plan.itemId,writes:0}));return;
 }
 const plan=assertLibraryImportPlan(JSON.parse(await fs.readFile(options['--plan'],'utf8')));
 const port=await createMigrationPort({project:plan.project,bucket:options['--bucket'],backupDirectory:path.resolve(options['--backup-dir']||path.dirname(options['--plan']))});
 console.log(JSON.stringify(await importLibraryTemplate(plan,port,{apply:mode==='apply-import',confirmPlanSha256:options['--confirm-plan']})));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
