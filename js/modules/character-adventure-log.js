'use strict';
/* Private paper log accounting. This never awards character XP, coins or items. */
var CharacterAdventureLog=(()=>{
 const keys=['xp','gold','downtime','renown','magicItems'],MAX_ROWS=120,MAX_VALUE=1e9;
 function amount(value,key,blank=true){
  const text=String(value??'').trim();if(!text&&blank)return '';
  if(!/^[+-]?\d+(?:[.,]\d{1,2})?$/.test(text))throw Error('Enter a number'+(key==='gold'?' with at most two decimal places':' without decimals')+'.');
  const n=Number(text.replace(',','.'));if(!Number.isFinite(n)||Math.abs(n)>MAX_VALUE||key!=='gold'&&!Number.isInteger(n))throw Error('Enter '+(key==='gold'?'an amount':'a whole number')+' between −1,000,000,000 and 1,000,000,000.');
  return n;
 }
 function normalize(raw={}){
  if(!raw||typeof raw!=='object')raw={};
  const safe=(v,key)=>{try{return amount(v,key)}catch{return ''}},start=Object.fromEntries(keys.map(k=>[k,safe(raw.start?.[k],k)]));let remaining=100000;
  const rows=(Array.isArray(raw.rows)?raw.rows:[]).slice(0,MAX_ROWS).map(r=>{const notes=String(r?.notes||'').slice(0,Math.min(4000,remaining));remaining-=notes.length;return {...Object.fromEntries(['adventure','session','dm','date'].map(k=>[k,String(r?.[k]||'').slice(0,k==='session'?40:200)])),notes,gain:Object.fromEntries(keys.map(k=>[k,safe(r?.gain?.[k],k)]))};});
  return {faction:String(raw.faction||'').slice(0,160),playerId:String(raw.playerId||'').slice(0,100),start,rows};
 }
 function project(raw={}){
  const log=normalize(raw),balance=Object.fromEntries(keys.map(k=>[k,Math.round((log.start[k]||0)*100)]));
  return Array.from({length:MAX_ROWS},(_,i)=>{const row=log.rows[i]||normalize({rows:[{}]}).rows[0],start={},total={};for(const k of keys){start[k]=balance[k]/100;balance[k]+=Math.round((row.gain[k]||0)*100);total[k]=balance[k]/100;}return {...row,start,total};});
 }
 function edit(raw,index,key,value,part){
  if(!Number.isInteger(index)||index<0||index>=MAX_ROWS)throw Error('This adventure log has reached its 120-entry limit.');
  const log=normalize(raw);
  if(part==='header'){if(!['faction','playerId'].includes(key))throw Error('Unknown log header.');if(String(value).length>(key==='faction'?160:100))throw Error('This text is too long.');log[key]=String(value);return log;}
  if(part==='start'){if(index!==0||!keys.includes(key))throw Error('Only the first entry has an editable starting balance.');log.start[key]=amount(value,key);return log;}
  while(log.rows.length<=index)log.rows.push(normalize({rows:[{}]}).rows[0]);const row=log.rows[index];
  if(part==='gain'){if(!keys.includes(key))throw Error('Unknown log balance.');row.gain[key]=amount(value,key);}
  else {if(!['adventure','session','dm','date','notes'].includes(key))throw Error('Unknown log field.');value=String(value);if(value.length>(key==='notes'?4000:key==='session'?40:200))throw Error('This text is too long.');row[key]=value;}
  if(log.rows.reduce((sum,entry)=>sum+entry.notes.length,0)>100000)throw Error('The adventure log has reached its remaining note space.');
  return log;
 }
 return {keys,MAX_ROWS,amount,normalize,project,edit};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdventureLog;
