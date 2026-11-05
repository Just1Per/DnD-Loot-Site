'use strict';
/* Adult random-table outcomes are suggestions, never input validation or invented biological limits. */
var CharacterSizeGuidance=(()=>{
 const D=typeof CharacterRaceSizeData!=='undefined'?CharacterRaceSizeData:require('./character-race-size-data');
 const books={PHB:"Player's Handbook (2014), p. 121",VGM:"Volo's Guide to Monsters",MTF:"Mordenkainen's Tome of Foes",ERLW:'Eberron: Rising from the Last War',GGR:"Guildmasters' Guide to Ravnica",EEPC:"Elemental Evil Player's Companion",MOT:'Mythic Odysseys of Theros',EGW:"Explorer's Guide to Wildemount"};
 const tokens=text=>[...new Set(String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(word=>word&&!['variant','legacy','2014','2024'].includes(word)))].sort().join(' ');
 function dice(value=1){if(/^\d+$/.test(String(value)))return [Number(value),Number(value)];const match=/^(\d+)d(\d+)$/.exec(String(value));if(!match)throw Error('Unsupported height/weight dice.');return [Number(match[1]),Number(match[1])*Number(match[2])];}
 function bounds(row){const h=row.heightAndWeight,[lo,hi]=dice(h.heightMod),[wlo,whi]=dice(h.weightMod??1);return {heightMin:h.baseHeight+lo,heightMax:h.baseHeight+hi,weightMin:h.baseWeight+lo*wlo,weightMax:h.baseWeight+hi*whi};}
 function sourceCode(source){const text=String(source||'');if(books[text])return text;return Object.keys(books).find(code=>text.toLowerCase().includes(books[code].split(', p.')[0].toLowerCase()))||(/SRD 5\.1|2014/.test(text)&&!/2024/.test(text)?'PHB':null);}
 function project(data,rules=typeof CharacterRules==='undefined'?null:CharacterRules){
  const id=data?.build?.race||'',race=rules?.modern?.[id]||rules?.races?.[id],name=race?.name||'Selected species',source=race?.source||'',key=tokens(name),rows=D.records;
  let candidates=rows.filter(row=>tokens([row.raceName,row.name].filter(Boolean).join(' '))===key||tokens(row.name)===key);
  if(!candidates.length){const family=['dragonborn','halfling','gnome','dwarf','elf','human','yuan-ti'].find(part=>id.includes(part));if(family)candidates=rows.filter(row=>tokens(row.raceName||row.name)===tokens(family==='yuan-ti'?'Yuan-ti Pureblood':family));}
  if(!race||!candidates.length)return {name,source,available:false,lines:['No verified minimum/maximum is available for this source.','Choose height and weight for your character.']};
  const code=sourceCode(source),exact=candidates.filter(row=>row.source===code),priority=['PHB','VGM','MTF','ERLW','GGR','EEPC','MOT','EGW'];if(exact.length)candidates=exact;else{const preferred=priority.find(value=>candidates.some(row=>row.source===value));candidates=candidates.filter(row=>row.source===(preferred||candidates[0].source));}
  const ranges=candidates.map(bounds),heightMin=Math.min(...ranges.map(row=>row.heightMin)),heightMax=Math.max(...ranges.map(row=>row.heightMax)),weightMin=Math.min(...ranges.map(row=>row.weightMin)),weightMax=Math.max(...ranges.map(row=>row.weightMax));
  return {name,source,available:true,legacy:!exact.length,reference:books[candidates[0].source]||candidates[0].source,tables:candidates.map(row=>[row.raceName,row.name].filter(Boolean).join(' — ')),height:{min:heightMin,max:heightMax,cmMin:heightMin*2.54,cmMax:heightMax*2.54},weight:{min:weightMin,max:weightMax,kgMin:weightMin*0.45359237,kgMax:weightMax*0.45359237}};
 }
 const decimal=n=>Number(n.toFixed(1)).toLocaleString('en-US'),feet=n=>Math.floor(n/12)+'′ '+n%12+'″';
 function text(data,field,rules){const p=project(data,rules);if(!p.available)return {title:p.name+' · '+field,lines:p.lines};const height=field==='height',r=height?p.height:p.weight;return {title:p.name+' · '+(height?'Height':'Weight')+' guidance',lines:[(p.legacy?'Earlier-printing table reference. ':'')+'Random-table minimum: '+(height?decimal(r.cmMin)+' cm ('+feet(r.min)+')':decimal(r.kgMin)+' kg ('+r.min+' lb)')+'.','Random-table maximum: '+(height?decimal(r.cmMax)+' cm ('+feet(r.max)+')':decimal(r.kgMax)+' kg ('+r.max+' lb)')+'.','Source: '+p.reference+'.'+(p.legacy&&p.source?' Selected source: '+p.source+'.':''),'Adult character guidance. Values outside this range are allowed.']};}
 return{dice,bounds,project,text};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSizeGuidance;
