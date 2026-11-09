'use strict';
/* Whole-line selections keep background suggestions and editable custom text together. */
var CharacterStorySelections=(()=>{
 const value=text=>String(text??'').replace(/\r\n/g,'\n');
 function selected(text,option){const target=value(option).trim();return !!target&&value(text).split('\n').some(line=>line.trim()===target);}
 function toggle(text,option){const previous=value(text),target=value(option).trim();if(!target||target.includes('\n'))throw Error('Choose a single background suggestion.');const next=selected(previous,target)?previous.split('\n').filter(line=>line.trim()!==target).join('\n'):previous+(previous&&!previous.endsWith('\n')?'\n':'')+target;if(next.length>12000)throw Error('This text box is full. Shorten its text before adding another suggestion.');return next;}
 return{selected,toggle};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterStorySelections;
