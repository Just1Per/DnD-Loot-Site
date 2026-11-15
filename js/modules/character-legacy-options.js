'use strict';
/* Original concise reminders for source-reviewed optional legacy choices. */
var CharacterLegacyOptions=(()=>{
 const details={
 'aspect-of-the-moon':'You need no sleep; a long rest still requires 8 hours of light activity.',
 'bond-of-the-talisman':'While its wearer is within proficiency-bonus miles, either can teleport to the other as an action. Track your PB uses per long rest.',
 'cloak-of-flies':'Bonus action: create a 5-ft aura until dismissed or incapacitated. Adjacent creatures take CHA Poison damage at the start of their turns; your Intimidation has advantage and other Charisma checks have disadvantage.',
 'eldritch-mind':'Advantage on Constitution saves to maintain Concentration.',
 'eldritch-smite':'Once per turn on a pact-weapon hit, spend a Pact Magic slot: add (slot level + 1)d8 Force and optionally knock a Huge-or-smaller target prone.',
 'far-scribe':'Write consenting creatures in your tome, up to PB. Cast Sending to listed creatures without slots or components; maintain the list manually.',
 'ghostly-gaze':'Action: see through solid objects within 30 ft for up to 1 minute with Concentration. Ended vision does not persist; one use per short or long rest.',
 'gift-of-the-depths':'Breathe underwater; swimming speed equals walking speed. Cast Water Breathing once per long rest without a slot.',
 'gift-of-the-ever-living-ones':'While your familiar is within 100 ft, maximize dice rolled to restore your HP. Apply eligible healing manually.',
 'gift-of-the-protectors':'Record consenting creatures in your tome, up to PB. Once per long rest, a listed creature drops to 1 HP instead of 0 unless killed outright.',
 'grasp-of-hadar':'Once on each of your turns, an Eldritch Blast hit can pull its target up to 10 ft toward you.',
 'improved-pact-weapon':'Use your pact weapon as a spellcasting focus; it gains +1 attack/damage unless it already has a bonus. Pact forms can include shortbow, longbow and crossbows. Apply only to the designated pact weapon.',
 'investment-of-the-chain-master':'The summoned familiar gains 40-ft fly or swim speed, magical weapon attacks and your spell DC. Command its Attack as a bonus action; react to grant resistance to damage it takes. Apply only to that familiar.',
 'lance-of-lethargy':'Once on each of your turns, an Eldritch Blast hit can reduce its target’s speed by 10 ft until your next turn.',
 'maddening-hex':'Bonus action: a visible cursed target within 30 ft and chosen creatures within 5 ft of it take Psychic damage equal to CHA (minimum 1). Requires your eligible curse.',
 'protection-of-the-talisman':'Its wearer may add 1d4 to a failed saving throw, PB times per long rest.',
 'rebuke-of-the-talisman':'Reaction: when its wearer is hit by an attacker you see within 30 ft of you, deal CHA Psychic damage (minimum 1) and push it up to 10 ft away from the wearer.',
 'relentless-hex':'Bonus action: teleport up to 30 ft to a visible empty space within 5 ft of your visible cursed target. Requires your eligible curse.',
 'shroud-of-shadow':'Cast Invisibility at will without a spell slot.',
 'tomb-of-levistus':'Reaction when damaged: gain 10 × Warlock level temporary HP, including against the triggering damage. Until your next turn ends: Speed 0, Incapacitated and Fire vulnerability; these temporary HP expire then.',
 'trickster-s-escape':'Cast Freedom of Movement on yourself once per long rest without a slot.',
 'undying-servitude':'Cast Animate Dead once per long rest without a slot.'
 };
 const resources={
 'bond-of-the-talisman':{pb:true,rest:'long'},'cloak-of-flies':{rest:'short'},'ghostly-gaze':{rest:'short'},'gift-of-the-depths':{rest:'long'},'gift-of-the-protectors':{rest:'long'},'protection-of-the-talisman':{pb:true,rest:'long'},'tomb-of-levistus':{rest:'short'},'trickster-s-escape':{rest:'long'},'undying-servitude':{rest:'long'}
 };
 const styles={ 'blind-fighting':'Blindsight 10 ft; an invisible creature is still unseen if it successfully hides from you.',interception:'Reaction: reduce damage to another creature within 5 ft by 1d10 + PB when a visible attacker hits it; hold a shield or simple/martial weapon.', 'thrown-weapon-fighting':'Draw thrown weapons as part of their attacks; ranged attacks with thrown weapons gain +2 damage.', 'unarmed-fighting':'Unarmed strikes deal 1d6 + STR, or 1d8 + STR with no weapon or shield. At the start of your turn, deal 1d4 to one creature you grapple.', 'superior-technique':'Choose one Battle Master maneuver. Gain one d6 superiority die; recover it on a short or long rest.', 'blessed-warrior':'Choose two Cleric cantrips; Charisma is the casting ability.', 'druidic-warrior':'Choose two Druid cantrips; Wisdom is the casting ability.' };
 return{details,resources,styles};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterLegacyOptions;
