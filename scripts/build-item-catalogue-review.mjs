/** Build a self-contained visual review of licensed proposals, never private originals. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from './build-srd-item-hashes.mjs';
import {stableJson} from './audit-item-catalogue.mjs';

const check=(ok,message)=>{if(!ok)throw Error(message);};
export function reviewPayload(proposals,legacy){
 check(proposals?.kind==='complete-catalogue-decision-proposals'&&proposals.status==='unapproved'&&Array.isArray(proposals.decisions),'Unapproved complete proposals required');
 check(digest(stableJson(legacy))===proposals.sourceReviewSha256,'Legacy metadata does not match the proposal review');
 const original=new Map(legacy.records.map(row=>[row.id,row]));
 check(original.size===proposals.decisions.length&&new Set(proposals.decisions.map(row=>row.id)).size===original.size,'Review membership mismatch');
 const items=proposals.decisions.map(row=>{
  const old=original.get(row.id);check(old&&old.recordSha256===row.sourceSha256,'Original fingerprint mismatch');
  check(['publish','retire'].includes(row.action)&&row.approved===false,'Do not bundle approved or unknown actions');
  const reviewed={id:row.id,sourceSha256:row.sourceSha256,action:row.action};
  if(row.action==='publish'){
   check(row.rights?.license==='CC-BY-4.0'&&typeof row.replacement?.description==='string','Only licensed replacement text may be included');
   const allowed=['name','description','category','rarity','source','edition','attunement','classes','quote','properties','mechanics'];
   check(Object.keys(row.replacement).every(key=>allowed.includes(key))&&!row.replacement.quote&&Array.isArray(row.replacement.properties)&&!row.replacement.properties.length,'Unreviewed replacement fields');
   check(row.rights.sourceUrl.startsWith('https://github.com/open5e/open5e-api/blob/'),'Expected pinned source link');
   reviewed.replacement=row.replacement;reviewed.rights=row.rights;
  }
  const review=row.review||{},candidate=review.candidate||{};
  return {...reviewed,proposalSha256:digest(stableJson(reviewed)),
   legacy:{name:old.name,source:old.source,category:old.category||'',rarity:old.rarity||''},
   review:{reasonCode:review.reasonCode,reason:review.reason||'',referenceId:review.referenceId||candidate.referenceId||'',
    changes:review.changes||'',selectionReason:review.selectionReason||'',warnings:review.warnings||[],automation:review.automation||'',
    candidateRarity:review.candidateRarity||'',artwork:review.artwork||'',alternatives:(review.alternatives||[]).map(ref=>({id:ref.id,name:ref.name,edition:ref.edition}))}};
 });
 return {format:1,kind:'visual-catalogue-review',proposalSetSha256:digest(stableJson(proposals)),referenceRevision:proposals.referenceRevision,
  scope:'Review notes only. No Firebase reads, writes, publication or migration approval. Original descriptions and artwork are not included.',items};
}
export async function buildReviewHtml(proposals,legacy){
 const template=await fs.readFile(new URL('./item-catalogue-review-view.html',import.meta.url),'utf8');
 const encoded=JSON.stringify(reviewPayload(proposals,legacy)).replace(/[<>&\u2028\u2029]/g,char=>'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0'));
 check(template.split('<!-- REVIEW_PAYLOAD -->').length===2,'Expected one payload slot');
 return template.replace('<!-- REVIEW_PAYLOAD -->',()=>encoded);
}
async function main(){
 const args=process.argv.slice(2);check(args.length===2&&args[0]==='--output','Use --output NEW_HTML_FILE');
 const root=fileURLToPath(new URL('..',import.meta.url));
 const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
 const html=await buildReviewHtml(await read('docs/reports/item-catalogue-decisions.json'),await read('docs/reports/item-catalogue-review-2026-10-16.json'));
 await fs.writeFile(args[1],html,{flag:'wx'});
 console.log('Created a self-contained review page. No private originals, credentials or Firebase calls.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
