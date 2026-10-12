'use strict';
// Prepare local JSON only. Publishing remains an explicit Cloud Shell action.
const fs=require('node:fs');
const BUCKET='dnd-loot-site.firebasestorage.app';
function prepare(bucket,desired){
 if(!bucket||typeof bucket!=='object'||Array.isArray(bucket))throw Error('Expected complete bucket metadata, not the CORS-only null result.');
 if(bucket.name!==BUCKET&&!(bucket.name===undefined&&String(bucket.storage_url||'').replace(/\/$/,'')==='gs://'+BUCKET))throw Error('Bucket metadata does not identify the expected campaign image bucket.');
 const values=['cors_config','cors'].map(key=>bucket[key]).filter(value=>value!=null);
 if(values.some(value=>!Array.isArray(value)))throw Error('Existing CORS configuration is not a JSON array; do not publish.');
 if(values.length===2&&JSON.stringify(values[0])!==JSON.stringify(values[1]))throw Error('Conflicting CORS fields; inspect the backup before publishing.');
 if(Object.keys(bucket).some(key=>/cors/i.test(key)&&!['cors_config','cors'].includes(key)&&bucket[key]!=null))throw Error('Unrecognized CORS field; inspect the backup before publishing.');
 const existing=structuredClone(values[0]||[]);
 if(!Array.isArray(desired)||!desired.length||[...existing,...desired].some(entry=>!entry||!Array.isArray(entry.origin)||!Array.isArray(entry.method)||entry.origin.some(value=>typeof value!=='string')||entry.method.some(value=>typeof value!=='string')))throw Error('Invalid CORS entry; do not publish.');
 for(const entry of desired){
  if(entry.method.length!==1||entry.method[0]!=='GET'||entry.origin.some(origin=>!/^https:\/\/[A-Za-z0-9.-]+$/.test(origin)))throw Error('Campaign image additions must allow GET from explicit HTTPS origins only.');
  const missing=entry.origin.filter(origin=>!existing.some(prior=>prior.method.includes('GET')&&(prior.origin.includes(origin)||prior.origin.includes('*'))));
  if(missing.length)existing.push({...structuredClone(entry),origin:[...new Set(missing)]});
 }
 return existing;
}
if(require.main===module){
 try{
  const [backup,desired,output]=process.argv.slice(2);
  if(!backup||!desired||!output)throw Error('Usage: node prepare-campaign-image-cors.cjs BUCKET_BACKUP.json DESIRED_CORS.json OUTPUT.json');
  const merged=prepare(JSON.parse(fs.readFileSync(backup,'utf8')),JSON.parse(fs.readFileSync(desired,'utf8')));
  fs.writeFileSync(output,JSON.stringify(merged,null,2)+'\n',{flag:'wx'});
  process.stdout.write(JSON.stringify(merged,null,2)+'\n');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={prepare,BUCKET};
