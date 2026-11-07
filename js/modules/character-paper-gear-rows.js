'use strict';
/* Original Gear line operations on an isolated field table.
   Not an ownership controller: callers must reconcile stable references before applying. */
var CharacterPaperGearRows=(()=>{
 const blank=()=>({name:'',quantity:'',weight:'',location:'',reference:''});
 const text=(value,max)=>typeof value==='string'?value.slice(0,max):'';
 const numeric=value=>value===''||value===null||value===undefined?'':typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1000000?value:typeof value==='string'&&/^\s*(?:\d+(?:[.,]\d*)?|[.,]\d+)\s*$/.test(value)&&Number(value.replace(',','.'))<=1000000?Number(value.replace(',','.')):'';
 function row(raw={}){return{name:text(raw?.name,200),quantity:numeric(raw?.quantity),weight:numeric(raw?.weight),location:text(raw?.location,200),reference:text(raw?.reference,220)};}
 function normalize(raw={}){
  const kind=raw?.kind==='extra'?'extra':'gear',count=kind==='gear'?54:36,footer=kind==='gear'&&raw?.footer===true;
  return{kind,footer,rows:Array.from({length:count},(_,i)=>footer&&i===50?blank():row(raw?.rows?.[i]))};
 }
 function bounds(state,index){
  if(!Number.isInteger(index)||index<0||index>=state.rows.length||state.footer&&index===50)throw Error('Choose an editable equipment row.');
  return state.footer?(index<50?[0,49]:[51,53]):[0,state.rows.length-1];
 }
 const columnEnd=(state,index)=>Math.min(bounds(state,index)[1],18*Math.ceil((index+1)/18)-1);
 function operation(raw,index,command){
  const state=normalize(raw),[start,end]=bounds(state,index);let selected=index;
  if(command==='up'||command==='down'){
   selected=index+(command==='up'?-1:1);if(!state.rows[index].name)throw Error('Choose a populated equipment row.');if(selected<start||selected>end)throw Error('This row is at the section boundary.');
   [state.rows[index],state.rows[selected]]=[state.rows[selected],state.rows[index]];
  }else if(command==='insert'){
   if(!state.rows[index].name)throw Error('This row is already empty.');let empty=-1;for(let i=index+1;i<=end;i++)if(!state.rows[i].name){empty=i;break;}
   if(empty<0)throw Error('There is no empty row below this item. Nothing was removed.');
   for(let i=empty;i>index;i--)state.rows[i]=state.rows[i-1];state.rows[index]=blank();
  }else if(command==='clear')state.rows[index]=blank();
  else if(command==='delete'){
   const last=columnEnd(state,index);for(let i=index;i<last;i++)state.rows[i]=state.rows[i+1];state.rows[last]=blank();
  }else throw Error('Choose an available equipment row command.');
  return{state,index:selected};
 }
 function edit(raw,index,field,value){
  const state=normalize(raw);bounds(state,index);
  if(field==='name'||field==='location'){
   if(typeof value!=='string'||value.length>200)throw Error('Use text up to 200 characters.');state.rows[index][field]=value;
  }else if(field==='quantity'||field==='weight'){
   const number=numeric(value);if(number===''&&value!==''&&value!==null&&value!==undefined)throw Error('Use a number from 0 to 1000000, or leave the field blank.');state.rows[index][field]=number;
  }else throw Error('Choose an equipment name, quantity, weight or location.');return state;
 }
 function moveColumn(raw,index,column){
  const state=normalize(raw);bounds(state,index);if(!state.rows[index].name)throw Error('Choose a populated equipment row.');
  const columns=state.kind==='gear'?3:2;if(!Number.isInteger(column)||column<0||column>=columns)throw Error('Choose an available equipment column.');
  if(Math.floor(index/18)===column)throw Error('This item is already in that column.');
  const start=18*column,end=Math.min(start+17,state.footer?49:state.rows.length-1);let target=-1;
  for(let i=start;i<=end;i++)if(!state.rows[i].name){target=i;break;}
  if(target<0)throw Error('The destination column is full. Nothing was moved.');
  const source={...state.rows[index]},removed=operation(state,index,'delete').state;removed.rows[target]=source;return{state:removed,index:target};
 }
 return{normalize,bounds,operation,edit,moveColumn};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperGearRows;
