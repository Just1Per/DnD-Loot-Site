'use strict';
(()=>{
 const W=CampaignWorkspace;
 W.configs.chapter={title:'Chapter Tracker',tab:'dm-chapters',noun:'chapter',categories:[],fields:[['order','Chapter order','number',null,9999],['status','Story progress','select',['Planned','Current','Completed']],['startingLevel','Expected starting level','number'],['targetLevel','Milestone target level (0 = no level-up)','number'],['objectives','Objectives','textarea'],['scenes','Scenes','textarea'],['rewards','Planned rewards','textarea'],['sessionNotes','Session notes and recap','textarea']],content:'Chapter introduction',secret:'Private chapter preparation',help:'Link the same locations and creatures to several chapters. Completing a chapter records story progress; milestone approvals are separate from choosing class levels.',normalize:data=>{
   const result=structuredClone(data||{});result.status=['Planned','Current','Completed'].includes(result.status)?result.status:'Planned';
   for(const [key,fallback,max]of [['order',1,9999],['startingLevel',1,20],['targetLevel',0,20]]){const n=result[key]==null?fallback:Number(result[key]);if(!Number.isInteger(n)||n<0||n>max)throw Error(`${key} must be a whole number from 0 to ${max}.`);result[key]=n;}return result;
 },extra:(host,s)=>{
   const target=Number(W.draft()?.data.targetLevel)||0;
   host.innerHTML=`<section class="workspace-card"><h3>Milestone approvals</h3><p>Confirm who earned the target level, then open their sheet to choose class levels, HP and features. Approval does not silently change their level.</p>${characters.filter(character=>character.active!==false).map(character=>{const approval=(s.record.data.milestones||[]).find(row=>row.characterId===character.id);return `<p>${escapeHtml(character.name)} · level ${Number(character.level)||1}${approval?' · Approved level '+Number(approval.targetLevel):''} <button type="button" data-approve-milestone="${escapeHtml(character.id)}" ${!target||Number(character.level)>=target?'disabled':''}>Approve milestone</button> <button type="button" data-milestone-sheet="${escapeHtml(character.id)}">Open sheet</button></p>`;}).join('')}</section>`;
   host.querySelectorAll('[data-approve-milestone]').forEach(button=>button.onclick=async()=>{
     const input=W.draft(),level=Number(input?.data.targetLevel),character=characters.find(row=>row.id===button.dataset.approveMilestone);
     if(!character||!level||level<=Number(character.level)){W.status('Choose a target above the character’s current level.',true);return;}
     if(!confirm(`Approve ${character.name} to advance to level ${level}? Their class choices remain in their sheet.`))return;
     s.record.data.milestones||=[];s.record.data.milestones=s.record.data.milestones.filter(row=>row.characterId!==character.id);s.record.data.milestones.push({characterId:character.id,fromLevel:Number(character.level)||1,targetLevel:level,approvedBy:auth.currentUser.uid,approvedAt:Date.now()});s.dirty=true;await W.save();if(!s.dirty)W.renderEditor();
   });
   host.querySelectorAll('[data-milestone-sheet]').forEach(button=>button.onclick=()=>openCharacterSheet(button.dataset.milestoneSheet));
 }};
 W.configs.chapter.onEdit=W.configs.chapter.extra;
})();
