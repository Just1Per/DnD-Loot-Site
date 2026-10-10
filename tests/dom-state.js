let fixtureItems=[],fixtureInventory=[],fixtureSupply={};
markCatalogChanged=async()=>{};loadDashboardCharacters=async()=>{};observePendingImages=()=>{};
itemImageMarkup=()=>'<div class="test-art"></div>';
loadCampaignItems=async()=>{items=structuredClone(fixtureItems).filter(i=>canManageCampaign()||i.visible).map(i=>({...i,campaign:activeCampaign.name}));};
loadCampaignInventory=async()=>{inventory=structuredClone(fixtureInventory).filter(e=>canManageCampaign()||e.userId===auth.currentUser?.uid);};
loadCampaignSupply=async()=>{campaignSupply=canManageCampaign()?structuredClone(fixtureSupply):{};};
loadSaves=async()=>{};
function seed(role='dm',membership=role){
 closeCharacterSheet(true);
 closeCharacterLoot();closeVaultAction();closeRootPicker();closeItemModal();
 currentUser={id:role,uid:role,name:'Test '+role,role:[role]};auth.currentUser={uid:role,email:role+'@example.test'};
 activeCampaign={id:'a',name:'Storm Coast',ownerId:'dm',dmId:'dm',inventoryVersion:2};activeMembershipRole=membership;
 campaigns=[activeCampaign];campaignMembers=[{uid:'dm',role:'dm',displayName:'DM'},{uid:'player',role:'player',displayName:'Alice'},{uid:'other',role:'player',displayName:'Bob'}];
 characters=[{id:'c1',userId:'player',name:'Thorin',class:'Fighter',level:7},{id:'c2',userId:'other',name:'Elara',class:'Wizard',level:4}];
 const potion={id:'potion',name:'Healing Potion',description:'Full potion description',category:'Potion',rarity:'Common',properties:[{title:'Healing',text:'Restore health'}],classes:[],imageUrl:'',campaignId:'a',visible:true,lootMode:'player',available:true};
 fixtureItems=[potion,{...potion,id:'hidden',name:'Secret Item',visible:false},{...potion,id:'dm-only',name:'DM Award',lootMode:'dm'}];
 fixtureInventory=[{id:'e1',itemId:'potion',characterId:'c1',userId:'player',quantity:2,item:potion},{id:'e2',itemId:'potion',characterId:'c2',userId:'other',quantity:3,item:potion}];
 fixtureSupply={potion:{capacity:5,claimed:0,unlimited:false,revision:8},hidden:{capacity:1,claimed:0,unlimited:false,revision:1},'dm-only':{capacity:1,claimed:0,unlimited:false,revision:1}};
 rootItems=[{...potion,id:'root-potion',name:'Root Healing Potion'}];
 items=structuredClone(fixtureItems).filter(i=>canManageCampaign()||i.visible);inventory=structuredClone(fixtureInventory).filter(e=>canManageCampaign()||e.userId===role);campaignSupply=canManageCampaign()?structuredClone(fixtureSupply):{};
 selectedCharacter=myCharacters()[0]||null;saves=[];users=role==='admin'?[{id:'player',name:'Alice',role:['player']}]:[];
 magicItemLibraryLoaded=true;magicItemLibraryLoading=false;itemsLoadPromise=Promise.resolve();document.getElementById('search').value='';document.getElementById('ownerFilter').value='';
 showMainApp();renderCards();renderPlayerTab();if(canManageCampaign())showTab('dm');
}

// Build-granted feats are edited through their visible catalogue control.
function chooseBuildFeat(key,value){const control=document.querySelector('[data-build-feat-field="'+key+'"]');if(!control)throw Error('Missing feat choice '+key);control.value=value;control.onchange();}
function chooseOriginTraining(index,value){const control=document.querySelector('[data-feat-key="origin-human"] [data-feat-choice="training'+index+'"]');if(!control)throw Error('Missing Human feat training '+index);control.value=value;control.onchange();}
