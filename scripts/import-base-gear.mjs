/** Add missing root gear templates. Local CLI only; existing templates are never replaced. */
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url),Equipment=require('../js/modules/character-equipment.js');
export function gearTemplates(data){
 const rows=data.gear.map(g=>({id:'srd-'+g.id,name:g.unitName||g.name,weight:g.weight,category:g.category||'Adventuring gear',source:'Adobe SRD gear · 2014',description:`Unit: ${g.unitName}. Units per purchase: ${g.quantity}. Weight per unit: ${g.weight} lb. Listed price: ${g.price||'not specified'}.`}));
 for(const [id,w] of Object.entries(Equipment.weapons))rows.push({id:'srd-weapon-'+id,name:w.name,category:'Weapon',source:'SRD 5.1 / 5.2',description:'Base weapon statistics follow the character edition.'});
 for(const [id,w] of Object.entries(Equipment.armor))rows.push({id:'srd-armor-'+id,name:w.name,category:'Armor',source:'SRD 5.1 / 5.2',description:'Base armor statistics.'});
 rows.push({id:'srd-armor-shield',name:'Shield',category:'Armor',source:'SRD 5.1 / 5.2',description:'Shield: +2 AC while equipped.'});
 const ids=new Set();return rows.map(r=>{if(ids.has(r.id)||!r.name)throw Error('Invalid gear template');ids.add(r.id);return {...r,rarity:'Common',attunement:false,classes:[],properties:r.weight?[{title:'Weight per unit (lb)',text:String(r.weight)}]:[],imageUrl:'',imageBaseId:'',quote:'',mechanics:Equipment.infer(r)};});
}
export async function publishGear(db,rows){
 let created=0,existing=0;
 for(const {id,...row} of rows){const added=await db.runTransaction(async tx=>{const ref=db.doc('items/'+id),snapshot=await tx.get(ref);if(snapshot.exists)return false;tx.create(ref,{...row,createdAt:Date.now(),updatedAt:Date.now()});return true;});if(added)created++;else existing++;}
 return {created,existing};
}
async function main(){
 const args=process.argv.slice(2);let project,write=false;
 for(let i=0;i<args.length;i++){if(args[i]==='--project')project=args[++i];else if(args[i]==='--write')write=true;else throw Error('Unknown argument: '+args[i]);}
 if(!project||!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project))throw Error('Use --project YOUR_FIREBASE_PROJECT_ID [--write]');
 if(process.env.FIRESTORE_EMULATOR_HOST&&!project.startsWith('demo-'))throw Error('Use a demo- project with the emulator');
 const data=JSON.parse(await fs.readFile(new URL('../data/rules/adobe-reference.json',import.meta.url),'utf8')),rows=gearTemplates(data);
 console.log(JSON.stringify({project,templates:rows.length,mode:write?'WRITE missing root templates only':'DRY RUN'},null,2));if(!write)return;
 const {initializeApp,applicationDefault}=await import('firebase-admin/app'),{getFirestore}=await import('firebase-admin/firestore');
 initializeApp(process.env.FIRESTORE_EMULATOR_HOST?{projectId:project}:{projectId:project,credential:applicationDefault()});console.log(await publishGear(getFirestore(),rows));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
