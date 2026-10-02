/* Original background-specific writing prompts; exact Adobe tables take priority when supplied. */
var CharacterStory = (()=>{
 const profiles={
 criminal:['I check the exits before discussing business.','I keep my promises even when I break the law.','I owe my freedom to someone still behind bars.','I treat every unfamiliar kindness as a possible trap.'],
 charlatan:['I change my manner of speaking to fit my audience.','A clever disguise should expose bullies, not hurt their victims.','Someone knows the honest person behind my best disguise.','I keep inventing details after a lie has already worked.'],
 entertainer:['I turn awkward silences into little performances.','A good performance can give people courage.','My old troupe still has a place for me by the fire.','I chase applause when I should be listening.'],
 'folk-hero':['I listen closely to people whose work goes unnoticed.','Ordinary people deserve someone who will stand beside them.','My village expects me to return when it needs help.','I take public challenges far too personally.'],
 'guild-artisan':['I notice how objects are made before noticing their owners.','Useful work deserves fair pay and honest recognition.','My first teacher trusted me with an unfinished commission.','I cannot leave a flawed piece of work alone.'],
 hermit:['I am comfortable sitting quietly while others search for words.','Understanding matters more to me than recognition.','I protect the place where I first found peace.','I retreat into solitude when people need an answer.'],
 noble:['I remember introductions, family names, and old obligations.','Influence should carry responsibility toward those without it.','My household depends on a promise I made publicly.','I underestimate how difficult life is without connections.'],
 outlander:['I navigate by weather, terrain, and familiar landmarks.','No one should be abandoned beyond the reach of help.','A trail back home matters more to me than a title.','I mistake settled customs for pointless restrictions.'],
 sage:['I collect questions faster than I can answer them.','Knowledge should survive whoever currently controls it.','A missing colleague left me a question I must resolve.','I delay urgent decisions while seeking one more source.'],
 sailor:['I judge trouble by how people work together under pressure.','A crew survives by sharing both risk and responsibility.','I will not forget the crew that brought me home alive.','I accept wagers before considering the stakes.'],
 soldier:['I organize supplies whenever conversation becomes uncomfortable.','Orders never remove my responsibility for what I do.','I carry the names of comrades who did not return.','I react to disagreement as though it were insubordination.'],
 urchin:['I remember overlooked passages and places to hide.','Nobody should have to face hunger alone.','Someone on the streets is waiting for me to return.','I hide useful things even from people I trust.'],
 artisan:['I solve unfamiliar problems by sketching a design.','Careful work is a form of respect for others.','I want to finish a project my mentor could not complete.','I spend too long improving things that already work.'],
 farmer:['I measure progress in patient work and small improvements.','A community thrives when nobody is left without food.','I mean to restore a piece of land my family lost.','I resist plans that depend on luck rather than preparation.'],
 guard:['I remember faces and notice when routines change.','Keeping people safe matters more than looking powerful.','I once let someone through a gate and must learn their fate.','I confuse suspicion with good judgment.'],
 guide:['I describe dangers plainly before anyone takes the next step.','People who rely on me deserve an honest path.','I promised to lead someone home from a place nobody maps.','I find it hard to follow another person’s lead.'],
 merchant:['I ask what people need before discussing what they own.','A fair agreement should leave both sides better off.','An old trading partner trusted me with their last savings.','I keep negotiating after the right answer is already clear.'],
 scribe:['I write down small details that others expect to remember.','A truthful record can protect people from powerful liars.','I must recover a document entrusted to my care.','I trust written claims longer than I should.'],
 wayfarer:['I learn a little of every place before moving on.','A stranger deserves a chance to become a friend.','I am following a promise across a changing world.','I leave whenever staying begins to matter.']
 };
 const alias={spy:'criminal',gladiator:'entertainer','guild-merchant':'guild-artisan',knight:'noble',retainers:'noble',pirate:'sailor'};
 const meta={
  criminal:['the underworld','people who live outside respectable society','a hidden safe place'],
  charlatan:['crowds and first impressions','people fooled by those with more power','an old identity'],
  entertainer:['an audience','performers and ordinary listeners','a stage that once felt like home'],
  'folk-hero':['working communities','ordinary people','the place that first called me a hero'],
  'guild-artisan':['craft and trade','workers and apprentices','my first workshop'],
  hermit:['silence and reflection','people searching for answers','the refuge where I learned to be alone'],
  noble:['rank and obligation','people affected by my family name','my household'],
  outlander:['wilderness and travel','travelers far from safety','the land I call home'],
  sage:['books and unanswered questions','people seeking knowledge','a library or place of study'],
  sailor:['ships and hard weather','the crew beside me','the vessel that taught me my trade'],
  soldier:['discipline and danger','comrades under pressure','the unit that shaped me'],
  urchin:['streets and overlooked places','people with nowhere safe to sleep','the neighborhood that raised me'],
  artisan:['tools and patient work','people who depend on skilled hands','my mentor’s workshop'],
  farmer:['seasons and practical labor','families who depend on the harvest','the land that fed me'],
  guard:['routines and warning signs','people who rely on protection','the post I once watched'],
  guide:['routes and hazards','travelers who trust my judgment','a road nobody else remembers'],
  merchant:['needs, prices, and promises','customers and trading partners','the market where I learned my trade'],
  scribe:['records and small details','people protected by an accurate account','the archive entrusted to me'],
  wayfarer:['new places and unfamiliar customs','strangers between homes','the road I keep returning to']
 };
 const baseIdealAlignment={criminal:'Lawful',charlatan:'Good',entertainer:'Good','folk-hero':'Good','guild-artisan':'Lawful',hermit:'Neutral',noble:'Good',outlander:'Good',sage:'Neutral',sailor:'Lawful',soldier:'Good',urchin:'Good',artisan:'Lawful',farmer:'Good',guard:'Good',guide:'Lawful',merchant:'Lawful',scribe:'Lawful',wayfarer:'Good'};
 function ideal(text,alignment){return{text,alignment};}
 function parsedIdeal(value){
  const text=String(value||''),match=text.match(/\((Lawful|Chaotic|Good|Evil|Neutral|Any)\)\s*$/i);
  return{text,alignment:match?match[1][0].toUpperCase()+match[1].slice(1).toLowerCase():'Any'};
 }
 function expanded(canonical,p){
  const [world,people,place]=meta[canonical]||['my old life','people like me','a place from my past'];
  return {
   source:'Original background-specific suggestions (not copied source text)',
   personality:[
    p[0],
    'I instinctively read a new situation through what I learned from '+world+'.',
    'I pay close attention to how strangers treat '+people+'.'
   ],
   ideals:[
    ideal(p[1],baseIdealAlignment[canonical]||'Any'),
    ideal('Duty: I honor commitments that come from '+world+', even when keeping them is inconvenient.','Lawful'),
    ideal('Freedom: Nobody should be trapped by customs or authorities simply because they have always existed.','Chaotic'),
    ideal('Compassion: I use what my background taught me to help '+people+' when I can.','Good'),
    ideal('Ambition: The skills I learned from '+world+' should raise my position, whatever it costs others.','Evil'),
    ideal('Balance: I try to preserve what works while accepting that every situation requires its own judgment.','Neutral')
   ],
   bonds:[
    p[2],
    'I will take serious risks to protect '+people+'.',
    'Something connected to '+place+' still has a claim on me.'
   ],
   flaws:[
    p[3],
    'I overvalue habits that kept me safe in '+world+', even when they no longer fit.',
    'I can be slow to trust people who have never understood '+people+'.'
   ]
  };
 }

 function genericKnownBackground(bg){
  const label=bg?.name||'my background';
  return {
   source:'Original '+label+' suggestions (not copied source text)',
   personality:[
    'I often approach unfamiliar situations through the habits I learned as a '+label+'.',
    'I notice the details that people outside my old life tend to overlook.',
    'I am quick to recognize when someone is dealing with problems I have faced before.'
   ],
   ideals:[
    ideal('Duty: I try to honor the responsibilities I carried before becoming an adventurer.','Lawful'),
    ideal('Freedom: I refuse to let old institutions decide what my life must become.','Chaotic'),
    ideal('Compassion: I use what I learned to make life safer or fairer for other people.','Good'),
    ideal('Ambition: My old skills are tools for gaining influence, wealth, or power.','Evil'),
    ideal('Balance: Experience taught me that rules and instincts both have limits.','Neutral')
   ],
   bonds:[
    'Someone from my former life still depends on me.',
    'I carry a promise connected to the work or community that shaped me.',
    'There is a place, organization, or person from my background that I intend to protect.'
   ],
   flaws:[
    'I rely on old habits even when the situation has changed.',
    'I assume people without my experience will make the same mistakes I once saw.',
    'I have difficulty walking away when my pride in my old role is challenged.'
   ]
  };
 }
 function get(background){
  const key=String(background||'').replace(/-20(?:14|24)$/,''),canonical=alias[key]||key;
  const adobe=typeof CharacterAdobeData!=='undefined'?CharacterAdobeData.story:null;
  if(adobe?.[canonical])return {...adobe[canonical],ideals:(adobe[canonical].ideals||[]).map(parsedIdeal),source:'Adobe sheet table'};
  const p=profiles[canonical];if(p)return expanded(canonical,p);
  const known=typeof CharacterBackgrounds!=='undefined'?CharacterBackgrounds.get(background):null;
  if(known)return genericKnownBackground(known);
  return {source:'Custom background — write your own',personality:[],ideals:[],bonds:[],flaws:[]};
 }
 return {get};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterStory;
function updateStorySuggestions(){
 const form=document.getElementById('characterSheetForm'),host=document.getElementById('sheetStoryPreset');if(!host||!sheetSession)return;
 const b=sheetSession.data.build.background;if(host.dataset.background===b)return;host.dataset.background=b;
 const profile=CharacterStory.get(b),bg=CharacterBackgrounds.get(b);
 host.textContent=(bg?.name||'Custom background')+' · '+profile.source;
 const valueOf=row=>typeof row==='string'?row:row?.text||'';
 const idealLabel=row=>typeof row==='string'?row:`${row.alignment||'Any'} · ${row.text}`;
 for(const key of ['personality','ideals','bonds','flaws']){
  const input=form.querySelector(`[name="${key}"]`),select=form.querySelector(`[data-story-choice="${key}"]`),rows=profile[key]||[],values=rows.map(valueOf);
  select.innerHTML='<option value="">Choose a suggestion</option>'+rows.map((row,i)=>`<option value="${i}">${sheetEscape(key==='ideals'?idealLabel(row):valueOf(row))}</option>`).join('')+'<option value="other">Other — write my own</option>';
  const current=sheetSession.data[key],index=values.indexOf(current);select.value=index>=0?String(index):current?'other':'';input.readOnly=index>=0;
  let hint=key==='ideals'?select.parentElement?.querySelector('[data-ideal-alignment-hint]'):null;
  if(key==='ideals'&&!hint){hint=document.createElement('small');hint.dataset.idealAlignmentHint='true';hint.className='sheet-help';select.after(hint);}
  const updateHint=()=>{if(!hint)return;const row=rows[Number(select.value)];hint.textContent=select.value!==''&&select.value!=='other'&&row?.alignment?`Alignment tendency: ${row.alignment}. This is guidance only; it does not change your alignment automatically.`:'Ideals are marked with a suggested alignment tendency when relevant.';};
  updateHint();
  select.onchange=()=>{if(select.value==='other')input.readOnly=false;else{input.value=select.value===''?'':valueOf(rows[Number(select.value)]);input.readOnly=true;}updateHint();input.dispatchEvent(new Event('input',{bubbles:true}));if(select.value==='other')input.focus();};
 }
}
