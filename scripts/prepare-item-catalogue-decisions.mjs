import {generatedArtworkPolicy} from './item-artwork-policy.mjs';
/** Complete offline proposals from sanitized review metadata and verified licensed sources. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildBatch,verifySources} from './prepare-srd-replacement-batch.mjs';
import {digest,normalizedText,revision} from './build-srd-item-hashes.mjs';
import {stableJson,documentsToRows,writePrivateFile} from './audit-item-catalogue.mjs';
import {fieldsHash,captureCatalogue} from './item-catalogue-migration.mjs';

const check=(ok,message)=>{if(!ok)throw Error(message);};
const categories={'wondrous-item':'Wondrous Item',weapon:'Weapon',ammunition:'Weapon',armor:'Armor',shield:'Armor',potion:'Potion',rod:'Rod',ring:'Ring',wand:'Wand',staff:'Staff',scroll:'Scroll'};
const rarityNames={common:'Common',uncommon:'Uncommon',rare:'Rare','very-rare':'Very Rare',legendary:'Legendary',artifact:'Artifact'};
const weaponAliases={'crossbow-hand':'hand-crossbow','crossbow-heavy':'heavy-crossbow','crossbow-light':'light-crossbow'};
const preferredVariants=['longsword','battleaxe','breastplate'];
const approval=()=>({approved:false,reviewedBy:'',reviewedAt:''});
export function plainDescription(value){
 return value.replace(/\r\n?/g,'\n').replace(/\\+r\\+n|\\+n/g,'\n')
  .replace(/\[([^\]]+)\]\([^\s)]+\)/g,'$1').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/_([^_\n]+)_/g,'$1').trim();
}

function chooseReference(original){
 const candidates=[...original.references].sort((a,b)=>a.edition.localeCompare(b.edition)||a.id.localeCompare(b.id));
 // Avoid a known transcription typo without claiming that 2024 preserves 2014 mechanics.
 if(original.id==='rope-of-climbing')return candidates.find(row=>row.edition==='2024');
 const edition=candidates[0]?.edition,editionCandidates=candidates.filter(row=>row.edition===edition);
 for(const base of preferredVariants){
  const candidate=editionCandidates.find(row=>row.id.endsWith('-'+base));
  if(candidate)return candidate;
 }
 return editionCandidates[0];
}

function equipmentFacts(fields,edition){
 if(fields.category==='armor'||fields.category==='shield'){
  const shield=/^Shield \(\+([123])\)$/.exec(fields.name);
  if(shield)return {version:1,kind:'shield',base:'',edition,acBonus:Number(shield[1])};
  return null;
 }
 if(fields.category!=='weapon'||!fields.weapon)return null;
 const baseId=fields.weapon.replace(/^srd(?:-2024)?_/,''),base=weaponAliases[baseId]||baseId;
 const bonus=/ \(\+([123])\)$/.exec(fields.name);
 if(bonus)return {version:1,kind:'weapon',base,edition,attackBonus:Number(bonus[1]),damageBonus:Number(bonus[1])};
 // Do not guess bonuses, conditional damage, charges or curses from arbitrary item prose.
 return null;
}

export function prepareDecisions(report,sources,reference){
 verifySources(sources,reference);
 check(report?.format===1&&report.referenceRevision===revision&&Array.isArray(report.records)&&report.completeRootCatalogue!==false,'Complete matching review required');
 check(report.records.length===659,'This delivery is bound to the reviewed 659-item inventory; regenerate and review changed scope separately');
 check(new Set(report.records.map(row=>row.id)).size===report.records.length,'Duplicate review IDs');
 const initial=new Map(buildBatch(report,sources,reference).decisions.map(row=>[row.id,row]));
 const records=new Map(sources.flatMap(source=>JSON.parse(source.items).map(row=>[source.edition+':'+row.pk,row])));
 const fingerprints=new Map(reference.entries.map(row=>[row.edition+':'+row.id,row]));
 const decisions=report.records.map(original=>{
  check(/^[a-f0-9]{64}$/.test(original.recordSha256),'Invalid original digest');
  check(['keep-concept-with-srd','rewrite-or-review','withhold-current'].includes(original.recommendation),'Unknown editorial category');
  const retire=(reasonCode,reason,extra={})=>({id:original.id,name:original.name,sourceSha256:original.recordSha256,action:'retire',...approval(),
   review:{originalRecommendation:original.recommendation,reasonCode,reason,artwork:'Move this item and all its generated illustrations into the existing private campaign before removing its shared copy.',...extra}});
  if(original.recommendation==='withhold-current')return retire('no-documented-replacement','Withhold the current shared version until redistribution rights or a verified replacement are documented. This is not a finding of infringement.');
  if(!original.references.length)return retire('authorship-or-permission-needed','No verified SRD counterpart in the review. Preserve privately; publication needs documented authorship/permission for this exact text; generated illustrations are preserved under the separate owner instruction.');
  // This generic template is redundant with reviewed concrete weapon variants.
  if(original.id==='weapon-plus-1')return retire('redundant-generic-template','Retire the ambiguous generic +1 weapon template from sharing; concrete weapon templates (including longsword-plus-1) have separate replacement decisions. Existing copied gear is untouched.');
  const selected=chooseReference(original);
  check(selected,'No proposed reference: '+original.id);
  const source=records.get(selected.edition+':'+selected.id),fingerprint=fingerprints.get(selected.edition+':'+selected.id),fields=source?.fields;
  check(fields&&fingerprint&&fields.document==='srd-'+selected.edition&&fingerprint.descriptionSha256===digest(normalizedText(fields.desc)),'Missing verified reference: '+original.id);
  check(categories[fields.category]&&rarityNames[fields.rarity]&&typeof fields.requires_attunement==='boolean','Unsupported source metadata: '+original.id);
  const sourceMetadata={referenceId:selected.id,edition:selected.edition,referenceDescriptionSha256:fingerprint.descriptionSha256,referenceRecordSha256:digest(stableJson(source)),referenceName:fields.name};
  if(fields.category==='armor'&&!/^Shield /.test(fields.name)&&/\(\+[123]\)$/.test(fields.name)){
   return retire('normalized-armor-rarity-needs-verification','The normalized bonus-armor rarity family needs direct official-SRD verification. Do not publish these normalized rarity values merely because the source bytes match.',{candidate:sourceMetadata,candidateRarity:fields.rarity});
  }
  const pilot=initial.get(original.id);
  const description=pilot?.replacement.description??plainDescription(fields.desc);
  const mechanics=pilot?.replacement.mechanics??equipmentFacts(fields,selected.edition);
  const changes=pilot?.review.changes||'Replaced the old catalogue version with the selected licensed SRD description; normalized line endings/literal newline escapes and removed Markdown link/emphasis syntax for plain-text cards. No old quotes or property prose retained. Generated illustrations are preserved separately under the owner instruction.';
  const replacement=pilot?.replacement??{name:fields.name,description,category:categories[fields.category],rarity:rarityNames[fields.rarity],source:'SRD '+(selected.edition==='2014'?'5.1':'5.2'),
   edition:selected.edition,attunement:fields.requires_attunement,classes:[],quote:'',properties:[],...(mechanics?{mechanics}:{})};
  const sourceUrl=`https://github.com/open5e/open5e-api/blob/${revision}/data/v2/wizards-of-the-coast/srd-${selected.edition}/MagicItem.json`;
  const document=reference.documents.find(row=>row.edition===selected.edition);
  const rights=pilot?.rights??{license:'CC-BY-4.0',sourceUrl,referenceSha256:fingerprint.descriptionSha256,
   attribution:`This work includes material from the System Reference Document ${selected.edition==='2014'?'5.1':'5.2'} by Wizards of the Coast LLC, available at ${document.officialSource}. Licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: ${changes}`,
   evidence:`Pinned Open5e revision ${revision}; record ${selected.id}; complete item source and licence document checksums verified. Selected source description hash ${fingerprint.descriptionSha256}. ${changes}`};
  const sameEditionCandidates=original.references.filter(row=>row.edition===selected.edition);
  const warnings=[];
  if(original.rarity?.toLowerCase().replaceAll(' ','-')!==fields.rarity)warnings.push('Rarity differs from legacy metadata; review the explicit source rarity.');
  if(original.name!==replacement.name)warnings.push('Replacement name differs from the legacy record; this is explicit, not an alias for the old book text.');
  if(sameEditionCandidates.length>1)warnings.push('A concrete variant was proposed for a generic family; other licensed variants are listed for review.');
  if(selected.edition==='2024')warnings.push('Explicit 2024 proposal; do not relabel as 2014 or change existing campaign copies.');
  if(original.id==='rope-of-climbing')warnings.push('2024 proposed to avoid the 2014 normalized "1* foot" transcription anomaly; this is an edition change for the shared template only.');
  return {id:original.id,name:original.name,sourceSha256:original.recordSha256,action:'publish',...approval(),replacement,rights,
   review:{originalRecommendation:original.recommendation,reasonCode:original.recommendation==='rewrite-or-review'?'licensed-rename-proposed':'licensed-replacement-proposed',
    ...sourceMetadata,changes,replacementDescriptionSha256:digest(normalizedText(description)),
    selectionReason:original.id==='rope-of-climbing'?'Explicit 2024 alternative after a normalized 2014 transcription anomaly.':sameEditionCandidates.length>1?'Prefer 2014 when available; propose an explicit longsword/battleaxe/breastplate variant where offered, otherwise the first named variant. This proposal needs content review.':'Prefer 2014 when available; otherwise explicitly propose the matching 2024 reference.',
    alternatives:sameEditionCandidates.length>1?sameEditionCandidates:[],warnings,
    automation:mechanics?'Explicit basic weapon/shield bonuses supplied; special effects remain subject to their separate supported rules.':'No structured mechanics invented from prose. Special-item automation is not verified by this content preparation.',
    artwork:'Keep the existing generated illustration and image reference from the verified private source snapshot. Replacement text rights do not license the artwork.'}};
 });
 const count=predicate=>decisions.filter(predicate).length;
 const reasonCounts=Object.fromEntries([...new Set(decisions.map(row=>row.review.reasonCode))].sort().map(reason=>[reason,count(row=>row.review.reasonCode===reason)]));
 const duplicateReferences=Object.entries(Object.groupBy(decisions.filter(row=>row.action==='publish'),row=>row.review.edition+':'+row.review.referenceId)).filter(([,rows])=>rows.length>1).map(([reference,rows])=>({reference,ids:rows.map(row=>row.id)}));
 return {format:1,kind:'complete-catalogue-decision-proposals',status:'unapproved',referenceRevision:revision,sourceReviewSha256:digest(stableJson(report)),
  scope:'Root shared catalogue and future imports only. No campaign copy, inventory, character, supply or production modifications.',
  artworkPolicy:{...generatedArtworkPolicy},
  counts:{total:decisions.length,publishProposals:count(row=>row.action==='publish'),retireProposals:count(row=>row.action==='retire'),approved:0,
   editions:{'2014':count(row=>row.replacement?.edition==='2014'),'2024':count(row=>row.replacement?.edition==='2024')},reasons:reasonCounts},duplicateReferences,decisions};
}

/** Bind proposals to a fresh private snapshot without granting approval. No network operations. */
export function privateWorksheet(proposals,snapshot,campaignId){
 check(proposals?.kind==='complete-catalogue-decision-proposals'&&proposals.status==='unapproved','Expected unapproved complete proposals');
 check(typeof campaignId==='string'&&campaignId&&!campaignId.includes('/'),'Exact target campaign ID required');
 check(snapshot.format===1&&snapshot.project==='dnd-loot-site'&&snapshot.collection==='items'&&snapshot.completeRootCatalogue===true,'Fresh complete production snapshot required');
 check(snapshot.documents.every(document=>document.name.startsWith('projects/dnd-loot-site/databases/(default)/documents/items/')&&typeof document.updateTime==='string'),'Snapshot paths and source revisions must match the project');
 const rows=documentsToRows(snapshot.documents).filter(row=>row.id!=='catalog_meta'&&row.data._type!=='catalog-meta');
 const decisions=new Map(proposals.decisions.map(row=>[row.id,row]));
 check(decisions.size===proposals.decisions.length&&rows.length===decisions.size,'Snapshot membership changed; regenerate the review before preparing decisions');
 for(const row of rows){
  check(decisions.has(row.id)&&decisions.get(row.id).sourceSha256===fieldsHash(row.raw),'Source changed since review: '+row.id);
 }
 return {format:1,targetCampaignId:campaignId,artworkPolicy:{...generatedArtworkPolicy},retireLegacyArtwork:false,
  note:'Complete unapproved worksheet. No item publication approvals have been granted. Retained generated illustrations stay shared; retired-only illustrations move to the private campaign after verification. Review the matching package before filling reviewer/date fields.',
  decisions:proposals.decisions.map(row=>({id:row.id,sourceSha256:row.sourceSha256,action:row.action,...approval(),
   ...(row.action==='publish'?{replacement:structuredClone(row.replacement),rights:structuredClone(row.rights)}:{})}))};
}

export async function assertPrivateOutput(file){
 const output=path.resolve(file),parent=await fs.realpath(path.dirname(output)),root=await fs.realpath(new URL('..',import.meta.url));
 check(parent!==root&&!parent.startsWith(root+path.sep),'Private output must be outside the repository');
 let directory=parent;
 while(directory!==path.dirname(directory)){
  const git=path.join(directory,'.git');
  let stat;try{stat=await fs.lstat(git);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(stat){
   let hasHead=false;try{await fs.access(path.join(git,'HEAD'));hasHead=true;}catch(error){if(error.code!=='ENOENT'&&error.code!=='ENOTDIR')throw error;}
   check(!stat.isFile()&&!hasHead,'Private output must be outside every Git checkout');
  }
  directory=path.dirname(directory);
 }
 return output;
}

/** Read-only capture; private originals stay local, while status contains no item prose or artwork. */
export async function captureReviewInputs(port,proposals,campaignId,save){
 const target=await port.inspectTarget(campaignId);
 const snapshot=await captureCatalogue(port,'dnd-loot-site');
 await save('target.json',target);
 await save('root-snapshot.json',snapshot);
 const rows=documentsToRows(snapshot.documents).filter(row=>row.id!=='catalog_meta'&&row.data._type!=='catalog-meta');
 const expected=new Map(proposals.decisions.map(row=>[row.id,row.sourceSha256]));
 const actual=new Map(rows.map(row=>[row.id,fieldsHash(row.raw)]));
 const changed=[...actual].filter(([id,hash])=>expected.has(id)&&expected.get(id)!==hash).map(([id])=>id);
 const added=[...actual.keys()].filter(id=>!expected.has(id)),removed=[...expected.keys()].filter(id=>!actual.has(id));
 const matches=!changed.length&&!added.length&&!removed.length;
 if(matches)await save('item-decisions.json',privateWorksheet(proposals,snapshot,campaignId));
 const status={format:1,scope:'Sanitized read-only status; no original descriptions, image URLs, tokens or credential values.',target,
  snapshotItems:rows.length,reviewMatches:matches,changes:{changed,added,removed},worksheetPrepared:matches,approvals:0,productionWrites:0,
  warning:'Capture files are not a complete migration backup. Legacy artwork bytes and private-copy/IAM checks still require the migration operator.'};
 await save('shareable-review-status.json',status);
 return {snapshotItems:rows.length,reviewMatches:matches,worksheetPrepared:matches,approvals:0,productionWrites:0};
}

export function renderDecisions(proposals){
 const c=proposals.counts,lines=['# Complete shared item catalogue proposals','',
  `**${c.total} decisions prepared: ${c.publishProposals} replacement proposals and ${c.retireProposals} withholding/retirement proposals. No approvals or production writes.**`,'',
  `Editions: ${c.editions['2014']} proposed 2014 templates and ${c.editions['2024']} proposed 2024 templates. Existing campaign copies and owned gear remain outside scope. All replacement text comes from checksum-verified, pinned SRD sources; original book prose is excluded. Generated illustrations are preserved under the separate owner instruction. This evidence does not replace content/edition review or establish the accuracy of every normalized field.`,
  '', '## Decisions by reason','', '| Reason | Count |','| --- | ---: |',...Object.entries(c.reasons).map(([reason,count])=>`| ${reason} | ${count} |`),'',
  '## What needs attention','',
  '- Bonus armor is withheld pending direct official-source verification of normalized rarity metadata. Shields are handled separately.',
  '- Generic weapon/armor families have explicit proposed variants and their alternatives in JSON. Review those choices instead of silently changing a generic template.',
  '- Six legacy distinctive names have licensed SRD rename proposals; unrelated legacy document IDs are retained and flagged.',
  '- Homebrew/unknown-authorship records remain withheld until exact-text authorship and redistribution permission are documented. Artwork requires separate rights.',
  '- The generic +1 weapon template is proposed for retirement because concrete weapon replacements cover it. Existing copied items are unaffected.',
  '- All proposals remain unapproved. A fresh private snapshot, exact campaign name/owner, durable backup, private-copy verification and generated-art preservation checks precede production changes.',
  '', '## Replacement proposals','', '| Existing ID | Replacement | Edition | Rarity | Review notes |','| --- | --- | --- | --- | --- |'];
 const cell=value=>String(value).replaceAll('|','/').replace(/[\r\n]+/g,' ');
 for(const row of proposals.decisions.filter(row=>row.action==='publish'))lines.push(`| ${cell(row.id)} | ${cell(row.replacement.name)} | ${row.replacement.edition} | ${row.replacement.rarity} | ${cell(row.review.warnings.join(' '))} |`);
 lines.push('', '## Withhold / retire proposals','', '| Existing ID | Name | Reason |','| --- | --- | --- |');
 for(const row of proposals.decisions.filter(row=>row.action==='retire'))lines.push(`| ${cell(row.id)} | ${cell(row.name)} | ${row.review.reasonCode} |`);
 if(proposals.duplicateReferences.length)lines.push('', '## Duplicate reference proposals','',...proposals.duplicateReferences.map(group=>'- '+group.reference+': '+group.ids.join(', ')));
 lines.push('', '## Reproduce','', 'From the repository root, using the verified source cache described in [batch 01](item-replacements-batch-01.md):','',
  '```sh','node scripts/prepare-item-catalogue-decisions.mjs --from-directory scripts/.source-cache/item-review',
  'node --test tests/item-catalogue-decisions.cjs tests/srd-replacement-batch.cjs tests/item-catalogue-migration.cjs','```','',
  'The JSON contains full licensed replacements, attribution, source/original/replacement hashes, explicit variant choices and withholding reasons. It has no campaign ID or approval fields filled in. See [the operator handoff](../item-catalogue-operator-handoff.md) for exact private snapshot and worksheet steps.','');
 return lines.join('\n');
}

async function main(){
 const args=process.argv.slice(2),root=fileURLToPath(new URL('..',import.meta.url));
 const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
 if(args[0]==='capture'){
  check(!process.env.GITHUB_ACTIONS,'Private snapshots are never exported in public CI');
  const options={};for(let i=1;i<args.length;i+=2){check(['--campaign','--directory'].includes(args[i])&&args[i+1]&&!options[args[i]],'Use capture --campaign ID --directory EXISTING_PRIVATE_DIRECTORY');options[args[i]]=args[i+1];}
  check(options['--campaign']&&options['--directory'],'Campaign ID and private directory required');
  const directory=await fs.realpath(options['--directory']),stat=await fs.stat(directory);
  check(stat.isDirectory()&&(stat.mode&0o077)===0,'Private directory must exist with permissions 0700');
  for(const name of ['target.json','root-snapshot.json','item-decisions.json','shareable-review-status.json']){
   const file=await assertPrivateOutput(path.join(directory,name));
   try{await fs.lstat(file);throw Error('Capture output already exists; choose a new private directory');}catch(error){if(error.code!=='ENOENT')throw error;}
  }
  const {createMigrationPort}=await import('./item-catalogue-migration-firebase.mjs');
  const port=await createMigrationPort({project:'dnd-loot-site',bucket:'dnd-loot-site.firebasestorage.app',backupDirectory:directory});
  const proposals=await read(path.join(root,'docs/reports/item-catalogue-decisions.json'));
  console.log(JSON.stringify(await captureReviewInputs(port,proposals,options['--campaign'],(name,data)=>writePrivateFile(path.join(directory,name),data))));return;
 }
 if(args[0]==='worksheet'){
  const options={};for(let i=1;i<args.length;i+=2){check(['--snapshot','--campaign','--output'].includes(args[i])&&args[i+1]&&!options[args[i]],'Use worksheet --snapshot FILE --campaign ID --output NEW_PRIVATE_FILE');options[args[i]]=args[i+1];}
  check(options['--snapshot']&&options['--campaign']&&options['--output'],'Snapshot, campaign and private output required');
  const output=await assertPrivateOutput(options['--output']);
  const proposals=await read(path.join(root,'docs/reports/item-catalogue-decisions.json'));
  const worksheet=privateWorksheet(proposals,await read(options['--snapshot']),options['--campaign']);
  await writePrivateFile(output,worksheet);console.log(JSON.stringify({decisions:worksheet.decisions.length,approved:0,writes:0}));return;
 }
 check(args.length===2&&args[0]==='--from-directory','Use --from-directory PATH');
 const sources=await Promise.all(['2014','2024'].map(async edition=>({edition,document:await fs.readFile(path.join(args[1],edition+'-Document.json'),'utf8'),items:await fs.readFile(path.join(args[1],edition+'-MagicItem.json'),'utf8')})));
 const proposals=prepareDecisions(await read(path.join(root,'docs/reports/item-catalogue-review-2026-10-16.json')),sources,await read(path.join(root,'data/rules/srd-magic-item-text-hashes.json')));
 await fs.writeFile(path.join(root,'docs/reports/item-catalogue-decisions.json'),JSON.stringify(proposals,null,2)+'\n');
 await fs.writeFile(path.join(root,'docs/reports/item-catalogue-decisions.md'),renderDecisions(proposals));
 console.log(JSON.stringify(proposals.counts));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
