/**
 * Dry-run/write migration for root magic armor items.
 * Stores explicit CharacterEquipment mechanics plus armor AC facts so a copied
 * campaign item never has to guess its AC from description text.
 *
 * Usage:
 *   node scripts/migrate-magic-armor-ac.mjs --project YOUR_PROJECT
 *   node scripts/migrate-magic-armor-ac.mjs --project YOUR_PROJECT --write
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Equipment=require('../js/modules/character-equipment.js');
globalThis.CharacterEquipment=Equipment;
const MagicArmor=require('../js/modules/character-magic-armor.js');

export function patchFor(item={}){
  const found=MagicArmor.infer(item);
  if(!found)return null;
  const mechanics=Equipment.normalize(found);
  const patch={mechanics,mechanicsSource:found.source||'Adobe magic armor reference'};
  if(mechanics.kind==='armor'){
    const base=Equipment.armor[mechanics.base];
    if(!base)return null;
    patch.armorBaseAC=base.baseAC;
    patch.armorMagicBonus=mechanics.acBonus;
    patch.armorClass=base.baseAC+mechanics.acBonus;
  }else if(mechanics.kind==='shield'){
    patch.armorBaseAC=2;
    patch.armorMagicBonus=mechanics.acBonus;
    patch.armorClass=2+mechanics.acBonus;
  }
  return patch;
}

async function main(){
  const args=process.argv.slice(2);let project='',write=false;
  for(let i=0;i<args.length;i++){
    if(args[i]==='--project')project=args[++i]||'';
    else if(args[i]==='--write')write=true;
    else throw Error('Unknown argument: '+args[i]);
  }
  if(!project)throw Error('Use --project YOUR_FIREBASE_PROJECT_ID [--write]');
  if(process.env.FIRESTORE_EMULATOR_HOST&&!project.startsWith('demo-'))throw Error('Use a demo- project with the emulator');
  const {initializeApp,applicationDefault}=await import('firebase-admin/app');
  const {getFirestore}=await import('firebase-admin/firestore');
  initializeApp(process.env.FIRESTORE_EMULATOR_HOST?{projectId:project}:{projectId:project,credential:applicationDefault()});
  const db=getFirestore(),snapshot=await db.collection('items').get();
  const candidates=[];
  for(const doc of snapshot.docs){const patch=patchFor(doc.data());if(patch)candidates.push({id:doc.id,name:doc.data().name,...patch});}
  console.log(JSON.stringify({project,mode:write?'WRITE':'DRY RUN',rootItems:snapshot.size,candidates:candidates.length,items:candidates.map(x=>({id:x.id,name:x.name,armorBaseAC:x.armorBaseAC,armorMagicBonus:x.armorMagicBonus,armorClass:x.armorClass,mechanics:x.mechanics}))},null,2));
  if(!write)return;
  let updated=0;
  for(const row of candidates){const {id,name,...patch}=row;await db.collection('items').doc(id).update({...patch,updatedAt:Date.now()});updated++;}
  console.log(`Updated ${updated} root magic-armor items.`);
}

if(import.meta.url===new URL(`file://${process.argv[1]}`).href)main().catch(error=>{console.error(error);process.exitCode=1;});
