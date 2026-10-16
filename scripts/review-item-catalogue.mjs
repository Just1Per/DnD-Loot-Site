/** Conservative, prose-free editorial triage; recommendations never grant sharing approval. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {readPublicCatalogue,documentsToRows,auditCatalogue,writePrivateFile} from './audit-item-catalogue.mjs';
import {digest,normalizedText} from './build-srd-item-hashes.mjs';

export const reviewName=value=>{
 let name=normalizedText(value).toLowerCase().replace(/[’‘]/g,"'").replace(/[-_,()]/g,' ').replace(/\s+/g,' ').trim();
 // Bonus placement and Open5e's older crossbow spelling are presentation only.
 name=name.replace(/^\+([123])\s+(.+)$/,'$2 +$1').replace(/\bcrossbow (hand|heavy|light)\b/g,'$1 crossbow');
 return name;
};
const renamedSrd=new Map([
 ["Apparatus of Kwalish","Apparatus of the Crab"],
 ["Daern's Instant Fortress","Instant Fortress"],
 ["Heward's Handy Haversack","Handy Haversack"],
 ["Keoghtom's Ointment","Restorative Ointment"],
 ["Nolzur's Marvelous Pigments","Marvelous Pigments"],
 ["Quiver of Ehlonna","Efficient Quiver"]
].map(([a,b])=>[reviewName(a),reviewName(b)]));
const srdFamilies=new Set(['Adamantine Armor','Armor of Resistance','Dancing Sword','Flame Tongue','Frost Brand','Giant Slayer','Luck Blade','Mithral Armor','Nine Lives Stealer','Sword of Life Stealing','Sword of Sharpness','Sword of Wounding','Vicious Weapon','Vorpal Sword'].map(reviewName));
const weaponBases=new Set(['battleaxe','blowgun','club','hand crossbow','heavy crossbow','light crossbow','dagger','dart','flail','glaive','greataxe','greatclub','greatsword','halberd','handaxe','javelin','lance','light hammer','longbow','longsword','mace','maul','morningstar','net','pike','quarterstaff','rapier','scimitar','shortbow','shortsword','sickle','sling','spear','trident','war pick','warhammer','whip']);
const proprietaryNames=/\b(vecna|kas|tasha|mordenkainen|bigby|fizban|tiamat|bahamut|drizzt|drowcraft|lolth|waterdeep|ravenloft|raven queen|dragonlance|krynn|exandria|wildemount|vestige|ruin's wake|luxon|belashyrra|dyrrn|daelkyr|eberron|aquisitions incorporated|acquisitions incorporated)\b/i;
const wotcSources=/dungeon master|tasha|xanathar|wildemount|bigby|fizban|frostmaiden|heroes of krynn|theros|baldur|minsc|wizards|volo|mordenkainen|ravenloft|dragonlance|eberron|ravnica|strixhaven|witchlight|spelljammer|dragon queen|tyranny|storm king|yawni?ng portal|saltmarsh|avernus|phandelver|lost mine|elemental evil|princes of|out of the abyss|annihilation|planescape|netherdeep|keys from|golden vault|acquisitions|dragon heist|mad mage|adventurers league|book of many|shattered obelisk|giants|journeys through|candlekeep|domains of delight|practically complete guide|sword coast|vecna/i;
const small=value=>typeof value==='string'?value.replace(/[\x00-\x1f\x7f]/g,' ').slice(0,200):'';

export function reviewCatalogue(rows,reference){
 return reviewAudit(auditCatalogue(rows,reference),reference,new Map(rows.map(row=>[row.id,row.data])));
}
export function reviewAudit(audit,reference,raw=new Map()){
 if(audit.referenceRevision!==reference.revision)throw Error('Audit/reference revision mismatch');
 const names=new Map();
 for(const entry of reference.entries){const key=reviewName(entry.name);if(!names.has(key))names.set(key,[]);names.get(key).push(entry);}
 const records=audit.records.map(row=>{
  const item=raw.get(row.id)||row,key=reviewName(row.name);
  let matches=names.get(key)||[],matchKind='exact-name';
  if(!matches.length&&renamedSrd.has(key)){matches=names.get(renamedSrd.get(key))||[];matchKind='renamed-srd';}
  if(!matches.length&&srdFamilies.has(key)){matches=reference.entries.filter(entry=>reviewName(entry.name).startsWith(key+' '));matchKind='select-base-variant';}
  if(!matches.length&&/^bag of tricks (gray|grey|rust|tan)$/.test(key)){matches=names.get('bag of tricks')||[];matchKind='select-colour-table';}
  if(!matches.length&&key==='berserker axe'){matches=reference.entries.filter(entry=>/^(Berserker Battleaxe|Berserker Greataxe)$/.test(entry.name));matchKind='select-base-variant';}
  if(!matches.length&&/^weapon \+[123]$/.test(key)){
   const bonus=key.slice(-2);matches=reference.entries.filter(entry=>{const name=reviewName(entry.name);return name.endsWith(' '+bonus)&&weaponBases.has(name.slice(0,-3));});matchKind='select-base-variant';
  }
  const references=matches.map(entry=>({id:entry.id,name:entry.name,edition:entry.edition}));
  const distinctiveName=proprietaryNames.test(row.name),genericBonus=/(?:\+[123]\b|\b[123]\s*\+)/.test(row.name);
  const sourceClaimsWotc=wotcSources.test(row.source),claimsHomebrew=/homebrew|original|custom/i.test(row.source);
  let recommendation,reason;
  if(references.length&&matchKind==='renamed-srd'){recommendation='rewrite-or-review';reason='En SRD-udgave findes under et andet navn. Brug det dokumenterede SRD-navn og hele den licenserede udgave; behold ikke den gamle bogtekst eller illustration.';}
  else if(references.length){recommendation='keep-concept-with-srd';reason=matchKind==='exact-name'?'SRD-navnematch: behold konceptet med verificeret SRD-tekst og attribution; godkend ikke den nuværende tekst eller illustration automatisk.':'SRD-familie/variant: vælg konkret grundtype, variant og udgave før udskiftning; den nuværende generelle bogpost er ikke automatisk godkendt.';}
  else if(distinctiveName&&sourceClaimsWotc){recommendation='withhold-current';reason='Særpræget navn/setting fra en angivet WotC-kilde uden match i referenceindekset. Hold den nuværende udgave ude af fælleskataloget uden særskilt tilladelse.';}
  else if(genericBonus&&!sourceClaimsWotc){recommendation='rewrite-or-review';reason='Bonusnavnet kan beskrive en generisk mekanik, men beviser ingen rettighed til den gemte tekst. Match en konkret SRD-type eller skriv en selvstændig udgave.';}
  else if(sourceClaimsWotc){recommendation='withhold-current';reason='Angivet WotC-bog uden SRD-navnematch. Den gemte udgave bør ikke deles uden dokumenteret tilladelse; en ny selvstændig generisk idé kan vurderes separat.';}
  else{recommendation='rewrite-or-review';reason=claimsHomebrew?'Homebrew er ikke en licens. Bekræft forfatterens rettigheder og tilladelse, samt billedrettigheder, før deling.':'Ukendt eller anden kilde: kræver dokumenteret licens eller selvstændig omskrivning og billedkontrol.';}
  const {descriptionSha256,...metadata}=row;
  return {...metadata,category:small(item.category),rarity:small(item.rarity),recommendation,reason,references,matchKind,distinctiveName,genericBonus,sourceClaimsWotc,
   currentTextExactSrd:row.textStatus==='candidate-srd-text-match',
   artworkRecommendation:'Fjern eksisterende illustration/legacy-opslag fra den fælles version, medmindre en særskilt billedlicens er dokumenteret.',
   approved:false};
 });
 const count=key=>records.filter(row=>row.recommendation===key).length;
 return {format:1,generatedAt:audit.generatedAt,referenceRevision:audit.referenceRevision,
  scope:'Foreløbig redaktionel vurdering baseret på kildeoplysninger, navne, tekstfingeraftryk og registrerede ekstra tekstfelter. Ikke en juridisk afgørelse eller en automatisk godkendelsesliste. Et manglende match beviser ikke krænkelse.',
  counts:{items:records.length,keepConceptWithSrd:count('keep-concept-with-srd'),rewriteOrReview:count('rewrite-or-review'),withholdCurrent:count('withhold-current'),currentTextExactSrd:records.filter(row=>row.currentTextExactSrd).length,approved:0,artworkUnverified:records.length},records};
}
const cell=value=>String(value||'').replace(/\|/g,'\\|').replace(/[\r\n]/g,' ');
export function reviewMarkdown(report){
 const lines=['# Gennemgang af det fælles item-katalog','',`Genereret: ${report.generatedAt}. Items: **${report.counts.items}**.`,'',report.scope,'',
  '**Ingen nuværende poster er automatisk godkendt.** SRD-gruppen er kandidater til at beholde i en dokumenteret SRD-udgave. “Hold tilbage” betyder, at den nuværende udgave bør fjernes fra deling uden anden rettighedsdokumentation; det er ikke en sikker juridisk dom. Billeder vurderes separat.','',
  '| Anbefaling | Antal |','| --- | ---: |',`| Behold konceptet som en verificeret SRD-version | ${report.counts.keepConceptWithSrd} |`,`| Omskriv, omdøb eller dokumentér forfatterens rettigheder | ${report.counts.rewriteOrReview} |`,`| Hold den nuværende udgave ude af fælleskataloget | ${report.counts.withholdCurrent} |`,'',
  '## Sådan skal listen læses','',
  'Et +1/+2/+3-bonusnavn godkender ikke i sig selv teksten. Bag of Holding, Potion of Healing og almindelige bonusvåben har konkrete SRD-referencer. Rod of the Pact Keeper er ikke automatisk omfattet, selv om navnet indeholder +1. Homebrew kræver forfatterens rettigheder og tilladelse.','',
  'Referencer fra 2014 og 2024 vises separat. Et match kun i SRD 5.2 er et forslag om en 2024-version, ikke dokumentation for den gamle 2014-bogtekst. Familier som Vorpal Sword skal have en konkret grundtype og udgave valgt. Ældre særnavne med en kurateret SRD-modpart, fx Heward’s Handy Haversack → Handy Haversack, er placeret i ændringsgruppen.','',
  'Det præcise tekstfingeraftryk matchede ingen af de nuværende poster uden ekstra tekst. Det kan skyldes forskellig formatering, omskrivning eller ekstra indhold; tallet beviser ikke, at alle tekster krænker ophavsret. Den forsigtige publiceringsvej er derfor en ren, verificeret SRD-version uden gammel quote, property-prosa eller bogillustration.','',
  '“Absolut copyright-brud” kan ikke fastslås alene ud fra databasen. Højrisikoeksempler uden indeksmatch er Eye of Vecna, Hand of Vecna, Sword of Kas, Luxon Beacon og Strixhaven-relaterede items fra de angivne bøger. De bør ikke genudgives i deres nuværende form uden anden tilladelse.','',
  'Referencegrundlag: SRD 5.1/5.2 under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), Open5e-revision `'+report.referenceRevision+'`, med dokumentmetadata og kildehashes i `data/rules/srd-magic-item-text-hashes.json`. Referenceindekset er ikke en komplet liste over alle mulige tilladelser; ingen match kræver vurdering frem for en automatisk juridisk konklusion.',''];
 for(const [key,title] of [['keep-concept-with-srd','Kandidater til at beholde som SRD-version'],['rewrite-or-review','Omskriv eller dokumentér rettigheder'],['withhold-current','Hold nuværende udgave ude af fælleskataloget']]){
  const group=report.records.filter(row=>row.recommendation===key).sort((a,b)=>a.name.localeCompare(b.name));
  lines.push(`## ${title} (${group.length})`,'','| Item | Dokument-ID | Angivet kilde | SRD-reference eller begrundelse |','| --- | --- | --- | --- |');
  for(const row of group)lines.push(`| ${cell(row.name)} | ${cell(row.id)} | ${cell(row.source)} | ${cell(row.references.length?row.reason+' '+row.references.slice(0,5).map(ref=>`${ref.name} (${ref.edition}; ${ref.id})`).join('; ')+(row.references.length>5?` [${row.references.length} referencevarianter i JSON-rapporten]`:''):row.reason)} |`);
  lines.push('');
 }
 lines.push('## Fælles krav før godkendelse','','- Verificeret tekstlicens og korrekt attribution; navnet og bogkilden alene er utilstrækkelige.','- Fjern ekstra quotes, egenskabstekst og billeder, der ikke er omfattet af den dokumenterede licens.','- Brug en placeholder eller egen/licenseret illustration; SRD-tekstlicensen omfatter ikke automatisk gamle bogillustrationer.','- Bevar originale data privat og kontrollér kopierne før ændringer i fælleskataloget.','- Tag særskilt stilling til allerede kopierede items og inventory-snapshots; slet ikke spillernes udstyr.','');
 return lines.join('\n');
}
export function annotationChunks(report){
 const encoded=gzipSync(Buffer.from(JSON.stringify(report))).toString('base64'),hash=digest(JSON.stringify(report));
 // Check notices truncate messages at 4 KiB and allow ten notices per step.
 // Emit bounded chunks in separate batches; the complete artifact is canonical.
 const chunks=encoded.match(/.{1,3000}/g)||[];
 if(chunks.length>40)throw Error('Report exceeds annotation transport capacity; use the complete artifact instead.');
 return chunks.map((part,i)=>`::notice title=Item review metadata ${i+1}/${chunks.length}::${hash}:${part}`);
}
async function main(){
 let project='',input='',output='',markdown='',annotations=false,annotationsFrom='',batch=0;
 for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i];if(key==='--public-project')project=process.argv[++i];else if(key==='--from-json')input=process.argv[++i];else if(key==='--report')output=process.argv[++i];else if(key==='--markdown')markdown=process.argv[++i];else if(key==='--annotations')annotations=true;else if(key==='--annotations-from')annotationsFrom=process.argv[++i];else if(key==='--annotation-batch')batch=Number(process.argv[++i]);else throw Error('Unknown argument: '+key);
 }
 if(!Number.isInteger(batch)||batch<0||batch>3)throw Error('Invalid annotation batch');
 if(annotationsFrom){const report=JSON.parse(await fs.readFile(annotationsFrom,'utf8'));for(const line of annotationChunks(report).slice(batch*10,batch*10+10))console.log(line);return;}
 if(!output||(!project&&!input)||(project&&input))throw Error('Use (--public-project PROJECT | --from-json SNAPSHOT) --report NEWFILE [--markdown NEWFILE] [--annotations]');
 const source=input?JSON.parse(await fs.readFile(input,'utf8')):await readPublicCatalogue(project);
 const reference=JSON.parse(await fs.readFile(new URL('../data/rules/srd-magic-item-text-hashes.json',import.meta.url),'utf8'));
 const report=reviewCatalogue(documentsToRows(source.documents),reference);
 await writePrivateFile(output,report);if(markdown)await fs.writeFile(markdown,reviewMarkdown(report),{mode:0o600,flag:'wx'});
 console.log(JSON.stringify(report.counts));
 if(annotations)for(const line of annotationChunks(report).slice(batch*10,batch*10+10))console.log(line);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
