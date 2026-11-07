#!/usr/bin/env node
'use strict';
// Parse static reference data only. Never evaluate Acrobat code or expressions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),acorn=createRequire(path.join(root,'tests/package.json'))('acorn');
function literal(node,depth=0){
 if(depth>100)throw Error('Static data nesting limit exceeded.');if(!node)return undefined;
 if(node.type==='Literal'&&!node.regex&&(node.value===null||['string','number','boolean'].includes(typeof node.value)))return node.value;
 if(node.type==='UnaryExpression'&&['-','+'].includes(node.operator)&&node.argument.type==='Literal'&&typeof node.argument.value==='number')return node.operator==='-'?-node.argument.value:node.argument.value;
 if(node.type==='ArrayExpression')return node.elements.map(value=>literal(value,depth+1));
 if(node.type==='ObjectExpression'){const out=Object.create(null);for(const p of node.properties){if(p.type!=='Property'||p.kind!=='init'||p.computed||p.method)continue;const key=p.key.type==='Identifier'?p.key.name:p.key.value,value=literal(p.value,depth+1);if(typeof key==='string'&&value!==undefined)out[key]=value;}return out;}
 return undefined;
}
function extract(source){const tree=acorn.parse(source,{ecmaVersion:2020}),declaration=tree.body.flatMap(node=>node.declarations||[]).find(node=>node.id?.name==='Base_CreatureList');if(declaration?.init?.type!=='ObjectExpression')throw Error('Static Base_CreatureList not found.');return literal(declaration.init);}
const slug=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),text=value=>typeof value==='string'?value.slice(0,12000):'';
function supplement(existing,reference){
 const byId=new Map(Object.entries(reference).map(([key,value])=>[slug(key),value]));
 return existing.map(previous=>{const source=byId.get(previous.id);if(!source)throw Error('Missing reference creature: '+previous.id);assert.equal(source.name,previous.name,'Creature names must match before supplementing');assert.equal(source.attacks.length,previous.attacks.length,'Attack counts must match');
  const attacks=previous.attacks.map((attack,i)=>{const data=source.attacks[i];assert.deepEqual([attack.n,attack.a,attack.d,attack.r,!!attack.dc],[data.name,data.ability,data.damage,data.range,!!data.dc],'Existing attack facts must match before supplementing');const modifiers=data.modifiers;if(modifiers!==undefined&&(!Array.isArray(modifiers)||modifiers.length>3||modifiers.some(value=>!['number','string','boolean'].includes(typeof value))))throw Error('Unsupported static attack modifiers');const base={...attack};delete base.description;delete base.tooltip;delete base.modifiers;return {...base,...(text(data.description)?{description:text(data.description)}:{}),...(text(data.tooltip)?{tooltip:text(data.tooltip)}:{}),...(modifiers?{modifiers}:{} )};});
  if(!Array.isArray(source.saves)||source.saves.length!==6||source.saves.some(value=>value!==''&&!(typeof value==='number'&&Number.isFinite(value))))throw Error('Unsupported static saving throws');
  const skillTotals=Object.fromEntries(Object.entries(source.skills||{}).map(([key,value])=>{if(typeof value!=='number'||!Number.isFinite(value))throw Error('Unsupported static skill total');return[key,value]}));
  const details=rows=>(rows||[]).map(row=>({name:text(row.name),description:text(row.description)}));
  const count=Number(source.attacksAction);if(!Number.isInteger(count)||count<0||count>10)throw Error('Unsupported attack-action count');
  const base={...previous};for(const key of ['edition','alignment','languages','vulnerabilities','saveTotals','skillTotals','traitDetails','featureDetails','attacksAction'])delete base[key];
  return {...base,attacks,edition:'2014',alignment:text(source.alignment).replace(/\b[a-z]/g,value=>value.toUpperCase()),languages:text(source.languages),vulnerabilities:text(source.damage_vulnerabilities),saveTotals:source.saves.map(value=>value===''?null:value),skillTotals,traitDetails:details(source.traits),featureDetails:details(source.features),attacksAction:count};
 });
}
function readSource(file){if(path.extname(file).toLowerCase()!=='.pdf')return fs.readFileSync(file,'utf8');
 const python=`import importlib.util,sys\nfrom pypdf import PdfReader\nspec=importlib.util.spec_from_file_location('scan',sys.argv[2]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\nr=PdfReader(sys.argv[1]);names=m.obj(r.trailer['/Root'].get('/Names',{}))\nfor name,ref in m.named_pairs(names.get('/JavaScript')):\n if name=='ListsCreatures':\n  print(m.script(m.obj(ref)));break\nelse: raise ValueError('ListsCreatures module not found')\n`;
 const result=spawnSync('python3',['-c',python,file,path.join(root,'scripts/scan-adobe-sheet.py')],{encoding:'utf8',maxBuffer:2*1024*1024,timeout:30000});if(result.error)throw result.error;if(result.status!==0)throw Error('Could not read static creature reference: '+result.stderr);return result.stdout;
}
if(require.main===module){const file=process.argv[2];if(!file)throw Error('Usage: node scripts/build-adobe-creature-metadata.cjs reference.pdf [output-directory]');const reference=extract(readSource(path.resolve(file))),directory=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'js/modules'),writes=[];let count=0;for(let i=1;i<=4;i++){const name='character-creature-data-'+i+'.js',existing=fs.readFileSync(path.join(root,'js/modules',name),'utf8'),match=existing.match(/CharacterCreatureData\.add\(([\s\S]+)\);/);if(!match)throw Error('Unknown generated data format');const rows=supplement(JSON.parse(match[1]),reference);count+=rows.length;writes.push([path.join(directory,name),'/* Static MPMB 13.0.4 / SRD 2014 creature metadata. Generated without executing PDF code. */\nCharacterCreatureData.add('+JSON.stringify(rows)+');\n']);}fs.mkdirSync(directory,{recursive:true});for(const [target,content]of writes)fs.writeFileSync(target,content);console.log('Supplemented '+count+' creature records from static reference data.');}
module.exports={extract,supplement};
