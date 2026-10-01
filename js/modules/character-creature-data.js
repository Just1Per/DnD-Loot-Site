'use strict';
/* Adobe/MPMB base creature mechanics used by Companion/Familiar/Wild Shape pages. */
var CharacterCreatureData = (() => {
  const rows=[];
  const byId=new Map();
  function add(batch){for(const row of batch||[]){if(!row?.id||byId.has(row.id))continue;rows.push(row);byId.set(row.id,row)}}
  const find=id=>byId.get(id)||null;
  const search=(query='')=>{const q=String(query).trim().toLowerCase();return q?rows.filter(row=>row.name.toLowerCase().includes(q)||String(row.type||'').toLowerCase().includes(q)):rows.slice()};
  return {rows,add,find,search};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterCreatureData;
