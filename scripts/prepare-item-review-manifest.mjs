import {generatedArtworkPolicy} from './item-artwork-policy.mjs';
/** Build an unapproved decision worksheet from the prose-free full audit report. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writePrivateFile} from './audit-item-catalogue.mjs';
export function draftManifest(report,campaignId){
 if(report?.format!==1||!Array.isArray(report.records)||report.completeRootCatalogue===false)throw Error('A complete root catalogue review is required');
 if(typeof campaignId!=='string'||!campaignId||campaignId.includes('/'))throw Error('Target campaign ID required');
 if(report.records.some(row=>!row.id||!/^[a-f0-9]{64}$/.test(row.recordSha256)))throw Error('Missing source fingerprints');
 return {format:1,targetCampaignId:campaignId,artworkPolicy:{...generatedArtworkPolicy},retireLegacyArtwork:false,
  note:'Unapproved worksheet. Resolve every action, select complete replacement/rights evidence where publishing, and verify generated-art preservation and the move of retired-only images to the private campaign. No production write is authorized by this file.',
  decisions:report.records.map(row=>({id:row.id,name:row.name,sourceSha256:row.recordSha256,action:'review',
   suggestedAction:row.recommendation==='keep-concept-with-srd'?'publish':row.recommendation==='withhold-current'?'retire':'review',
   recommendation:row.recommendation,referenceCandidates:row.references||[],approved:false,reviewedBy:'',reviewedAt:''}))};
}
async function main(){
 const options={};for(let i=2;i<process.argv.length;i+=2){if(!['--report','--campaign','--output'].includes(process.argv[i])||!process.argv[i+1])throw Error('Use --report FILE --campaign ID --output NEWFILE');options[process.argv[i]]=process.argv[i+1];}
 const manifest=draftManifest(JSON.parse(await fs.readFile(options['--report'],'utf8')),options['--campaign']);
 await writePrivateFile(options['--output'],manifest);console.log('Created an unapproved worksheet for '+manifest.decisions.length+' items. No data changed.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1});
