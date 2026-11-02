'use strict';
/* Original background category → checked suggestions menu, with editable custom text. */
var CharacterAdobeBackgroundChoiceUI=(()=>{
 let currentClose=null;
 const categories=[['personality','Personality Trait','Personality Trait'],['ideals','Ideal','Ideal'],['bonds','Bond','Bond'],['flaws','Flaw','Flaw']];
 function open(anchor,initial=null){
  const session=sheetSession;if(!characterHPCurrent(session)||session.saving||!anchor?.isConnected||!CharacterAdobeView.validate())return;currentClose?.();
  const background=session.data.build.background,profile=CharacterStory.get(background),name=CharacterBackgrounds.get(background)?.name||'Custom background';let snapshot=JSON.stringify(session.data);
  const allowed=()=>characterHPCurrent(session)&&!session.saving&&session.data.build.background===background&&JSON.stringify(session.data)===snapshot;
  function apply(message){session.dirty=true;fillSheetForm();updateSheetCalculations();snapshot=JSON.stringify(session.data);sheetStatus(message+' Save sheet to keep changes.');}
  const items=categories.map(([key,label,field])=>({id:key,label,heading:label,attributes:{'data-background-category':key},menuAttributes:{'data-background-options':''},items:()=>[
   ...(profile[key]||[]).map((row,index)=>{const text=typeof row==='string'?row:row.text;return{id:key+':'+index,label:text,detail:row.alignment?'Alignment tendency: '+row.alignment:undefined,attributes:{'data-background-suggestion':''},checked:()=>CharacterStorySelections.selected(session.data[key],text),select:()=>{if(!allowed())return false;session.data[key]=CharacterStorySelections.toggle(session.data[key],text);apply(label+' updated. Its text stays editable.');return true;}};}),
   {separator:true},{id:key+':custom',label:'Custom — write my own',attributes:{'data-background-custom':''},closeBefore:true,select:()=>{if(allowed())CharacterAdobeView.focusField(field);}}
  ]}));
  items.push({separator:true},{id:'reset',label:'Reset the four fields',attributes:{'data-background-reset':''},select:async()=>{if(!allowed())return false;const populated=categories.filter(([key])=>session.data[key]);if(populated.length&&!await SiteConfirmation.ask({title:'Reset the four background fields?',paragraphs:['Clears Personality Trait, Ideal, Bond and Flaw, including custom writing. Your background and other character data stay saved as they are.'],confirmLabel:'Reset four fields',isCurrent:allowed}))return true;if(!allowed())return false;for(const [key]of categories)session.data[key]='';apply('The four background fields were reset.');return false;}});
  const menu=CharacterAdobeFlyoutMenu.open(anchor,{id:'adobeBackgroundChoiceDialog',title:name+' background features',items,isCurrent:allowed,initialPath:categories.some(([key])=>key===initial)?[initial]:[],onStale:()=>{if(characterHPCurrent(session))sheetStatus('The character or background changed. Open its suggestions again.',true);},onClose:()=>{if(currentClose===menu?.close)currentClose=null;}});currentClose=menu?.close||null;
 }
 return{open,destroy:()=>currentClose?.()};
})();
