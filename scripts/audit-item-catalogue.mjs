/** Read-only evidence audit. No Admin SDK, credentials, mutation or deletion API. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest,normalizedText,nameKey} from './build-srd-item-hashes.mjs';
export const stableJson=value=>JSON.stringify(value&&typeof value==='object'?Array.isArray(value)?value.map(v=>JSON.parse(stableJson(v))):Object.fromEntries(Object.keys(value).sort().map(key=>[key,JSON.parse(stableJson(value[key]))])):value);
const short=value=>typeof value==='string'?value.replace(/[\x00-\x1f\x7f]/g,' ').slice(0,200):'';
export function decodeValue(value){
 if('stringValue' in value)return value.stringValue;
 if('booleanValue' in value)return value.booleanValue;
 if('nullValue' in value)return null;
 if('integerValue' in value){const n=Number(value.integerValue);if(!Number.isSafeInteger(n))return {type:'integer',value:value.integerValue};return n;}
 if('doubleValue' in value)return value.doubleValue;
 if('arrayValue' in value)return (value.arrayValue.values||[]).map(decodeValue);
 if('mapValue' in value)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([key,v])=>[key,decodeValue(v)]));
 // Keep non-prose Firestore values typed rather than silently losing them.
 for(const type of ['timestampValue','bytesValue','referenceValue','geoPointValue'])if(type in value)return {type,value:value[type]};
 throw Error('Unsupported Firestore value');
}
export function documentsToRows(documents){
 if(!Array.isArray(documents))throw Error('Expected a Firestore documents array');
 return documents.map(document=>{if(!/^projects\/[^/]+\/databases\/\(default\)\/documents\/items\/[^/]+$/.test(document.name||''))throw Error('Expected root item document path');return {id:document.name.split('/').at(-1),data:Object.fromEntries(Object.entries(document.fields||{}).map(([key,value])=>[key,decodeValue(value)])),raw:document.fields||{}};});
}
export async function readPublicCatalogue(project,{fetcher=fetch,maxPages=1000,allowReviewedOnlyFallback=false}={}){
 if(!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project))throw Error('Invalid Firebase project ID');
 const documents=[],tokens=new Set();let token='';
 for(let page=0;page<maxPages;page++){
  const url=new URL('https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents/items');
  url.searchParams.set('pageSize','1000');if(token)url.searchParams.set('pageToken',token);
  const response=await fetcher(url,{method:'GET',signal:AbortSignal.timeout(30000)});
  if(page===0&&[401,403].includes(response.status)&&allowReviewedOnlyFallback)return readReviewedPublicCatalogue(project,{fetcher,maxPages});
  if(!response.ok)throw Error('Public catalogue read failed ('+response.status+'). No credentials were used and no data was changed.');
  const data=await response.json();if(data.error)throw Error('Public catalogue returned an error. No data was changed.');
  if(data.documents&&!Array.isArray(data.documents))throw Error('Malformed Firestore response');
  documents.push(...(data.documents||[]));
  token=data.nextPageToken||'';if(!token)return {format:1,project,collection:'items',scope:'complete-root',completeRootCatalogue:true,documents};
  if(typeof token!=='string'||tokens.has(token))throw Error('Repeated or invalid page token');tokens.add(token);
 }
 throw Error('Audit page limit reached; refusing to report a partial catalogue');
}
export async function readReviewedPublicCatalogue(project,{fetcher=fetch,maxPages=1000}={}){
 if(!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project))throw Error('Invalid Firebase project ID');
 const documents=[],seen=new Set();let after='';
 for(let page=0;page<maxPages;page++){
  const structuredQuery={from:[{collectionId:'items'}],where:{fieldFilter:{field:{fieldPath:'catalogueStatus'},op:'EQUAL',value:{stringValue:'approved-v1'}}},orderBy:[{field:{fieldPath:'__name__'},direction:'ASCENDING'}],limit:1000,...(after?{startAt:{values:[{referenceValue:after}],before:false}}:{})};
  // runQuery is a read-only Firestore RPC even though its HTTP method is POST.
  const response=await fetcher(new URL('https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents:runQuery'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({structuredQuery}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Reviewed-only public query denied ('+response.status+'). No data was changed.');
  const data=await response.json();if(!Array.isArray(data)||data.some(row=>row.error))throw Error('Malformed reviewed-only query response');
  const batch=data.filter(row=>row.document).map(row=>row.document);
  for(const document of batch){if(document.fields?.catalogueStatus?.stringValue!=='approved-v1'||seen.has(document.name))throw Error('Unexpected or repeated reviewed-only document');seen.add(document.name);}
  documents.push(...batch);if(batch.length<1000)return {format:1,project,collection:'items',scope:'reviewed-public-only',completeRootCatalogue:false,documents};
  after=batch.at(-1).name;
 }
 throw Error('Reviewed-only page limit reached; refusing a partial result');
}
const knownFields=new Set(['id','name','description','quote','properties','classes','category','rarity','source','campaign','owner','attunement','image','imageUrl','imageBaseId','thumbnailUrl','mechanics','printed','receivedDate','available','visible','highlighted','lootMode','edition','license','licensedText','attribution','created','createdAt','updatedAt','version','_type']);
export function auditCatalogue(rows,reference,{project='offline',scope='complete-root',completeRootCatalogue=true}={}){
 if(reference?.format!==1||!Array.isArray(reference.entries)||!Array.isArray(reference.documents))throw Error('Unsupported reference index');
 if(reference.documents.some(document=>document.license!=='CC-BY-4.0'))throw Error('Unexpected reference licence');
 const names=new Map();for(const entry of reference.entries){if(!names.has(entry.nameKey))names.set(entry.nameKey,[]);names.get(entry.nameKey).push(entry);}
 const records=[],seen=new Set(),sourceCounts=new Map();
 for(const row of rows){
  if(!row.id||typeof row.id!=='string'||row.id.includes('/')||seen.has(row.id))throw Error('Invalid or duplicate catalogue document ID');seen.add(row.id);
  const item=row.data;if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Invalid catalogue record');
  if(row.id==='catalog_meta'||item._type==='catalog-meta')continue;
  const source=short(item.source)||'(not recorded)';sourceCounts.set(source,(sourceCounts.get(source)||0)+1);
  const prose=normalizedText(item.description),descriptionSha256=digest(prose);
  const candidates=(names.get(nameKey(item.name))||[]).filter(entry=>entry.descriptionSha256===descriptionSha256);
  const extraProse=!!normalizedText(item.quote)||(Array.isArray(item.properties)?item.properties.length>0:!!item.properties);
  const textStatus=!prose&&!extraProse?'no-description-prose':candidates.length&&!extraProse?'candidate-srd-text-match':'needs-text-review';
  const unreviewedFields=Object.keys(item).filter(field=>!knownFields.has(field));
  records.push({id:row.id,name:short(item.name),source,textStatus,descriptionSha256,
   recordSha256:digest(stableJson(row.raw||item)),candidateReferences:candidates.map(entry=>({id:entry.id,edition:entry.edition})),
   hasAdditionalProse:extraProse,unreviewedFields,
   hasStructuredMechanics:!!item.mechanics,
   artworkStatus:'needs-artwork-review',hasExplicitArtwork:!!(item.image||item.imageUrl||item.imageBaseId||item.thumbnailUrl),
   // The client can resolve public legacy artwork even when no URL is stored.
   mayUseImplicitPublicArtwork:true,
   sharingApproved:false,reviewRequired:true});
 }
 records.sort((a,b)=>a.id.localeCompare(b.id));
 return {format:1,project,collection:'items',scope,completeRootCatalogue,generatedAt:new Date().toISOString(),referenceRevision:reference.revision,
  notice:'Evidence triage, not a legal verdict. SRD-name/source labels are not proof of copied-text permission. Exact text matches still need attribution and artwork review. Nothing is approved for redistribution automatically.',
  counts:{documentsRead:rows.length,metadataRecords:rows.length-records.length,items:records.length,candidateSrdTextMatches:records.filter(row=>row.textStatus==='candidate-srd-text-match').length,needsTextReview:records.filter(row=>row.textStatus==='needs-text-review').length,noDescriptionProse:records.filter(row=>row.textStatus==='no-description-prose').length,artworkReview:records.length,sharingApproved:0},
  sources:[...sourceCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([source,count])=>({source,count})),records};
}
export async function writePrivateFile(file,data){
 // Refuse to overwrite a prior snapshot or report; local exports are private.
 await fs.writeFile(file,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});
}
async function main(){
 let project='',input='',report='',snapshot='',allowReviewedOnlyFallback=false,referenceFile=new URL('../data/rules/srd-magic-item-text-hashes.json',import.meta.url);
 for(let i=2;i<process.argv.length;i++){
  const option=process.argv[i];
  if(option==='--public-project')project=process.argv[++i];else if(option==='--from-json')input=process.argv[++i];else if(option==='--report')report=process.argv[++i];else if(option==='--snapshot')snapshot=process.argv[++i];else if(option==='--allow-reviewed-only')allowReviewedOnlyFallback=true;else if(option==='--reference')referenceFile=process.argv[++i];else throw Error('Unknown argument: '+option);
 }
 if(!report||(!project&&!input)||(project&&input))throw Error('Use (--public-project PROJECT | --from-json SNAPSHOT.json) --report NEW_REPORT.json [--snapshot NEW_PRIVATE_SNAPSHOT.json]');
 if(snapshot&&process.env.GITHUB_ACTIONS)throw Error('Raw item snapshots must not be exported into public CI artifacts. Run the snapshot locally.');
 const source=input?JSON.parse(await fs.readFile(input,'utf8')):await readPublicCatalogue(project,{allowReviewedOnlyFallback});
 if(source.collection&&source.collection!=='items')throw Error('Expected root item catalogue');
 if(!Array.isArray(source.documents))throw Error('Expected a complete item snapshot with a documents array');
 const rows=documentsToRows(source.documents);
 const reference=JSON.parse(await fs.readFile(referenceFile,'utf8'));
 const result=auditCatalogue(rows,reference,{project:project||source.project||'offline',scope:source.scope||'complete-root',completeRootCatalogue:source.completeRootCatalogue!==false});
 if(snapshot)await writePrivateFile(snapshot,source);
 await writePrivateFile(report,result);
 const summary={project:result.project,scope:result.scope,completeRootCatalogue:result.completeRootCatalogue,counts:result.counts,sources:result.sources};
 console.log(JSON.stringify(summary,null,2));
 if(process.env.GITHUB_ACTIONS)console.log('::notice title=Public item catalogue audit::'+JSON.stringify({...summary,sources:summary.sources.slice(0,12)}).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));
 console.log('Read-only audit complete. No items, images, campaigns or inventories were changed.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
