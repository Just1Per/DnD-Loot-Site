'use strict';
/* Private paper log accounting. This never awards character XP, coins or items. */
var CharacterAdventureLog=(()=>{
 const keys=['xp','gold','downtime','renown','magicItems'],MAX_ROWS=120,MAX_VALUE=1e9;
 // A small arithmetic grammar; user input never becomes JavaScript code.
 const MAX_EXPRESSION=200,MAX_TOKENS=100,MAX_DEPTH=16,MAX_BITS=128;
 const simple=text=>/^[+-]?\d+(?:[.,]\d{1,2})?$/.test(text);
 function fraction(n,d=1n){
  if(d===0n)throw Error('Division by zero is not allowed.');if(d<0n){n=-n;d=-d;}
  let a=n<0n?-n:n,b=d;while(b){const rest=a%b;a=b;b=rest;}n/=a;d/=a;
  if((n<0n?-n:n).toString(2).length>MAX_BITS||d.toString(2).length>MAX_BITS)throw Error('This calculation is too large. Use smaller amounts.');
  return [n,d];
 }
 function arithmetic(raw){
  const text=raw.replace(/,/g,'.').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'),tokens=[];let at=0;
  while(at<text.length){if(/\s/.test(text[at])){at++;continue;}const match=/^(?:\d+(?:\.\d{1,6})?|\.\d{1,6})/.exec(text.slice(at));if(match){tokens.push(match[0]);at+=match[0].length;}else if('+-*/()'.includes(text[at]))tokens.push(text[at++]);else throw Error('Use numbers, +, −, ×, ÷ and parentheses only.');if(tokens.length>MAX_TOKENS)throw Error('This calculation has too many parts.');}
  let pos=0;
  function primary(depth){
   if(depth>MAX_DEPTH)throw Error('This calculation has too many nested parentheses or signs.');
   const token=tokens[pos++];if(token==='+'||token==='-'){const value=primary(depth+1);return token==='-'?[-value[0],value[1]]:value;}
   if(token==='('){const value=sum(depth+1);if(tokens[pos++]!==')')throw Error('Close each parenthesis in the calculation.');return value;}
   if(!token||!/^\d|^\./.test(token))throw Error('Enter a number after each arithmetic sign.');
   const [whole,decimal='']=token.split('.');return fraction(BigInt((whole||'0')+decimal),10n**BigInt(decimal.length));
  }
  function product(depth){let left=primary(depth);while(tokens[pos]==='*'||tokens[pos]==='/'){const op=tokens[pos++],right=primary(depth);left=op==='*'?fraction(left[0]*right[0],left[1]*right[1]):fraction(left[0]*right[1],left[1]*right[0]);}return left;}
  function sum(depth){let left=product(depth);while(tokens[pos]==='+'||tokens[pos]==='-'){const op=tokens[pos++],right=product(depth);left=fraction(left[0]*right[1]+(op==='+'?1n:-1n)*right[0]*left[1],left[1]*right[1]);}return left;}
  const result=sum(0);if(pos!==tokens.length)throw Error('Put an arithmetic sign between numbers and parentheses.');return result;
 }
 function amount(value,key,blank=true){
  if(!keys.includes(key))throw Error('Unknown log balance.');
  if(value!=null&&!['string','number'].includes(typeof value))throw Error('Enter a number or an arithmetic calculation.');
  const text=String(value??'').trim();if(!text&&blank)return '';if(!text)throw Error('Enter a number or an arithmetic calculation.');
  if(text.length>MAX_EXPRESSION)throw Error('Keep calculations within 200 characters.');
  if(simple(text)){const n=Number(text.replace(',','.'));if(Number.isFinite(n)&&Math.abs(n)<=MAX_VALUE&&(key==='gold'||Number.isInteger(n)))return n;}
  const [n,d]=arithmetic(text),scale=key==='gold'?100n:1n,ticks=n*scale;
  if(ticks%d!==0n)throw Error(key==='gold'?'The gold result must have at most two decimal places.':'The result must be a whole number for this balance.');
  const total=ticks/d;if(total>BigInt(MAX_VALUE)*scale||total< -BigInt(MAX_VALUE)*scale)throw Error('The result must be between −1,000,000,000 and 1,000,000,000.');return Number(total)/Number(scale);
 }
 // Memoize validated annotations by weak object identity, including normalized
 // copies. Editing either the formula or its numeric amount invalidates that key.
 // Weak keys cannot retain a character's log after its session is discarded.
 const expressionCache=new WeakMap();
 function expressions(raw,values){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;const cache=expressionCache.get(raw)||{};expressionCache.set(raw,cache);
  const out={};for(const key of keys){const text=Object.hasOwn(raw,key)?raw[key]:null;if(typeof text!=='string'||simple(text.trim())||!text.trim())continue;
   const value=values[key],previous=cache[key];let valid=previous?.text===text&&previous.value===value?previous.valid:false;
   if(!previous||previous.text!==text||previous.value!==value){try{valid=typeof value==='number'&&amount(text,key)===value;}catch{}cache[key]={text,value,valid};}
   if(valid)out[key]=text.trim();
  }
  if(!Object.keys(out).length)return null;expressionCache.set(out,cache);return out;
 }
 function setExpression(record,property,key,value){
  const text=typeof value==='string'?value.trim():'';if(text&&!simple(text)){record[property]||={};record[property][key]=text;}else if(record[property]){delete record[property][key];if(!Object.keys(record[property]).length)delete record[property];}
 }
 function normalize(raw={}){
  if(!raw||typeof raw!=='object')raw={};
  const safe=(v,key)=>{try{return amount(v,key)}catch{return ''}},start=Object.fromEntries(keys.map(k=>[k,safe(raw.start?.[k],k)]));let remaining=100000;
  const rows=(Array.isArray(raw.rows)?raw.rows:[]).slice(0,MAX_ROWS).map(r=>{const notes=String(r?.notes||'').slice(0,Math.min(4000,remaining));remaining-=notes.length;return {...Object.fromEntries(['adventure','session','dm','date'].map(k=>[k,String(r?.[k]||'').slice(0,k==='session'?40:200)])),notes,gain:Object.fromEntries(keys.map(k=>[k,safe(r?.gain?.[k],k)]))};});
  for(let i=0;i<rows.length;i++){const saved=expressions(raw.rows[i]?.expressions,rows[i].gain);if(saved)rows[i].expressions=saved;}const startExpressions=expressions(raw.startExpressions,start);
  return {...(startExpressions?{startExpressions}:{}),faction:String(raw.faction||'').slice(0,160),playerId:String(raw.playerId||'').slice(0,100),start,rows};
 }
 function project(raw={}){
  const log=normalize(raw),balance=Object.fromEntries(keys.map(k=>[k,Math.round((log.start[k]||0)*100)]));
  return Array.from({length:MAX_ROWS},(_,i)=>{const row=log.rows[i]||normalize({rows:[{}]}).rows[0],start={},total={};for(const k of keys){start[k]=balance[k]/100;balance[k]+=Math.round((row.gain[k]||0)*100);total[k]=balance[k]/100;}return {...row,start,total};});
 }
 function edit(raw,index,key,value,part){
  if(!Number.isInteger(index)||index<0||index>=MAX_ROWS)throw Error('This adventure log has reached its 120-entry limit.');
  const log=normalize(raw);
  if(part==='header'){if(!['faction','playerId'].includes(key))throw Error('Unknown log header.');if(String(value).length>(key==='faction'?160:100))throw Error('This text is too long.');log[key]=String(value);return log;}
  if(part==='start'){if(index!==0||!keys.includes(key))throw Error('Only the first entry has an editable starting balance.');log.start[key]=amount(value,key);setExpression(log,'startExpressions',key,value);return log;}
  while(log.rows.length<=index)log.rows.push(normalize({rows:[{}]}).rows[0]);const row=log.rows[index];
  if(part==='gain'){if(!keys.includes(key))throw Error('Unknown log balance.');row.gain[key]=amount(value,key);setExpression(row,'expressions',key,value);}
  else {if(!['adventure','session','dm','date','notes'].includes(key))throw Error('Unknown log field.');value=String(value);if(value.length>(key==='notes'?4000:key==='session'?40:200))throw Error('This text is too long.');row[key]=value;}
  if(log.rows.reduce((sum,entry)=>sum+entry.notes.length,0)>100000)throw Error('The adventure log has reached its remaining note space.');
  return log;
 }
 function operation(raw,index,command){
  if(!Number.isInteger(index)||index<0||index>=MAX_ROWS)throw Error('Choose an existing log entry.');
  const log=normalize(raw),rows=log.rows;
  if(!['earlier','later','insert','duplicate','clear','remove'].includes(command))throw Error('Unknown adventure log command.');
  if(command==='insert'){
   if(index>rows.length)throw Error('Add or select an entry before inserting here.');
  }else if(index>=rows.length)throw Error('This entry has not been recorded yet.');
  if(['insert','duplicate'].includes(command)&&rows.length>=MAX_ROWS)throw Error('The log has reached its 120-entry limit. Remove an entry before adding another.');
  if(command==='earlier'||command==='later'){
   const next=index+(command==='earlier'?-1:1);if(next<0||next>=MAX_ROWS)throw Error('This entry cannot move further.');if(next===rows.length)rows.push(normalize({rows:[{}]}).rows[0]);
   [rows[index],rows[next]]=[rows[next],rows[index]];index=next;
  }else if(command==='insert')rows.splice(index,0,normalize({rows:[{}]}).rows[0]);
  else if(command==='duplicate'){rows.splice(index+1,0,structuredClone(rows[index]));index++;}
  else if(command==='clear')rows[index]=normalize({rows:[{}]}).rows[0];
  else {rows.splice(index,1);index=Math.max(0,Math.min(index,rows.length-1));}
  if(rows.reduce((sum,row)=>sum+row.notes.length,0)>100000)throw Error('Duplicating this entry exceeds the adventure log’s note space.');
  return {log,index};
 }
 return {keys,MAX_ROWS,amount,normalize,project,edit,operation};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdventureLog;
