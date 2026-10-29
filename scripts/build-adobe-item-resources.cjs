'use strict';
/* Static metadata only. Never evaluates Acrobat code, callbacks or item prose. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const acorn=require(path.join(root,'tests/node_modules/acorn'));
const propertyName=p=>p.computed?null:p.key?.name??p.key?.value;
const field=(object,key)=>object?.properties?.find(p=>p.type==='Property'&&p.kind==='init'&&propertyName(p)===key)?.value;
const literal=node=>node?.type==='Literal'?node.value:undefined;
const text=node=>typeof literal(node)==='string'?literal(node).trim():'';
const key=name=>name.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
function allowance(node){
 const value=literal(node);
 if(Number.isInteger(value)&&value>0&&value<=10000)return{max:value,unit:'uses'};
 if(typeof value!=='string')return null;
 const match=/^(\d{1,5})\s*(min(?:ute)?s?|hours?|charges?|uses?)$/i.exec(value.trim());
 if(!match||Number(match[1])<1||Number(match[1])>10000)return null;
 return{max:Number(match[1]),unit:/^min/i.test(match[2])?'minutes':/^hour/i.test(match[2])?'hours':/^charge/i.test(match[2])?'charges':'uses'};
}
function recoveryRule(label,additional,hasDynamicAdditional){
 const normalized=label.toLowerCase().replace(/\s+/g,' ').trim();
 const event=({'dawn':'dawn','day':'dawn','daily':'dawn','short rest':'short','long rest':'long','never':'never'})[normalized]||'manual';
 if(event==='never')return{event,mode:'none'};
 if(event==='manual'||hasDynamicAdditional)return{event,mode:'manual'};
 const roll=/^regains?\s+(\d{1,3})d(\d{1,3})(?:\s*([+-])\s*(\d{1,3}))?$/i.exec(additional);
 if(roll){const count=Number(roll[1]),size=Number(roll[2]),bonus=Number(roll[4]||0)*(roll[3]==='-'?-1:1);return count>=1&&count<=100&&size>=2&&size<=100?{event,mode:'roll',roll:{count,size,bonus}}:{event,mode:'manual'};}
 // Unknown qualifiers may describe partial recovery or another condition.
 if(additional&&!/^(?:minutes?|hours?|charges?|uses?)$/i.test(additional))return{event,mode:'manual'};
 return{event,mode:'all'};
}
function parseReference(source){
 const tree=acorn.parse(source,{ecmaVersion:'latest'}),declaration=tree.body.flatMap(node=>node.type==='VariableDeclaration'?node.declarations:[]).find(node=>node.id?.name==='Base_MagicItemsList');
 if(declaration?.init?.type!=='ObjectExpression')throw Error('Expected a literal Base_MagicItemsList declaration.');
 const candidates=[],excluded=[];
 function visit(object,parent=''){
  if(object?.type!=='ObjectExpression')return;
  const ownName=text(field(object,'name')),name=ownName||parent,uses=field(object,'usages'),recovery=field(object,'recovery');
  if(uses||recovery){
   const calculated=field(object,'usagescalc'),pool=calculated&&literal(calculated)!==''?null:allowance(uses),label=text(recovery),additionalNode=field(object,'additional'),additional=text(additionalNode);
   if(!ownName||!pool||!label||name.length>200||label.length>100||additional.length>160)excluded.push({name:name.slice(0,200),reason:!ownName?'unnamed-variant':!pool?'dynamic-or-unsupported-allowance':'dynamic-or-unsupported-recovery'});
   else{
    const shortColumn=text(field(object,'spellFirstColTitle'));
    if(/^ch(?:arges)?$/i.test(shortColumn))pool.unit='charges';
    if(/^(?:minutes?|hours?|charges?|uses?)$/i.test(additional))pool.unit=additional.toLowerCase().replace(/s?$/,'s');
    const attunementNode=field(object,'attunement'),attunement=literal(attunementNode);
    candidates.push({name,key:key(name),...pool,recovery:label,recharge:recoveryRule(label,additional,!!additionalNode&&typeof literal(additionalNode)!=='string'),...(additional?{reminder:additional}:{}),requiresAttunement:attunementNode&&!['boolean','string'].includes(typeof attunement)?null:attunement===true||typeof attunement==='string'&&!!attunement.trim()});
   }
  }
  // Only named literal variants are eligible; unrelated nested blocks cannot
  // inherit an item's name and silently create a second competing pool.
  for(const p of object.properties||[])if(p.type==='Property'&&p.kind==='init'&&p.value?.type==='ObjectExpression')visit(p.value,name);
 }
 for(const p of declaration.init.properties)if(p.type==='Property'&&p.kind==='init')visit(p.value,String(propertyName(p)||''));
 const grouped=new Map();for(const row of candidates){const list=grouped.get(row.key)||[];list.push(row);grouped.set(row.key,list);}
 const definitions=[];
 for(const [name,variants]of grouped){const signatures=new Set(variants.map(({name,...row})=>JSON.stringify(row)));if(signatures.size===1)definitions.push(variants[0]);else excluded.push({name,reason:'ambiguous-variant-pools'});}
 definitions.sort((a,b)=>a.key.localeCompare(b.key,'en'));
 return{format:1,source:{name:'MPMB v13.0.4 Printer Friendly',module:'ListsMagicItems',edition:'2014',sha256:crypto.createHash('sha256').update(source).digest('hex')},definitions,excluded};
}
function readPDF(file){
 const python="import importlib.util,sys\nfrom pypdf import PdfReader\nspec=importlib.util.spec_from_file_location('scan',sys.argv[2]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\nr=PdfReader(sys.argv[1]);names=m.obj(r.trailer['/Root'].get('/Names',{}))\nfor name,ref in m.named_pairs(names.get('/JavaScript')):\n if name=='ListsMagicItems':\n  print(m.script(m.obj(ref)));break\nelse: raise ValueError('ListsMagicItems module not found')\n";
 const result=spawnSync('python3',['-c',python,file,path.join(root,'scripts/scan-adobe-sheet.py')],{encoding:'utf8',maxBuffer:2*1024*1024,timeout:30000});
 if(result.error||result.status!==0)throw Error('Could not read the static item reference.');return result.stdout;
}
if(require.main===module){
 try{const args=process.argv.slice(2),at=flag=>args.indexOf(flag),pdf=at('--pdf')>=0?args[at('--pdf')+1]:null,output=at('--output')>=0?args[at('--output')+1]:path.join(root,'js/modules/character-item-resource-data.js');if(!pdf)throw Error('Usage: node scripts/build-adobe-item-resources.cjs --pdf /path/to/reference.pdf [--output /path/to/metadata.json]');const data=parseReference(readPDF(pdf));const json=JSON.stringify(data,null,2);fs.writeFileSync(output,output.endsWith('.js')?'/* Generated static MPMB item resource metadata. No Acrobat execution or item prose. */\nvar CharacterItemResourceReference = '+json+';\nif(typeof module!=="undefined"&&module.exports)module.exports=CharacterItemResourceReference;\n':json+'\n');process.stdout.write('Wrote '+data.definitions.length+' literal item resource definitions; '+data.excluded.length+' unsupported/ambiguous pools excluded.\n');}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
module.exports={parseReference,allowance,recoveryRule};
