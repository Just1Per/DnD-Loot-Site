/** Build a prose-free matching index from pinned, CC-BY SRD source records. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const revision='0acbf263c74caf8ad080af7a16d86d3700a1ac8f';
export const digest=value=>createHash('sha256').update(value).digest('hex');
export const normalizedText=value=>String(value||'').normalize('NFC').replace(/\s+/gu,' ').trim();
export const nameKey=value=>normalizedText(value).toLocaleLowerCase('en-US');
export function buildReference(sources){
 const documents=[],entries=[];
 for(const source of sources){
  const documentRows=JSON.parse(source.document),rows=JSON.parse(source.items);
  const expected='srd-'+source.edition;
  const document=documentRows.find(row=>row.pk===expected)?.fields;
  if(!document?.licenses?.includes('cc-by-40')||document.publisher!=='wizards-of-the-coast')throw Error('Expected a pinned CC-BY Wizards SRD document');
  documents.push({edition:source.edition,name:document.name,license:'CC-BY-4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',officialSource:document.permalink,upstream:'https://github.com/open5e/open5e-api/tree/'+revision+'/data/v2/wizards-of-the-coast/'+expected,itemsSha256:digest(source.items),documentSha256:digest(source.document)});
  for(const row of rows){
   if(row.model!=='api_v2.magicitem'||row.fields?.document!==expected)throw Error('Unexpected source record');
   if(!normalizedText(row.fields.desc))continue;
   entries.push({id:row.pk,edition:source.edition,name:row.fields.name,nameKey:nameKey(row.fields.name),descriptionSha256:digest(normalizedText(row.fields.desc))});
  }
 }
 return {format:1,revision,scope:'Text-matching evidence only. A name match or hash does not approve attribution, artwork or an entire item for redistribution.',documents,entries:entries.sort((a,b)=>(a.edition+':'+a.id).localeCompare(b.edition+':'+b.id))};
}
async function main(){
 let directory='',output=new URL('../data/rules/srd-magic-item-text-hashes.json',import.meta.url);
 for(let i=2;i<process.argv.length;i++){
  if(process.argv[i]==='--from-directory')directory=process.argv[++i];
  else if(process.argv[i]==='--output')output=process.argv[++i];
  else throw Error('Use [--from-directory PATH] [--output PATH]');
 }
 const sources=[];
 for(const edition of ['2014','2024']){
  const read=async kind=>{
   if(directory)return fs.readFile(path.join(directory,edition+'-'+kind+'.json'),'utf8');
   const url='https://raw.githubusercontent.com/open5e/open5e-api/'+revision+'/data/v2/wizards-of-the-coast/srd-'+edition+'/'+kind+'.json';
   const response=await fetch(url);if(!response.ok)throw Error('Could not read pinned SRD source: '+response.status);return response.text();
  };
  sources.push({edition,document:await read('Document'),items:await read('MagicItem')});
 }
 const reference=buildReference(sources);await fs.writeFile(output,JSON.stringify(reference,null,2)+'\n');console.log('Built',reference.entries.length,'SRD text fingerprints; no item prose is included.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
