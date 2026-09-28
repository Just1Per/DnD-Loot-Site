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
 function get(background){
  const key=String(background||'').replace(/-20(?:14|24)$/,''),canonical=alias[key]||key;
  const adobe=typeof CharacterAdobeData!=='undefined'?CharacterAdobeData.story:null;
  if(adobe?.[canonical])return {...adobe[canonical],source:'Adobe sheet table'};
  const p=profiles[canonical];if(!p)return {source:'Custom background — write your own',personality:[],ideals:[],bonds:[],flaws:[]};
  return {source:'Original background-specific suggestions (not Adobe text)',personality:[p[0]],ideals:[p[1]],bonds:[p[2]],flaws:[p[3]]};
 }
 return {get};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterStory;
function updateStorySuggestions(){
 const form=document.getElementById('characterSheetForm'),host=document.getElementById('sheetStoryPreset');if(!host||!sheetSession)return;
 const b=sheetSession.data.build.background;if(host.dataset.background===b)return;host.dataset.background=b;
 const profile=CharacterStory.get(b),bg=CharacterBackgrounds.get(b);
 host.textContent=(bg?.name||'Custom background')+' · '+profile.source;
 for(const key of ['personality','ideals','bonds','flaws']){
  const input=form.querySelector(`[name="${key}"]`),select=form.querySelector(`[data-story-choice="${key}"]`),rows=profile[key];
  select.innerHTML='<option value="">Choose a suggestion</option>'+rows.map((v,i)=>`<option value="${i}">${sheetEscape(v)}</option>`).join('')+'<option value="other">Other — write my own</option>';
  const current=sheetSession.data[key],index=rows.indexOf(current);select.value=index>=0?String(index):current?'other':'';input.readOnly=index>=0;
  select.onchange=()=>{if(select.value==='other')input.readOnly=false;else{input.value=select.value===''?'':rows[Number(select.value)];input.readOnly=true;}input.dispatchEvent(new Event('input',{bubbles:true}));if(select.value==='other')input.focus();};
 }
}
