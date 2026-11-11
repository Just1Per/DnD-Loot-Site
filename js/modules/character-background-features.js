'use strict';
/* Original concise display summaries; grants remain owned by the background/feat rules. */
var CharacterBackgroundFeatures=(()=>{
 const B=typeof CharacterBackgrounds!=='undefined'?CharacterBackgrounds:require('./character-backgrounds');
 const bgKey=data=>/^[a-z0-9][a-z0-9_-]{0,79}$/.test(data.build?.background||'')&&!['constructor','prototype'].includes(data.build.background)?data.build.background:'custom';
 const text=(value,max)=>typeof value==='string'?value.slice(0,max):'';
 function normalize(raw){return Object.fromEntries(Object.entries(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}).filter(([key,v])=>/^[a-z0-9][a-z0-9_-]{0,79}$/.test(key)&&!['constructor','prototype'].includes(key)&&v&&typeof v==='object'&&!Array.isArray(v)).slice(0,64).map(([key,v])=>[key,{selection:v.selection==='custom'?'custom':typeof v.selection==='string'&&v.selection.startsWith('feature:')?v.selection.slice(0,168):'auto',name:text(v.name,160),description:text(v.description,6000),edited:v.edited===true}]));}
 const records=()=>Object.values({...B.legacy,...B.modern,...B.expanded});
 const featureName=bg=>typeof bg?.feature==='string'?bg.feature:bg?.feature?.name||bg?.featureName||'';
 const reference=bg=>bg?[B.sourceName(bg),bg.page?'p. '+bg.page:''].filter(Boolean).join(', '):'';
 const summaries=Object.freeze({
  "Shelter of the Faithful": "Your faith can provide modest lodging, food and care through friendly temples. Your DM determines what aid is available.",
  "False Identity": "Use a second identity supported by documents, contacts and disguises; you also know how to imitate documents and handwriting.",
  "Criminal Contact": "A trusted criminal contact helps you exchange messages through the local underworld.",
  "Spy Contact": "Use a trusted covert contact to exchange messages and information discreetly.",
  "By Popular Demand": "Perform for an audience to arrange modest food and lodging; successful performances can build local recognition.",
  "Rustic Hospitality": "Common folk may offer shelter and help hiding you, unless doing so puts them in immediate danger.",
  "Guild Membership": "Your guild can provide professional contacts, support and modest lodging; membership brings dues and obligations.",
  "Discovery": "Work with your DM to define an important discovery from your seclusion and how it matters to the campaign.",
  "Position of Privilege": "Your status helps you enter high society and seek audiences with local nobility; it does not guarantee agreement.",
  "Wanderer": "Remember geography and travel routes well, and find food and water for a small group when the environment supplies them.",
  "Researcher": "When you do not know a piece of lore, you can often identify a person or place where it might be found. Obtaining it can still take time or an adventure.",
  "Ship’s Passage": "Arrange passage for your group through sailing contacts; expect to help aboard, and let your DM determine routes and availability.",
  "Military Rank": "Use your former rank to seek recognition, access or equipment from forces loyal to your old organization.",
  "City Secrets": "Use familiar city routes and hidden passages to help your group travel through a city more quickly outside combat.",
  "Retainers": "Three noncombatant attendants help with ordinary tasks. They do not fight for you or accept obviously dangerous work.",
  "Bad Reputation": "Your fearsome reputation can discourage ordinary people from reporting minor misconduct; serious crimes still have consequences.",
  "Watcher’s Eye": "Recognize the local organization of law enforcement and criminal activity, and locate places where each group gathers.",
  "Respect of the Stout Folk": "Dwarven communities recognize your craft training and may offer hospitality or professional support.",
  "Library Access": "Your scholarly connections help you gain access to libraries and fellow researchers.",
  "Court Functionary": "Navigate government and court procedures, identify officials and locate information in bureaucracies.",
  "Safe Haven": "Find support and discreet shelter among members or allies of your faction, subject to local circumstances.",
  "All Eyes on You": "Your unfamiliar customs attract curiosity and can open conversations with scholars, nobles and other interested people.",
  "Inheritance": "Work with your DM to define your inherited possession and the information or adventure opportunities attached to it.",
  "Knightly Regard": "Members and supporters of your order may provide hospitality and assistance within their means.",
  "Mercenary Life": "Recognize mercenary organizations and find places to seek military work, news and other mercenaries.",
  "Ear to the Ground": "Use contacts in settlements to find information about local people, trouble and criminal activity.",
  "Uthgardt Heritage": "Use your tribal knowledge and connections to navigate familiar wilderness and seek hospitality from compatible communities.",
  "Kept in Style": "Family connections can help you obtain credit and maintain appearances in Waterdeep; your family may expect repayment or favors.",
  "Adept Linguist": "Through sustained observation and interaction, learn the basics needed to communicate with a community whose language you do not speak.",
  "Historical Knowledge": "Recognize clues about ruins and their builders, and assess the approximate age or origin of historical objects.",
  "Harvest the Water": "Find food by fishing when suitable water and time are available; agree the catch and local conditions with your DM.",
  "Steady": "Travel for up to 16 hours before forced-march checks apply, and find a safe route to land a boat when one exists.",
  "I’ll Patch It!": "Use tools and available materials to repair damage to a vessel during a rest; track the repair with your DM.",
  "Down Low": "Use smuggling contacts to seek discreet shelter and help moving unnoticed through a port or settlement.",
  "Dual Personalities": "Maintain a separate public identity and a faceless persona; people do not automatically connect the two.",
  "Heart of Darkness": "Ordinary people recognize that you have faced terrible things and may offer practical help against danger.",
  "Official Inquiry": "Use your investigative reputation to seek records, witnesses and access through local authorities.",
  "Feywild Connection": "Friendly Fey recognize your familiarity with their customs and may help you when lost or in need in the Feywild.",
  "Carnival Fixture": "The Witchlight Carnival provides modest food and lodging and free access to attractions while you avoid disrupting its work.",
  "Divine Contact": "Gain the 2014 Magic Initiate feat for Cleric. Work with your DM to define a secret learned from the deity you encountered.",
  "Wildspace Adaptation": "Your time in Wildspace grants Tough and helps you handle weightlessness; record the feat and situational benefits separately.",
  "Echoes of Victory": "Your athletic reputation can bring recognition, hospitality and contact with admirers of your achievements.",
  "Strike of the Giants": "This background grants the Strike of the Giants feat. Configure its giant type and uses through the feat controls.",
  "Rune Shaper": "This background grants the Rune Shaper feat. Record its rune and spell choices through the feat controls.",
  "Planar Infusion": "This background grants Scion of the Outer Planes. Record its planar choice separately; your home community also provides modest food and lodging.",
  "Conviction": "Your planar philosophy grants Scion of the Outer Planes and faction connections. Record the feat choices separately.",
  "Fortune’s Favor": "Choose the background’s granted feat from Lucky, Magic Initiate or Skilled; record its choices through the feat controls.",
  "Still Standing": "Choose the background’s granted feat from Alert, Skilled or Tough; record its choices through the feat controls.",
  "Name Dropping": "Your famous family name can help secure introductions and hospitality, but brings expectations and unwanted attention.",
  "Supply Chain": "Former business contacts can help locate goods, information and professional introductions.",
  "Never Tell Me the Odds": "Read situations and assess risks through gambling experience; agree what information is available with your DM.",
  "Legalese": "Your experience with legal disputes helps you navigate laws, officials and procedural loopholes.",
  "Inside Informant": "Use contacts from your former internship to seek information about that organization and its operations.",
  "Legal Authority": "Your Azorius credentials support official inquiries and legal duties within your actual jurisdiction.",
  "Legion Station": "Boros stations can offer lodging, supplies or assistance appropriate to your standing and their available resources.",
  "Undercity Paths": "Know routes through the undercity and locate passage or shelter through Golgari connections.",
  "Rubblebelt Refuge": "Use your Gruul connections to find refuge in the rubblebelt, subject to clan relations.",
  "Urban Infrastructure": "Your engineering knowledge helps you navigate Ravnica’s infrastructure and locate relevant plans and facilities.",
  "Leverage": "Use Orzhov connections and obligations to request services; favors can create debts of your own.",
  "Fearsome Reputation": "Your Rakdos reputation can intimidate ordinary onlookers and discourage interference, subject to the situation.",
  "Conclave’s Shelter": "Selesnya communities can provide shelter and practical support within the conclave’s means.",
  "Squire of Solamnia": "Gain the Squire of Solamnia feat. Record its mounted-combat benefits and limited attack support through the feat controls.",
  "Initiate of High Sorcery": "Gain the Initiate of High Sorcery feat. Choose a lunar tradition and record its cantrip and spell choices through the feat controls.",
  "House Connections": "Your dragonmarked house connections can help secure introductions and professional assistance; obligations and local standing still matter."
});
 const featSummaries={
  Alert:'Add Proficiency Bonus to initiative; you can exchange initiative with a willing ally when the feat allows it.',
  Crafter:'Gain three artisan tool proficiencies, a discount on nonmagical purchases and temporary crafted gear after a Long Rest.',
  Skilled:'Gain proficiency in any combination of three skills or tools. Choose them in the feat controls.',
  Musician:'Gain three instrument proficiencies and use music after a rest to give eligible allies Heroic Inspiration.',
  Tough:'Your hit point maximum increases by twice your character level, including later levels.',
  Healer:'Use a Healer’s Kit with a Utilize action to let a creature spend a Hit Die to heal, adding your Proficiency Bonus; qualifying healing rolls can reroll a 1.',
  Lucky:'Use Luck Points to gain advantage on your D20 Test or impose disadvantage on an attack against you. Track the shared feat pool.',
  'Tavern Brawler':'Your unarmed strikes use a d4 damage die, can reroll a damage die showing 1, and can push a target once per turn when eligible. You also gain improvised-weapon proficiency.',
  'Savage Attacker':'Once per turn when a weapon attack hits, roll its damage dice twice and choose which result to use.'
 };
 function automatic(bg,data){
  if(!bg)return{name:'',description:''};
  if(bg.edition!=='2024'){
   const name=featureName(bg),description=typeof bg.feature==='object'?bg.feature?.description:bg.featureDescription;
   const college=/^(Lorehold|Prismari|Quandrix|Silverquill|Witherbloom) Initiate$/.test(name);
   return{name,description:description||summaries[name]||(college?'Gain Strixhaven Initiate for your college. Configure its cantrips and spell through the feat controls.':name?'Use '+name+' with your background’s contacts and circumstances; agree any situational benefit with your DM.':'')};
  }
  const choices=bg.featChoices||[],selected=choices.length?(choices.includes(data.build?.backgroundFeat)?data.build.backgroundFeat:''):bg.feat||'';
  const name=selected?'Background feat: '+selected:'Background feat choice';
  const magic=/^Magic Initiate \((Cleric|Druid|Wizard)\)$/.exec(selected);
  const detail=magic?'Learn two '+magic[1]+' cantrips and one level-1 spell. Choose Intelligence, Wisdom or Charisma for them. The spell has one free cast per Long Rest and can also use spell slots.':featSummaries[selected]||(selected?'Configure '+selected+' in Feats and choose its options; resolve conditional benefits with your DM.':choices.length?'Choose one: '+choices.join(', ')+'. Record your choice in the background feat controls.':'Choose and configure your background feat in Feats.');
  return{name,description:'2024 backgrounds grant a feat instead of a separate narrative background feature.\n'+(selected?selected+': ':'')+detail};
 }
 function project(data){
  const stored=data.adobe?.backgroundFeatures||data.rulesChoices?.grants?.__adobe?.data?.backgroundFeatures,key=bgKey(data),saved=normalize(stored)[key],bg=B.get(data.build?.background),selection=saved?.selection||'auto',auto=automatic(bg,data);
  const name=selection==='custom'?saved.name:selection.startsWith('feature:')?selection.slice(8):auto.name,origin=selection==='auto'?bg:records().find(row=>featureName(row)===name),ref=selection==='custom'?'':reference(origin);
  const description=saved?.edited?saved.description:selection==='auto'?auto.description:selection==='custom'?saved.description:automatic(origin,data).description||summaries[name]||'Record the situational benefits of '+name+' with your DM.';
  return{key,selection,name,description,edited:saved?.edited===true,reference:ref,background:bg};
 }
 function choices(data,names=[]){const current=project(data),rows=records().filter(row=>(row.edition||'2014')==='2014'&&featureName(row)&&(typeof CampaignRules==='undefined'||CampaignRules.allowed(row))),map=new Map(rows.map(row=>[featureName(row),row])),legacy=data.build?.edition!=='2024',options=[{value:'auto',label:automatic(current.background,data).name||'Automatic — current background',detail:reference(current.background)||'Follow the selected background'}];if(legacy&&(typeof CampaignRules==='undefined'||CampaignRules.allowed({edition:'2014'})))for(const name of [...new Set([...names,...map.keys()])].sort((a,b)=>a.localeCompare(b))){const row=map.get(name);options.push({value:'feature:'+name,label:name,detail:row?row.name+' · '+reference(row):'Adobe background feature reference'});}if(current.selection!=='auto'&&current.selection!=='custom'&&!options.some(row=>row.value===current.selection))options.push({value:current.selection,label:current.name+' (saved)',disabled:true});options.push({value:'custom',label:current.selection==='custom'&&current.name?current.name:'Custom / manual…',detail:'Custom / manual — write your own feature name and description'});return options;}
 function set(data,selection,{name='',description='',edited=false,names=[]}={}){if(project(data).selection!==selection&&!choices(data,names).some(row=>row.value===selection&&!row.disabled))throw Error('Choose an available background feature.');if(name.length>160||description.length>6000)throw Error('Use at most 160 characters for the name and 6,000 for its description.');data.adobe||={};const saved=normalize(data.adobe.backgroundFeatures);if(!Object.hasOwn(saved,bgKey(data))&&Object.keys(saved).length>=64)throw Error('The saved background-feature limit is full.');data.adobe.backgroundFeatures={...saved,[bgKey(data)]:{selection,name,description,edited}};}
 function describe(data,value){const current=project(data);set(data,current.selection,{name:current.name,description:value,edited:true,names:current.selection.startsWith('feature:')?[current.name]:[]});}
 return{normalize,project,choices,set,describe};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterBackgroundFeatures;
