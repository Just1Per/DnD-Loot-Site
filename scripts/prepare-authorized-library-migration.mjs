import {assertArchiveStorage} from './archive-storage.mjs';
import {createPrivateDirectory,assertPrivateDirectory,privateOutputBase} from './private-output.mjs';
/** Adopt the owner's delegated recommendations, then bind them to fresh data. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {digest} from './build-srd-item-hashes.mjs';
import {stableJson,writePrivateFile} from './audit-item-catalogue.mjs';
import {prepareDecisions,privateWorksheet,assertPrivateOutput} from './prepare-item-catalogue-decisions.mjs';
import {buildMigrationPlan,captureCatalogue,migrateCatalogue,assertPlan} from './item-catalogue-migration.mjs';

const check=(condition,message)=>{if(!condition)throw Error(message);};
const root=fileURLToPath(new URL('..',import.meta.url));
const project='dnd-loot-site',bucket='dnd-loot-site.firebasestorage.app';
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
export function authorizedLibraryPlan(proposals,snapshot,authorization,{ownerId,storage,now=new Date().toISOString()}={}){
 check(authorization?.format===1&&authorization.method==='owner-delegated-recommendations'&&authorization.destination==='owner-private-library','Explicit owner delegation to the private library is required');
 check(authorization.proposalSha256===digest(stableJson(proposals))&&authorization.referenceRevision===proposals.referenceRevision,'Recommendations changed after the recorded delegation');
 const counts={total:proposals.decisions.length,publish:proposals.decisions.filter(row=>row.action==='publish').length,retire:proposals.decisions.filter(row=>row.action==='retire').length};
 check(stableJson(counts)===stableJson(authorization.counts)&&counts.total===counts.publish+counts.retire,'Delegated recommendation counts do not match');
 check(typeof authorization.reviewedBy==='string'&&authorization.reviewedBy.trim()&&typeof authorization.instruction==='string'&&authorization.instruction.trim()&&Number.isFinite(Date.parse(now)),'Delegation record and approval timestamp are required');
 check(Array.isArray(snapshot?.documents)&&new Set(snapshot.documents.map(row=>row.name)).size===snapshot.documents.length,'Snapshot must not contain duplicate records');
 // Reuse exact-membership/hash/revision checks. This does not invent a snapshot.
 const worksheet=privateWorksheet(proposals,snapshot,'library-planning-only');
 delete worksheet.targetCampaignId;
 worksheet.targetLibraryOwnerId=ownerId;worksheet.retireLegacyArtwork=true;
 worksheet.artworkPolicy={...worksheet.artworkPolicy,evidence:authorization.artwork};
 worksheet.authorization={method:authorization.method,recordedAt:authorization.recordedAt,source:authorization.source,instruction:authorization.instruction,proposalSha256:authorization.proposalSha256};
 worksheet.note='Owner delegated adoption of these exact recommendations. Approval is based on that delegation, not an assertion that the owner individually reviewed each item. Originals and illustrations are privately preserved before shared cleanup.';
 for(const decision of worksheet.decisions){decision.approved=true;decision.reviewedBy=authorization.reviewedBy;decision.reviewedAt=now;}
 const plan=buildMigrationPlan(snapshot,worksheet,{project,libraryOwnerId:ownerId,...storage?{storage}:{}});
 return {manifest:worksheet,plan,summary:{...counts,approved:counts.total,...storage?{storage}:{},destination:'owner-private-library',planSha256:plan.planSha256,productionWrites:0}};
}
export async function prepareAuthorizedRun(proposals,authorization,port,{ownerId,campaignId,storage,save,now}={}){
 check((!!ownerId)!=(!!campaignId),'Specify either the library owner UID or an existing own campaign to identify its owner');
 if(campaignId)ownerId=(await port.inspectTarget(campaignId)).ownerId;
 check(typeof ownerId==='string'&&ownerId&&!ownerId.includes('/'),'The exact library owner UID is unavailable');
 try{
  const snapshot=await captureCatalogue(port,project);
  await save('root-snapshot.json',snapshot);
  const prepared=authorizedLibraryPlan(proposals,snapshot,authorization,{ownerId,storage,now});
  await save('authorized-decisions.json',prepared.manifest);
  await save('library-migration-plan.json',prepared.plan);
  // Existing target, inventory, source-revision, IAM and artwork checks stay intact.
  const preflight=await migrateCatalogue(prepared.plan,port);
  const status={...prepared.summary,preflight,ready:preflight.unresolvedArtwork===0,execution:'No production writes; apply is a separate owner-run command.'};
  await save('shareable-library-plan-status.json',status);return {plan:prepared.plan,status};
 }catch(error){
  await save('shareable-library-plan-status.json',{ready:false,productionWrites:0,error:error.message}).catch(()=>{});
  throw error;
 }
}
async function main(){
 const [mode,...args]=process.argv.slice(2),options={};
 const allowed=mode==='prepare'?['--owner','--campaign','--directory','--source-directory','--archive-bucket']:['--directory','--backup-dir','--confirm-plan'];
 check(['prepare','check','apply'].includes(mode),'Use prepare, check or apply');
 for(let i=0;i<args.length;i+=2){check(allowed.includes(args[i])&&args[i+1]&&!args[i+1].startsWith('--')&&!options[args[i]],'Invalid or duplicate named option');options[args[i]]=args[i+1];}
 check(!process.env.GITHUB_ACTIONS,'Private production preparation is an owner-run local action, never public CI');
 const {createMigrationPort}=await import('./item-catalogue-migration-firebase.mjs');
 if(mode==='prepare'){
  const sourceDirectory=path.resolve(options['--source-directory']||path.join(root,'scripts/.source-cache/item-review'));
  const sources=await Promise.all(['2014','2024'].map(async edition=>({edition,document:await fs.readFile(path.join(sourceDirectory,edition+'-Document.json'),'utf8'),items:await fs.readFile(path.join(sourceDirectory,edition+'-MagicItem.json'),'utf8')})));
  const proposals=await read(path.join(root,'docs/reports/item-catalogue-decisions.json'));
  const rebuilt=prepareDecisions(await read(path.join(root,'docs/reports/item-catalogue-review-2026-10-16.json')),sources,await read(path.join(root,'data/rules/srd-magic-item-text-hashes.json')));
  check(stableJson(rebuilt)===stableJson(proposals),'Bundled proposals differ from the checksum-verified source recommendations');
  const authorization=await read(path.join(root,'docs/reports/catalogue-recommendation-authorization.json'));
  const directory=path.resolve(options['--directory']||path.join(await privateOutputBase(),'campaignatlas-library-plan-'+new Date().toISOString().replaceAll(':','-')));
  await assertPrivateOutput(path.join(directory,'..',path.basename(directory))); // Validate the parent before creating anything.
  await createPrivateDirectory(directory);
  console.error('Private output directory: '+directory);
  await assertPrivateDirectory(directory);
  await assertPrivateOutput(path.join(directory,'root-snapshot.json'));
  const storage=assertArchiveStorage({sourceBucket:bucket,archiveBucket:options['--archive-bucket']||'dnd-loot-site-private-item-library'});
  const port=await createMigrationPort({project,bucket,archiveBucket:storage.archiveBucket,backupDirectory:path.join(directory,'private-backup')});
  const result=await prepareAuthorizedRun(proposals,authorization,port,{ownerId:options['--owner'],campaignId:options['--campaign'],storage,save:(name,data)=>writePrivateFile(path.join(directory,name),data)});
  console.log(JSON.stringify({...result.status,directory},null,2));return;
 }
 check(options['--directory'],'Specify the private plan directory');
 await assertPrivateDirectory(path.resolve(options['--directory']));
 const directory=await fs.realpath(path.resolve(options['--directory']));
 await assertPrivateOutput(path.join(directory,'library-migration-plan.json'));
 const plan=assertPlan(await read(path.join(directory,'library-migration-plan.json')));
 check(plan.project===project&&plan.destination?.type==='private-library','Only the pinned production private-library plan is accepted');
 const backupDirectory=path.resolve(options['--backup-dir']||path.join(directory,'private-backup'));
 check(plan.storage,'Prepare a fresh plan that pins the separate archive bucket; old plans cannot be applied by this launcher');
 const port=await createMigrationPort({project,bucket,archiveBucket:plan.storage.archiveBucket,backupDirectory});
 console.log(JSON.stringify(await migrateCatalogue(plan,port,{apply:mode==='apply',confirmPlanSha256:options['--confirm-plan']}),null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
