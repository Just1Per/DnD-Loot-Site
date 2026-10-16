'use strict';
// Short, contextual decisions use a native accessible dialog, not a browser confirm.
var SiteConfirmation=(()=>{
 let pending=null;
 function cancel(){pending?.finish(false);}
 function ask({title,paragraphs,confirmLabel,isCurrent=()=>true}){
  cancel();if(!isCurrent())return Promise.resolve(false);
  const dialog=document.createElement('dialog'),opener=document.activeElement;
  dialog.id='siteConfirmationDialog';dialog.className='site-confirmation-dialog';
  dialog.setAttribute('aria-labelledby','siteConfirmationTitle');dialog.setAttribute('aria-describedby','siteConfirmationDescription');
  const heading=document.createElement('h2');heading.id='siteConfirmationTitle';heading.textContent=title;
  const description=document.createElement('div');description.id='siteConfirmationDescription';
  for(const message of paragraphs.filter(Boolean)){const p=document.createElement('p');p.textContent=message;description.append(p);}
  const actions=document.createElement('div');actions.className='site-confirmation-actions';
  const stay=document.createElement('button');stay.type='button';stay.dataset.siteCancel='';stay.textContent='Cancel';
  const accept=document.createElement('button');accept.type='button';accept.dataset.siteConfirm='';accept.className='btn-primary';accept.textContent=confirmLabel;
  actions.append(stay,accept);dialog.append(heading,description,actions);document.body.append(dialog);
  return new Promise(resolve=>{
   const state={finish(confirmed){if(pending!==state)return;pending=null;const allowed=confirmed&&isCurrent();if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus();resolve(allowed);}};
   pending=state;stay.onclick=()=>state.finish(false);accept.onclick=()=>state.finish(true);
   dialog.addEventListener('cancel',event=>{event.preventDefault();state.finish(false);});dialog.addEventListener('close',()=>state.finish(false));
   dialog.showModal();stay.focus();
  });
 }
 return{ask,cancel};
})();
