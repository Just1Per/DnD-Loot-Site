/** Offline, reproducible SRD replacement proposals. Never approves or writes live items. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildReference, digest, normalizedText, revision} from './build-srd-item-hashes.mjs';
import {stableJson} from './audit-item-catalogue.mjs';

const check=(ok,message)=>{if(!ok)throw Error(message);};
const title=value=>value.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
const categories={'wondrous-item':'Wondrous Item',weapon:'Weapon',armor:'Armor',potion:'Potion',rod:'Rod'};
const potionRows=[['healing','common','2d4 + 2'],['greater-healing','uncommon','4d4 + 4'],['superior-healing','rare','8d4 + 8'],['supreme-healing','very-rare','10d4 + 20']];

// Edition choices are proposals for shared templates only, never edits to owned gear.
export const selections=[
 ...potionRows.map(([name,rarity,healing])=>({id:'potion-of-'+name,referenceId:'srd_potion-of-'+name,edition:'2014',rarity,
  description:`When you drink this potion, you regain ${healing} hit points.`,
  changes:'Shortened to the selected healing-table row; omitted appearance and other potency rows.',healing})),
 ...[1,2,3].map((bonus,index)=>({id:'longsword-plus-'+bonus,referenceId:'srd_longsword-'+bonus,edition:'2014',rarity:['uncommon','rare','very-rare'][index],
  description:`You gain a +${bonus} bonus to attack and damage rolls made with this magic longsword.`,
  changes:'Made the selected longsword variant and its attack/damage bonus explicit; omitted generic rarity wording.',
  mechanics:{version:1,kind:'weapon',base:'longsword',edition:'2014',attackBonus:bonus,damageBonus:bonus}})),
 ...[1,2].map((bonus,index)=>({id:'shield-plus-'+bonus,referenceId:'srd-2024_shield-plus-'+bonus,edition:'2024',rarity:['uncommon','rare'][index],
  description:`While holding this shield, you gain a +${bonus} bonus to Armor Class in addition to the shield’s normal AC bonus.`,
  changes:`Made the selected +${bonus} bonus explicit; retained that it is additional to the normal shield bonus.`,
  mechanics:{version:1,kind:'shield',base:'',edition:'2024',acBonus:bonus}})),
 ...['bag-of-holding','cloak-of-protection','immovable-rod'].map(id=>({id,referenceId:'srd_'+id,edition:'2014',rarity:'uncommon',
  changes:'Retained the licensed source description; normalized line endings only. Markdown emphasis remains plain text.'}))
];

export function verifySources(sources,reference){
 check(reference?.revision===revision,'Unexpected reference revision');
 check(sources.length===2&&new Set(sources.map(source=>source.edition)).size===2,'Require one source per edition');
 for(const source of sources){
  const document=reference.documents.find(row=>row.edition===source.edition);
  check(document&&digest(source.items)===document.itemsSha256&&digest(source.document)===document.documentSha256,'Pinned source checksum mismatch: '+source.edition);
 }
 // Rebuild the complete evidence index, including document licence metadata and text hashes.
 const rebuilt=buildReference([...sources].sort((a,b)=>a.edition.localeCompare(b.edition)));
 check(stableJson(rebuilt)===stableJson(reference),'Pinned reference index differs from verified sources');
 return rebuilt;
}

export function buildBatch(report,sources,reference){
 verifySources(sources,reference);
 check(report?.format===1&&report.referenceRevision===revision&&Array.isArray(report.records)&&report.completeRootCatalogue!==false,'Complete matching review report required');
 const originals=new Map(report.records.map(row=>[row.id,row]));
 check(originals.size===report.records.length,'Duplicate audit item ID');
 const records=new Map(sources.flatMap(source=>JSON.parse(source.items).map(row=>[source.edition+':'+row.pk,row])));
 const decisions=selections.map(selection=>{
  const original=originals.get(selection.id);
  check(original?.recommendation==='keep-concept-with-srd'&&/^[a-f0-9]{64}$/.test(original.recordSha256),'Missing eligible audit source: '+selection.id);
  check(original.references.some(row=>row.id===selection.referenceId&&row.edition===selection.edition),'Selected edition/reference absent from review: '+selection.id);
  const row=records.get(selection.edition+':'+selection.referenceId),fields=row?.fields;
  const evidence=reference.entries.find(entry=>entry.id===selection.referenceId&&entry.edition===selection.edition);
  check(fields&&evidence&&fields.name===evidence.name&&digest(normalizedText(fields.desc))===evidence.descriptionSha256,'Reference text mismatch: '+selection.id);
  check(fields.rarity===selection.rarity&&typeof fields.requires_attunement==='boolean'&&categories[fields.category],'Unexpected variant facts: '+selection.id);
  if(selection.healing)check(fields.desc.includes(selection.healing),'Selected healing row absent: '+selection.id);
  if(selection.mechanics?.kind==='weapon')check(fields.weapon==='srd_longsword'&&fields.name===`Longsword (+${selection.mechanics.attackBonus})`,'Unexpected weapon variant');
  if(selection.mechanics?.kind==='shield')check(fields.armor==='srd-2024_shield'&&fields.name===`Shield (+${selection.mechanics.acBonus})`,'Unexpected shield variant');
  const description=selection.description??fields.desc.replace(/\r\n?/g,'\n');
  const replacement={name:fields.name,description,category:categories[fields.category],rarity:title(fields.rarity),
   source:'SRD '+(selection.edition==='2014'?'5.1':'5.2'),edition:selection.edition,attunement:fields.requires_attunement,
   classes:[],properties:[],quote:'',...(selection.mechanics?{mechanics:selection.mechanics}:{})};
  const sourceUrl=`https://github.com/open5e/open5e-api/blob/${revision}/data/v2/wizards-of-the-coast/srd-${selection.edition}/MagicItem.json`;
  const officialSource=reference.documents.find(document=>document.edition===selection.edition).officialSource;
  const attribution=`This work includes material from the System Reference Document ${selection.edition==='2014'?'5.1':'5.2'} by Wizards of the Coast LLC, available at ${officialSource}. Licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: ${selection.changes}`;
  return {id:selection.id,sourceSha256:original.recordSha256,action:'publish',approved:false,reviewedBy:'',reviewedAt:'',replacement,
   rights:{license:'CC-BY-4.0',attribution,sourceUrl,referenceSha256:evidence.descriptionSha256,
    evidence:`Pinned Open5e revision ${revision}; record ${selection.referenceId}; complete source file and licence document checksums verified against the repository index. ${selection.changes}`},
   review:{referenceId:selection.referenceId,referenceDescriptionSha256:evidence.descriptionSha256,replacementDescriptionSha256:digest(normalizedText(description)),
    changes:selection.changes,artwork:'Preserve generated artwork from the verified original snapshot under the separate owner instruction; this text proposal carries no image URLs.',
    editionDecision:selection.edition==='2024'?'Explicit 2024 proposal; do not silently relabel as 2014 or rewrite existing campaign copies.':'Explicit 2014 proposal; do not silently upgrade to 2024.',
    remaining:['Owner content/edition approval','Fresh complete private snapshot and source revision check','Durable private backup and generated-art preservation review']}};
 });
 return {format:1,kind:'srd-replacement-review-batch',status:'awaiting-owner-review',referenceRevision:revision,
  sourceReview:'item-catalogue-review-2026-10-16.json',sourceReviewSha256:digest(stableJson(report)),
  scope:'12 proposed shared-template replacements only. No campaign, inventory, character or production data changes.',
  note:'Partial review batch, not an executable migration manifest. No approvals or target campaign are supplied. Resolve all 659 decisions in a private full worksheet before planning a production migration.',
  decisions};
}

export function renderBatch(batch){
 const lines=['# SRD replacement batch 01','',
  '**12 prepared replacements; awaiting owner review. No production changes or approvals.**','',
  'This batch contains licensed SRD-derived replacement text, not the original catalogue descriptions. Artwork is excluded. Ten proposals use SRD 5.1 / 2014; the two shields use SRD 5.2 / 2024. Existing campaign copies and gear are outside scope.','',
  '| Existing item ID | Proposed name | Edition | Rarity | Attunement |','| --- | --- | --- | --- | --- |',
  ...batch.decisions.map(row=>`| ${row.id} | ${row.replacement.name} | ${row.replacement.edition} | ${row.replacement.rarity} | ${row.replacement.attunement?'Required':'No'} |`),'',
  '## Review each replacement',''];
 for(const row of batch.decisions){lines.push(`### ${row.replacement.name}`,'',`Existing ID: \`${row.id}\`. Reference: \`${row.review.referenceId}\`. Proposed edition: **${row.replacement.edition}**.`,
  '',row.replacement.description,'',`Changes: ${row.review.changes}`,'',`Attribution: ${row.rights.attribution}`,'',`[Pinned source](${row.rights.sourceUrl}) · Reference text SHA-256: \`${row.rights.referenceSha256}\`.`,
  '',...(row.replacement.mechanics?[`Structured equipment facts: \`${JSON.stringify(row.replacement.mechanics)}\`. These affect new template imports only.`,'']:[]));}
 lines.push('## Publication prerequisites','',
  '- Review the exact edition, description, attunement and structured equipment facts; all `approved` flags remain false and reviewer/date fields are blank.',
  '- Preserve the owner’s ChatGPT-generated illustrations. Text licensing is separate from artwork provenance. Retained images stay shared; retired-only images move to the existing private campaign after verification.',
  '- Merge only the decision fields (`id`, `sourceSha256`, `action`, `approved`, `reviewedBy`, `reviewedAt`, `replacement`, `rights`) into a **private complete worksheet**. `review` is explanatory metadata, not part of the publication payload. Do not fill approval fields automatically.',
  '- Resolve the other 647 items. The production planner requires every snapshot item exactly once; this batch deliberately has no target campaign and cannot be applied alone.',
  '- Obtain a fresh complete private snapshot, confirm source hashes and exact destination campaign/owner, arrange a durable private backup, then run the existing read-only migration check. A changed original requires renewed review.',
  '- Production rule publication and migration remain separate owner-approved operations. Do not rewrite campaign copies, inventory or character gear.',
  '', '## Deferred source discrepancy','',
  'The pinned normalized +1 chain-mail record labels its rarity Uncommon. This needs checking against the official SRD armor rarity table before proposing a replacement; it is deliberately excluded from this batch. Byte/hash verification proves source consistency, not that every upstream normalized fact is correct.','',
  '## Reproduce and validate','',
  'Download `Document.json` and `MagicItem.json` for both editions from the pinned revision into the ignored source cache. The builder makes no network calls and rejects any file/index mismatch. From the repository root:','',
  '```sh','mkdir -p scripts/.source-cache/item-review',
  'for edition in 2014 2024; do',
  '  for kind in Document MagicItem; do',
  `    curl --fail --show-error --silent --location "https://raw.githubusercontent.com/open5e/open5e-api/${batch.referenceRevision}/data/v2/wizards-of-the-coast/srd-$edition/$kind.json" \\`,
  '      --output "scripts/.source-cache/item-review/$edition-$kind.json"',
  '  done','done',
  'node scripts/prepare-srd-replacement-batch.mjs --from-directory scripts/.source-cache/item-review',
  'node --test tests/srd-replacement-batch.cjs tests/item-catalogue-migration.cjs','```','',
  'Source revision: `'+batch.referenceRevision+'`. See [the operator guide](../reviewed-item-catalogue.md) for private snapshot, complete manifest, backup and migration commands.','');
 return lines.join('\n');
}

async function main(){
 const args=process.argv.slice(2);
 check(args.length===2&&args[0]==='--from-directory'&&args[1],'Use --from-directory PATH');
 const root=fileURLToPath(new URL('..',import.meta.url));
 const read=async name=>JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
 const sources=await Promise.all(['2014','2024'].map(async edition=>({edition,
  document:await fs.readFile(path.join(args[1],edition+'-Document.json'),'utf8'),
  items:await fs.readFile(path.join(args[1],edition+'-MagicItem.json'),'utf8')})));
 const batch=buildBatch(await read('docs/reports/item-catalogue-review-2026-10-16.json'),sources,await read('data/rules/srd-magic-item-text-hashes.json'));
 await fs.writeFile(path.join(root,'docs/reports/item-replacements-batch-01.json'),JSON.stringify(batch,null,2)+'\n');
 await fs.writeFile(path.join(root,'docs/reports/item-replacements-batch-01.md'),renderBatch(batch));
 console.log(`Prepared ${batch.decisions.length} unapproved replacement proposals; no production requests or writes.`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
