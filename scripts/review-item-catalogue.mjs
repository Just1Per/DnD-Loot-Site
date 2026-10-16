/** Conservative, prose-free editorial triage; recommendations never grant sharing approval. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {readPublicCatalogue,documentsToRows,auditCatalogue,writePrivateFile} from './audit-item-catalogue.mjs';
import {digest,normalizedText} from './build-srd-item-hashes.mjs';

export const reviewName=value=>normalizedText(value).toLowerCase().replace(/[’‘]/g,"'").replace(/[-_,()]/g,' ').replace(/\s+/g,' ').trim();
const proprietaryNames=/\b(vecna|kas|tasha|mordenkainen|bigby|fizban|tiamat|bahamut|drizzt|drowcraft|lolth|waterdeep|ravenloft|raven queen|dragonlance|krynn|exandria|wildemount|vestige|ruin's wake|luxon|belashyrra|dyrrn|daelkyr|eberron|aquisitions incorporated|acquisitions incorporated)\b/i;
const wotcSources=/dungeon master|tasha|xanathar|wildemount|bigby|fizban|frostmaiden|heroes of krynn|theros|baldur|minsc|wizards|volo|mordenkainen|ravenloft|dragonlance|eberron|ravnica|strixhaven|witchlight|spelljammer|dragon queen|tyranny|storm king|yawni?ng portal|saltmarsh|avernus|phandelver|lost mine|elemental evil|princes of|out of the abyss|annihilation|planescape|netherdeep|keys from|golden vault|acquisitions|dragon heist|mad mage|adventurers league|book of many|shattered obelisk|giants|journeys through|candlekeep/i;
const small=value=>typeof value==='string'?value.replace(/[\x00-\x1f\x7f]/g,' ').slice(0,200):'';

export function reviewCatalogue(rows,reference){
 const audit=auditCatalogue(rows,reference),raw=new Map(rows.map(row=>[row.id,row.data]));
 const names=new Map();
 for(const entry of reference.entries){const key=reviewName(entry.name);if(!names.has(key))names.set(key,[]);names.get(key).push(entry);}
 const records=audit.records.map(row=>{
  const item=raw.get(row.id),matches=names.get(reviewName(row.name))||[];
  const references=matches.map(entry=>({id:entry.id,name:entry.name,edition:entry.edition}));
  const distinctiveName=proprietaryNames.test(row.name),genericBonus=/(?:\+[123]\b|\b[123]\s*\+)/.test(row.name);
  const sourceClaimsWotc=wotcSources.test(row.source),claimsHomebrew=/homebrew|original|custom/i.test(row.source);
  let recommendation,reason;
  if(references.length){recommendation='keep-concept-with-srd';reason='SRD-navnematch: behold konceptet med verificeret SRD-tekst og attribution; godkend ikke den nuværende tekst eller illustration automatisk.';}
  else if(distinctiveName&&sourceClaimsWotc){recommendation='withhold-current';reason='Særpræget navn/setting fra en angivet WotC-kilde uden match i referenceindekset. Hold den nuværende udgave ude af fælleskataloget uden særskilt tilladelse.';}
  else if(genericBonus){recommendation='rewrite-or-review';reason='Bonusnavnet kan beskrive en generisk mekanik, men beviser ingen rettighed til den gemte tekst. Match en konkret SRD-type eller skriv en selvstændig udgave.';}
  else if(sourceClaimsWotc){recommendation='withhold-current';reason='Angivet WotC-bog uden SRD-navnematch. Den gemte udgave bør ikke deles uden dokumenteret tilladelse; en ny selvstændig generisk idé kan vurderes separat.';}
  else{recommendation='rewrite-or-review';reason=claimsHomebrew?'Homebrew er ikke en licens. Bekræft forfatterens rettigheder og tilladelse, samt billedrettigheder, før deling.':'Ukendt eller anden kilde: kræver dokumenteret licens eller selvstændig omskrivning og billedkontrol.';}
  return {...row,category:small(item.category),rarity:small(item.rarity),recommendation,reason,references,distinctiveName,genericBonus,sourceClaimsWotc,
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
  '**Ingen nuværende poster er automatisk godkendt.** SRD-gruppen er kandidater til at beholde i en dokumenteret SRD-udgave. “Hold tilbage” betyder, at den nuværende udgave bør fjernes fra deling uden anden rettighedsdokumentation; det er ikke en sikker juridisk dom. Billeder vurderes separat.',''];
 for(const [key,title] of [['keep-concept-with-srd','Kandidater til at beholde som SRD-version'],['rewrite-or-review','Omskriv eller dokumentér rettigheder'],['withhold-current','Hold nuværende udgave ude af fælleskataloget']]){
  const group=report.records.filter(row=>row.recommendation===key).sort((a,b)=>a.name.localeCompare(b.name));
  lines.push(`## ${title} (${group.length})`,'','| Item | Dokument-ID | Angivet kilde | SRD-reference eller begrundelse |','| --- | --- | --- | --- |');
  for(const row of group)lines.push(`| ${cell(row.name)} | ${cell(row.id)} | ${cell(row.source)} | ${cell(row.references.length?row.references.map(ref=>`${ref.name} (${ref.edition}; ${ref.id})`).join('; '):row.reason)} |`);
  lines.push('');
 }
 lines.push('## Fælles krav før godkendelse','','- Verificeret tekstlicens og korrekt attribution; navnet og bogkilden alene er utilstrækkelige.','- Fjern ekstra quotes, egenskabstekst og billeder, der ikke er omfattet af den dokumenterede licens.','- Brug en placeholder eller egen/licenseret illustration; SRD-tekstlicensen omfatter ikke automatisk gamle bogillustrationer.','- Bevar originale data privat og kontrollér kopierne før ændringer i fælleskataloget.','- Tag særskilt stilling til allerede kopierede items og inventory-snapshots; slet ikke spillernes udstyr.','');
 return lines.join('\n');
}
export function annotationChunks(report){
 const encoded=gzipSync(Buffer.from(JSON.stringify(report))).toString('base64'),hash=digest(JSON.stringify(report));
 // Actions exposes at most ten notices per step. Keep a complete 659-item
 // metadata report within that limit while staying below annotation size limits.
 const chunks=encoded.match(/.{1,18000}/g)||[];
 if(chunks.length>10)throw Error('Report exceeds annotation transport capacity; use the complete artifact instead.');
 return chunks.map((part,i)=>`::notice title=Item review metadata ${i+1}/${chunks.length}::${hash}:${part}`);
}
async function main(){
 let project='',input='',output='',markdown='',annotations=false;
 for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i];if(key==='--public-project')project=process.argv[++i];else if(key==='--from-json')input=process.argv[++i];else if(key==='--report')output=process.argv[++i];else if(key==='--markdown')markdown=process.argv[++i];else if(key==='--annotations')annotations=true;else throw Error('Unknown argument: '+key);
 }
 if(!output||(!project&&!input)||(project&&input))throw Error('Use (--public-project PROJECT | --from-json SNAPSHOT) --report NEWFILE [--markdown NEWFILE] [--annotations]');
 const source=input?JSON.parse(await fs.readFile(input,'utf8')):await readPublicCatalogue(project);
 const reference=JSON.parse(await fs.readFile(new URL('../data/rules/srd-magic-item-text-hashes.json',import.meta.url),'utf8'));
 const report=reviewCatalogue(documentsToRows(source.documents),reference);
 await writePrivateFile(output,report);if(markdown)await fs.writeFile(markdown,reviewMarkdown(report),{mode:0o600,flag:'wx'});
 console.log(JSON.stringify(report.counts));
 if(annotations)for(const line of annotationChunks(report))console.log(line);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
