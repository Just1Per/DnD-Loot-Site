'use strict';
var AccountNotifications=(()=>{
 const sdk=window.__DND_VAULT_DEPS__;
 let uid=null,busy=false,filter='all',message='',dialog=null,button=null,list=null,announced=-1,heldFocus=null;
 const feed=createAccountNotificationFeed(sdk,{changed:paint});
 const same=actor=>!!actor&&uid===actor&&auth.currentUser?.uid===actor;
 const element=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 function close(){heldFocus=null;if(dialog?.open)dialog.close();}
 function open(){if(!uid||!same(uid))return;paint();if(!dialog.open){const bottom=button.getBoundingClientRect().bottom;dialog.style.setProperty('--notification-top',Math.min(bottom+8,innerHeight/2)+'px');dialog.showModal();}paint();button.setAttribute('aria-expanded','true');dialog.querySelector('[data-notification-close]').focus();}
 function title(row){return row.kind==='dm-notes'?'DM notes updated':row.kind==='loot'?'Loot assigned':row.kind==='invitation'?'Campaign invitation':row.kind==='approval-request'?'DM application from '+row.applicantName:'DM application '+row.status;}
 function detail(row){if(row.kind==='dm-notes')return 'Open your character sheet to read the notes.';if(row.kind==='loot')return row.quantity+' item'+(row.quantity===1?'':'s')+' assigned. Open your inventory to see your equipment.';if(row.kind==='invitation')return 'Open your dashboard to accept or decline.';if(row.kind==='approval-request')return 'Review this application in Admin.';return 'Open your dashboard to see the decision.';}
 function init(){
  if(button)return;
  button=document.getElementById('accountNotificationsButton');dialog=document.getElementById('accountNotificationsPanel');list=dialog?.querySelector('[data-notification-list]');if(!button||!dialog)return;
  button.onclick=()=>dialog.open?close():open();
  dialog.querySelector('[data-notification-close]').onclick=close;
  dialog.addEventListener('close',()=>{if(dialog.open)return;button.setAttribute('aria-expanded','false');const target=document.activeElement;if(!button.hidden&&!document.querySelector('dialog[open]')&&(!target||target===document.body||target===button||dialog.contains(target)))button.focus();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}if(event.key!=='Tab')return;const controls=[...dialog.querySelectorAll('button:not([disabled])')].filter(n=>n.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}});
  dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))close();});
  dialog.querySelectorAll('[data-notification-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.notificationFilter;paint();list.scrollTop=0;});
  dialog.querySelector('[data-notification-refresh]').onclick=async()=>{const actor=uid;if(!same(actor)||busy)return;await start(auth.currentUser);if(same(actor))open();};
  dialog.querySelector('[data-notification-read-all]').onclick=()=>change(feed.all().filter(r=>!r.dismissed).map(r=>r.key));
  dialog.querySelector('[data-notification-clear-read]').onclick=()=>change(feed.all().filter(r=>r.read&&!r.dismissed).map(r=>r.key),true);
 }
 function paint(){
  if(!button||!dialog)return;
  const active=same(uid);button.hidden=!active;if(!active){close();list.replaceChildren();return;}
  const all=feed.all().filter(r=>!r.dismissed),unread=all.filter(r=>!r.read).length,badge=button.querySelector('[data-notification-count]');badge.hidden=!unread||!feed.available;badge.textContent=unread>99?'99+':String(unread);button.setAttribute('aria-label',feed.available?'Notifications, '+(unread?unread+' unread':'no unread notifications'):'Notifications');
  if(unread!==announced&&!feed.loading){document.getElementById('accountNotificationsAnnouncement').textContent=unread?unread+' unread notifications.':'';announced=unread;}
  if(!dialog.open)return;
  const previous=document.activeElement,focusKey=previous?.dataset.notificationKey||heldFocus?.key,focusAction=previous?.dataset.notificationAction||heldFocus?.action,scroll=list.scrollTop;
  dialog.querySelector('[data-notification-status]').textContent=message||(feed.errors.length?'Some notifications or read states could not load. Choose Refresh.':feed.loading?'Loading notifications…':'');
  dialog.querySelectorAll('[data-notification-filter]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.notificationFilter===filter));b.disabled=busy||b.dataset.notificationFilter==='unread'&&!feed.available;});
  const disabled=busy||!feed.available;
  dialog.querySelector('[data-notification-read-all]').disabled=disabled||!unread;
  dialog.querySelector('[data-notification-clear-read]').disabled=disabled||!all.some(r=>r.read);
  dialog.querySelector('[data-notification-refresh]').disabled=busy;
  const visible=all.filter(r=>filter!=='unread'||!r.read).slice(0,100);list.replaceChildren();
  for(const row of visible){
   const li=element('li',undefined,'account-notification'+(feed.available&&!row.read?' account-notification-unread':'')),openButton=element('button',undefined,'account-notification-open');openButton.type='button';openButton.dataset.notificationKey=row.key;openButton.dataset.notificationAction='open';openButton.disabled=busy;
   openButton.append(element('strong',title(row)),element('span',detail(row)),element('small',[row.campaignName,row.characterName,row.adventureName].filter(Boolean).join(' · ')));
   const time=element('time',new Date(row.createdAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}));time.dateTime=new Date(row.createdAt).toISOString();openButton.append(time);openButton.onclick=()=>activate(row.key);li.append(openButton);
   const actions=element('div',undefined,'account-notification-actions');
   for(const [action,label] of [['read','Mark read'],['dismiss','Dismiss']]){if(action==='read'&&row.read)continue;const b=element('button',label);b.type='button';b.dataset.notificationKey=row.key;b.dataset.notificationAction=action;b.disabled=disabled;b.setAttribute('aria-label',label+': '+title(row));b.onclick=()=>change([row.key],action==='dismiss');actions.append(b);}li.append(actions);list.append(li);
  }
  if(!visible.length)list.append(element('li',feed.loading?'Loading notifications…':feed.errors.length?'Notifications are unavailable. Use Refresh to try again.':filter==='unread'?'You are all caught up.':'No notifications yet.','account-notification-empty'));
  dialog.querySelector('[data-notification-limit]').textContent=all.length>100?'Showing the 100 most recent notifications.':'';list.scrollTop=scroll;
  if(focusKey&&busy)heldFocus={key:focusKey,action:focusAction};
  if(focusKey&&!busy){heldFocus=null;const target=[...list.querySelectorAll('button')].find(b=>b.dataset.notificationKey===focusKey&&b.dataset.notificationAction===focusAction);(target||[...list.querySelectorAll('button')].find(b=>b.dataset.notificationKey===focusKey)||list.querySelector('button')||dialog.querySelector('[data-notification-close]')).focus({preventScroll:true});}
 }
 async function change(keys,dismiss=false){const actor=uid;if(!same(actor)||busy||!keys.length)return;busy=true;message='';paint();try{await feed.mark(keys,{dismiss});}catch(error){if(same(actor))message='Could not save notification state. '+error.message;}finally{if(same(actor)){busy=false;paint();}}}
 async function activate(key,previous=null){
  const actor=uid;if(!same(actor)||busy)return;const rows=feed.all();
  const row=rows.find(r=>r.key===key&&!r.dismissed)||(previous?.kind==='dm-notes'?rows.find(r=>r.groupKey===previous.groupKey&&r.kind==='dm-notes'&&!r.dismissed):null);
  if(!row){message='This notification is no longer available. Refresh to see current activity.';open();return;}
  const resume=()=>{if(same(actor))void activate(row.key,{kind:row.kind,groupKey:row.groupKey});};
  close();if(!PageEditors.guard(resume)||!SheetNavigation.guard(resume))return;
  // Existing campaign editors retain their own discard confirmation and busy checks.
  if(!CampaignHome.clear()||!CampaignWorkspace.clear()||!CampaignInformation.clear())return;
  const capture=()=>({campaign:activeCampaign?.id,sheet:sheetSession,revision:sheetSession?.revision,route:AppShell.route});
  let origin=capture(),edited=false,opened=false,marking=false;
  const editing=()=>{edited=true;};document.addEventListener('input',editing,true);
  const checkOrigin=()=>{if(!same(actor)||edited||origin.campaign!==activeCampaign?.id||origin.sheet!==sheetSession||origin.revision!==sheetSession?.revision||origin.route!==AppShell.route||sheetSession?.dirty||sheetSession?.saving||document.querySelector('dialog[open]'))throw Object.assign(Error('Your view changed while this notification was loading. Open the notification again when ready.'),{code:'notification/context-changed'});};
  const moved=()=>{origin=capture();edited=false;};
  busy=true;message='';
  try{
   if(row.kind==='invitation'||row.kind==='approval'){
    if(row.kind==='invitation'){const snap=await sdk.getDoc(sdk.doc(sdk.db,'campaignInvites',row.inviteId));if(!same(actor))return;if(!snap.exists()||snap.data().status!=='pending')throw Error('This invitation is no longer pending. Refresh notifications.');await loadMyPendingInvites();}
    else await Promise.all([loadMyDMRequest(),loadCurrentUser(auth.currentUser,{isCurrent:()=>same(actor)})]);
    if(!same(actor))return;checkOrigin();
    if(activeCampaign)await leaveCampaign();else showCampaignSelector();opened=!activeCampaign;
    if(opened){renderCampaignSelector();(document.getElementById(row.kind==='invitation'?'dashboardInvites':'dmApplicationPanel')||document.getElementById('campaignSelectorScreen'))?.scrollIntoView({block:'nearest'});}
   }else if(row.kind==='approval-request'){
    const current=await sdk.getDoc(sdk.doc(sdk.db,'dmRequests',row.applicantUid));if(!same(actor))return;checkOrigin();if(!current.exists()||current.data().status!=='pending')throw Error('This application has changed. Refresh notifications.');
    openAdminView();await AdminAccounts.load();if(!same(actor))return;opened=document.getElementById('tab-admin').style.display!=='none';if(opened)document.getElementById('adminDMRequestsSection')?.scrollIntoView({block:'nearest'});
   }else{
    const base=['campaigns',row.campaignId,...(row.adventureId?['oneShots',row.adventureId]:[])],character=await sdk.getDoc(sdk.doc(sdk.db,...base,'characters',row.characterId));
    if(!same(actor))return;checkOrigin();if(!character.exists()||character.data().userId!==actor||character.data().active===false)throw Error('This character is no longer available to your account.');
    if(activeCampaign?.id!==row.campaignId){const campaign=await sdk.getDoc(sdk.doc(sdk.db,'campaigns',row.campaignId));if(!same(actor))return;checkOrigin();if(!campaign.exists()||!await enterCampaign({...campaign.data(),id:row.campaignId}))return;moved();}
    if(!same(actor)||activeCampaign?.id!==row.campaignId)return;
    checkOrigin();closeCharacterSheet(true);moved();
    if(row.adventureId){const shot=await sdk.getDoc(sdk.doc(sdk.db,'campaigns',row.campaignId,'oneShots',row.adventureId));if(!same(actor))return;checkOrigin();if(!shot.exists()||!shot.data().data?.approved)throw Error('This adventure is no longer available.');await openCharacterSheet(row.characterId,{adventureId:row.adventureId,character:{...character.data(),id:row.characterId},oneShot:{...shot.data(),id:row.adventureId}});}
    else{await Promise.all([loadCharacters(),loadCampaignInventory()]);if(!same(actor))return;checkOrigin();await CharacterWorkspace.open(row.characterId,row.kind==='loot'?'inventory':'sheet');}
    if(!same(actor))return;opened=sheetSession?.characterId===row.characterId&&sheetSession.campaignId===row.campaignId&&(sheetSession.adventureId||null)===(row.adventureId||null);
    if(opened&&row.kind==='dm-notes'){const target=sheetSession;await CharacterAdobeView.ready();if(!same(actor)||sheetSession!==target)return;if(edited||target.dirty||target.saving)throw Object.assign(Error('Your view changed while this notification was loading. Open the notification again when ready.'),{code:'notification/context-changed'});if(!CharacterDMNotesUI.focus())throw Error('DM notes could not open. Refresh the sheet and try again.');}
   }
   if(opened&&same(actor)&&feed.available){marking=true;await feed.mark([row.key]);}
  }catch(error){if(same(actor)){message=(marking?'Opened the notification, but could not save its read state. ':'Could not open this notification. ')+error.message;if(error.code!=='notification/context-changed'&&!edited)open();}}
  finally{document.removeEventListener('input',editing,true);if(same(actor)){busy=false;paint();}}
 }
 async function start(user){stop();init();if(!user?.uid||auth.currentUser?.uid!==user.uid)return;uid=user.uid;message='';paint();if(typeof sdk.onSnapshot!=='function'){message='Notifications are unavailable. Try Refresh.';return;}await feed.start({uid,email:user.email||''});if(same(user.uid))paint();}
 function stop(){uid=null;busy=false;filter='all';message='';announced=-1;feed.stop();if(button){button.hidden=true;close();list.replaceChildren();document.getElementById('accountNotificationsAnnouncement').textContent='';}}
 return{init,start,stop,open,close,get enabled(){return feed.available;},get feed(){return feed;}};
})();
