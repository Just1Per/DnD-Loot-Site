'use strict';
/* Original short reminders, not copied source entries. Full rules and personal notes stay separate. */
var CharacterSpellSummaries=(()=>{
 const descriptions=Object.fromEntries(`
Acid Splash|Splash acid over nearby targets.
Blade Ward|Protect yourself against weapon attacks.
Booming Blade|A weapon strike punishes the target for moving.
Chill Touch|Necrotic damage prevents the target from regaining HP.
Control Flames|Shape, brighten, spread or extinguish a small nonmagical flame.
Create Bonfire|Create a damaging fire in a small area.
Dancing Lights|Move small magical lights, or combine them into a glowing figure.
Druidcraft|Create a tiny natural effect or predict nearby weather.
Eldritch Blast|Fire Force beams; higher character levels add beams.
Elementalism|Create a small, harmless effect of air, earth, fire or water.
Encode Thoughts|Draw out a thought as a magical strand for later reading.
Fire Bolt|Hurl a bolt of Fire at a creature or object.
Friends|Gain a brief social advantage over one creature.
Frostbite|Cold damage hinders the target's next weapon attack.
Green-Flame Blade|A weapon strike carries fire to a nearby second creature.
Guidance|Add 1d4 to an eligible ability check.
Gust|Move a small object, push a creature or create a harmless breeze.
Infestation|Biting pests deal Poison damage and may force random movement.
Light|Make an object shine brightly.
Lightning Lure|Pull a creature toward you and shock it if close enough.
Mage Hand|Move a spectral hand to handle objects; it cannot attack.
Magic Stone|Enchant pebbles for ranged spell attacks.
Mending|Repair a small break or tear in an object.
Message|Whisper to a distant creature and hear its whispered reply.
Mind Sliver|Psychic damage subtracts 1d4 from the target's next save.
Minor Illusion|Create a small sound or a still image of an object.
Mold Earth|Move loose earth or alter the surface of earth or stone.
Poison Spray|Blast a nearby creature with Poison.
Prestidigitation|Perform small magical tricks, cleaning or sensory effects.
Primal Savagery|A magically altered unarmed spell attack deals Acid damage.
Produce Flame|Hold a small flame for light or throw it to deal Fire damage.
Ray of Frost|Cold damage also reduces the target's Speed.
Resistance|Add 1d4 to an eligible saving throw.
Sacred Flame|Radiant damage ignores the target's benefit from cover.
Sapping Sting|Necrotic damage can knock the target Prone.
Shape Water|Move, color, shape or freeze a small amount of water.
Shillelagh|Empower a club or quarterstaff with your spellcasting ability.
Shocking Grasp|A melee Lightning spell attack disrupts the target's reactions.
Sorcerous Burst|Deal a chosen elemental damage type; maximum die rolls may add dice.
Spare the Dying|Stabilize a dying creature without healing it.
Starry Wisp|Radiant damage outlines a target and can reveal it despite Invisibility.
Sword Burst|Force blades damage creatures immediately around you.
Thaumaturgy|Create small supernatural signs, sounds or dramatic changes.
Thorn Whip|A melee spell attack deals Piercing damage and can pull a creature closer.
Thunderclap|Thunder damages nearby creatures and creates a loud report.
Toll the Dead|Deal Necrotic damage, using a larger die against an injured target.
True Strike|Guide a weapon attack with magic.
Vicious Mockery|Psychic damage gives Disadvantage on the target's next attack.
Word of Radiance|Radiant energy damages nearby creatures you choose.
Absorb Elements|Resist triggering elemental damage and empower your next melee hit.
Alarm|Ward an area; receive a mental or audible alert when it is entered.
Animal Friendship|Charm a beast so it regards you as harmless.
Armor of Agathys|Gain Temporary HP; melee attackers can take Cold damage.
Arms of Hadar|Necrotic tendrils harm nearby creatures and can prevent reactions.
Bane|Subtract 1d4 from affected creatures' attacks and saves.
Beast Bond|Form a telepathic link with a friendly beast.
Bless|Add 1d4 to affected creatures' attacks and saves.
Burning Hands|A short cone of Fire damages creatures and can ignite objects.
Catapult|Launch an unattended object into a creature or surface.
Cause Fear|Frighten a creature that fails its save.
Ceremony|Perform one of several rites with a specific lasting benefit.
Chaos Bolt|An unpredictable energy bolt can leap to another target.
Charm Person|Charm a humanoid; mistreatment can end the effect.
Chromatic Orb|Hurl an orb with a chosen elemental damage type.
Color Spray|A spray of colors can Blind creatures.
Command|Give a brief command that a creature follows on a failed save.
Compelled Duel|Challenge one creature and discourage it from attacking others.
Comprehend Languages|Understand literal spoken language and read visible writing.
Create or Destroy Water|Create water, destroy water or remove fog in an area.
Cure Wounds|Restore HP to a creature you touch.
Detect Evil and Good|Sense certain supernatural creature types and consecration nearby.
Detect Magic|Sense nearby magic and inspect visible magical auras.
Detect Poison and Disease|Sense and identify nearby poisons, poisonous creatures and diseases.
Disguise Self|Change your apparent appearance and clothing, without changing touch.
Dissonant Whispers|Psychic damage can force a creature to flee using its Reaction.
Distort Value|Make an object appear more or less valuable.
Divine Favor|Your weapon attacks deal extra Radiant damage.
Divine Smite|After a melee hit, spend a slot to add Radiant damage.
Earth Tremor|Shake nearby ground, damage creatures and potentially knock them Prone.
Ensnaring Strike|A weapon hit can bind the target in damaging vines.
Entangle|Restraining plants fill an area with Difficult Terrain.
Expeditious Retreat|Dash now and use later Bonus Actions to Dash.
Faerie Fire|Outline targets; attacks gain Advantage and Invisibility loses its benefit.
False Life|Gain Temporary HP.
Feather Fall|Slow the fall of several creatures, preventing falling damage.
Find Familiar|Summon a small spirit companion with a chosen animal form.
Fog Cloud|Fill an area with heavily obscuring fog.
Frost Fingers|A short cone of Cold damages creatures and freezes exposed water.
Gift of Alacrity|Give a creature a bonus die on its next Initiative roll.
Goodberry|Create nourishing berries that each restore a little HP.
Grease|Make an area slippery, creating Difficult Terrain and risking Prone.
Guiding Bolt|Radiant damage grants Advantage on the next attack against the target.
Hail of Thorns|A ranged weapon hit scatters damaging thorns around its target.
Healing Word|Restore HP to a visible creature at range.
Hellish Rebuke|Use your Reaction to burn a creature that damaged you.
Heroism|Suppress fear and grant recurring Temporary HP.
Hex|Curse a target: extra Necrotic damage on hits and a chosen check penalty.
Hunter's Mark|Mark prey for extra weapon-hit damage and easier tracking.
Ice Knife|A Piercing projectile explodes with Cold damage around its target.
Identify|Learn an object's magical properties, use and attunement requirements.
Illusory Script|Write a message whose true meaning is hidden from unintended readers.
Inflict Wounds|Channel Necrotic energy into a creature you touch.
Jim's Magic Missile|Fire unreliable magical projectiles that require attack rolls.
Jump|Magically improve a creature's jumping.
Longstrider|Increase a creature's Speed by 10 ft.
Mage Armor|An unarmored creature uses a magical AC formula.
Magic Missile|Force darts automatically hit visible targets you choose.
Magnify Gravity|Force damage slows creatures and makes objects harder to lift.
Protection from Evil and Good|Protect a creature from certain supernatural creature types.
Purify Food and Drink|Remove poison and disease from nonmagical food and drink.
Ray of Sickness|Poison damage can also Poison the target.
Sanctuary|Enemies must pass a save before directly attacking the warded creature.
Searing Smite|A melee hit deals extra Fire damage and can keep burning.
Shield|Reaction: raise your AC and block Magic Missile.
Shield of Faith|Give a creature +2 AC.
Silent Image|Create and move a visual illusion without sound or other sensations.
Silvery Barbs|Force a successful enemy roll to reroll; grant another creature Advantage.
Sleep|Send affected creatures into magical sleep.
Snare|Create a concealed trap that can lift and Restrain a creature.
Speak with Animals|Converse with beasts.
Tasha's Caustic Brew|A line of Acid coats creatures, damaging them until removed.
Tasha's Hideous Laughter|Laughter can leave a target Prone and Incapacitated.
Tenser's Floating Disk|Create a following platform that carries a heavy load.
Thunderous Smite|A melee hit adds Thunder damage and can push a target Prone.
Thunderwave|A cube of Thunder damages creatures and can push them away.
Unseen Servant|An invisible force performs simple tasks; it cannot attack.
Witch Bolt|Maintain a damaging Lightning connection to a creature.
Wrathful Smite|A melee hit adds Psychic damage and can Frighten the target.
Zephyr Strike|Move without provoking opportunity attacks; empower one weapon attack.
Aganazzar's Scorcher|A line of fire damages creatures in its path.
Aid|Increase several creatures' current and maximum HP.
Air Bubble|Enclose a creature's head in breathable air.
Alter Self|Change your appearance, adapt to water or grow natural weapons.
Animal Messenger|Send a tiny beast to deliver a spoken message.
Arcane Lock|Magically lock an entry; designate who may bypass it.
Arcane Vigor|Spend Hit Dice during combat to regain HP.
Augury|Ask whether a planned near-term course brings good or bad outcomes.
Barkskin|Harden a creature's skin to improve its defenses.
Battle Familiar|Summon a combat-capable spirit companion.
Beast Sense|See and hear through a willing beast's senses.
Blindness/Deafness|Blind or Deafen a creature that fails its save.
Blur|Your blurred outline gives attackers Disadvantage.
Borrowed Knowledge|Gain proficiency in a skill you do not already know.
Branding Smite|A weapon hit adds Radiant damage and reveals an Invisible target.
Calm Emotions|Suppress charm or fear, or ease a group's hostility.
Cloud of Daggers|Create a small area of slashing blades.
Continual Flame|Create lasting magical light without heat or fuel consumption.
Cordon of Arrows|Set ammunition to strike creatures entering a guarded area.
Crown of Madness|Charm a humanoid and potentially direct its melee attack.
Darkness|Create magical darkness that ordinary Darkvision cannot penetrate.
Darkvision|Grant a creature Darkvision.
Detect Thoughts|Read surface thoughts; probe further with a risk of detection.
Dragon's Breath|Let a creature exhale a damaging cone of a chosen energy type.
Dust Devil|Create a moving whirlwind that damages, pushes and stirs dust.
Earthbind|Reduce a flying creature's flying Speed to 0, forcing a safe descent.
Enhance Ability|Grant Advantage on checks with one ability and a related benefit.
Enlarge/Reduce|Change a creature's size, Strength checks and weapon damage.
Enthrall|Distract listeners, making it harder for them to notice others.
Find Steed|Summon a loyal magical mount.
Find Traps|Sense the presence of deliberately harmful traps nearby.
Flame Blade|Create a fiery blade for melee spell attacks.
Flaming Sphere|Move a burning sphere to damage nearby creatures.
Flock of Familiars|Summon several temporary familiars.
Fortune's Favor|Give a creature a one-use reroll benefit.
Gentle Repose|Preserve remains and extend the time available for revival.
Gift of Gab|Replace listeners' memory of your last few seconds of speech.
Gust of Wind|A strong wind line pushes creatures and disperses gases.
Healing Spirit|A summoned spirit restores HP a limited number of times.
Heat Metal|Heat a metal object, damaging its holder or wearer.
Hold Person|Paralyze a humanoid that fails its save.
Homunculus Servant|Create a magical construct servant.
Immovable Object|Fix an object in place; specify who can move it.
Invisibility|Make a creature Invisible until the spell's ending conditions apply.
Jim's Glowing Coin|Enchant a coin to attract and distract nearby creatures.
Kinetic Jaunt|Improve movement and pass creatures without opportunity attacks.
Knock|Open or suppress one lock; creates a loud sound.
Lesser Restoration|Remove one of the spell's listed conditions or ailments.
Levitate|Suspend a target vertically; limited movement depends on nearby surfaces.
Locate Animals or Plants|Find the direction and distance of a named kind of beast or plant.
Locate Object|Sense the direction of a familiar or specified object nearby.
Magic Mouth|Set a spoken message to trigger under specified circumstances.
Magic Weapon|Make a nonmagical weapon magical and improve its attack and damage.
Maximilian's Earthen Grasp|A hand of earth can Restrain and crush a creature.
Melf's Acid Arrow|An Acid projectile deals immediate and lingering damage.
Mind Spike|Psychic damage lets you track the target's location.
Mirror Image|Illusory duplicates divert attacks away from you.
Misty Step|Teleport to a visible unoccupied space within 30 ft.
Moonbeam|A movable beam deals Radiant damage and can reveal shapechangers.
Nathair's Mischief|A whimsical area produces a randomly determined effect.
Nystul's Magic Aura|Alter how detection magic reads a creature or object.
Pass without Trace|Give nearby allies a major Stealth bonus and hide their tracks.
Phantasmal Force|Make one creature perceive a convincing illusion that can harm it.
Prayer of Healing|Restore HP to several creatures after an extended casting.
Protection from Poison|Neutralize poison and protect against further Poison damage.
Pyrotechnics|Turn a nonmagical flame into blinding fireworks or obscuring smoke.
Ray of Enfeeblement|Weaken the damage a creature deals with its attacks.
Rime's Binding Ice|A Cold cone damages creatures and can bind them in ice.
Rope Trick|A raised rope leads to a temporary extradimensional hiding space.
Scorching Ray|Fire several rays, each with its own Fire spell attack.
See Invisibility|See Invisible creatures and objects, and into the Ethereal Plane.
Shadow Blade|Create a Psychic blade that excels in dim light or darkness.
Shatter|Thunder damages creatures and unattended nonmagical objects in an area.
Shining Smite|A weapon hit deals Radiant damage and makes the target easier to hit.
Silence|Create a soundless area that blocks Thunder and Verbal casting.
Skywrite|Form a short message in the sky.
Snilloc's Snowball Swarm|An explosion of snow deals Cold damage in a small area.
Spider Climb|Let a creature walk on walls and ceilings without using its hands.
Spike Growth|Camouflaged spines turn an area into damaging Difficult Terrain.
Spiritual Weapon|Create a floating weapon for Bonus Action Force spell attacks.
Spray of Cards|A cone of magical cards damages and can Blind creatures.
Suggestion|Influence a creature to follow a suggested course of action.
Summon Beast|Summon a bestial spirit using the spell's scaling stat block.
Tasha's Mind Whip|Psychic damage limits reactions and the target's next-turn options.
Vortex Warp|Teleport a creature to a valid nearby destination.
Warding Bond|Share damage to grant a willing creature AC, save and resistance benefits.
Warding Wind|Surround yourself with wind that hinders movement, hearing and missiles.
Warp Sense|Detect nearby portals and identify their direction.
Web|Fill an area with sticky webs that can Restrain creatures.
Wither and Bloom|Necrotic damage in an area lets one creature spend a Hit Die to heal.
Wristpocket|Hide a small held object in an extradimensional space.
Zone of Truth|Creatures failing their saves cannot knowingly speak lies in the area.
`.trim().split('\n').map(line=>line.split('|')));
 Object.assign(descriptions,Object.fromEntries(`
Animate Dead|Raise bones or a corpse as undead; repeat casting to maintain control.
Antagonize|Psychic damage can force a creature to attack another creature.
Ashardalon's Stride|Move faster without opportunity attacks and burn creatures you pass.
Aura of Vitality|A healing aura lets you repeatedly restore HP.
Beacon of Hope|Grant save benefits and maximize healing received.
Bestow Curse|Afflict a creature with a chosen curse.
Blinding Smite|A melee hit adds Radiant damage and can Blind the target.
Blink|Periodically slip into the Ethereal Plane between turns.
Call Lightning|Create a storm cloud and repeatedly call down Lightning.
Catnap|Give willing creatures the benefits of a Short Rest after brief sleep.
Clairvoyance|Place a stationary magical sensor for distant sight or hearing.
Conjure Animals|Call animal-shaped magic to aid you in combat.
Conjure Barrage|A cone of magical ammunition damages creatures.
Counterspell|Use a Reaction to interrupt another creature's spell.
Create Food and Water|Produce enough simple food and water for a group.
Crusader's Mantle|Nearby allies' weapon attacks deal extra Radiant damage.
Daylight|Create bright light that can dispel eligible magical darkness.
Dispel Magic|End spells on a target; higher-level spells may require a check.
Elemental Weapon|Make a weapon magical, improving accuracy and adding elemental damage.
Enemies Abound|A creature loses the ability to distinguish friends from enemies.
Erupting Earth|An eruption damages creatures and leaves Difficult Terrain.
Fast Friends|Magically charm a creature into helping with requested tasks.
Fear|A terrifying cone can make creatures drop items and flee.
Feign Death|A willing creature appears dead and resists certain harm.
Fireball|8d6 Fire in a 20-ft-radius sphere; DEX save halves damage.
Flame Arrows|Enchant ammunition to deal extra Fire damage.
Fly|Grant a creature a flying Speed.
Galder's Tower|Create a furnished magical tower with chosen rooms.
Gaseous Form|Become mist to float through openings, with limited actions.
Glyph of Warding|Set an explosive or spell-bearing magical trap with a chosen trigger.
Haste|Improve Speed, AC and Dexterity saves; grant a restricted extra action.
Hunger of Hadar|A dark, alien area hinders movement and deals Cold and Acid damage.
Hypnotic Pattern|A visual pattern can Charm and Incapacitate creatures in an area.
Incite Greed|Lure creatures toward a displayed gem, leaving them distracted.
Intellect Fortress|Grant Psychic resistance and Advantage on mental saves.
Leomund's Tiny Hut|Create a stationary protective dome for a resting group.
Life Transference|Take Necrotic damage to restore another creature's HP.
Lightning Arrow|A ranged weapon attack becomes Lightning with a damaging burst.
Lightning Bolt|8d6 Lightning in a long line; DEX save halves damage.
Magic Circle|Create a ward against selected supernatural creature types.
Major Image|Create a moving illusion with sight, sound, smell and temperature.
Mass Healing Word|Restore HP to several visible creatures at range.
Meld into Stone|Merge into stone, retaining limited awareness and casting options.
Melf's Minute Meteors|Create small meteors you can launch as damaging Fire bursts.
Motivational Speech|Encourage allies with Temporary HP and defensive benefits.
Nondetection|Protect a creature, place or object against divination magic.
Phantom Steed|Create a fast, temporary riding mount.
Plant Growth|Overgrow plants to hinder movement, or enrich a year's harvest.
Protection from Energy|Grant Resistance to one selected elemental damage type.
Pulse Wave|A Force cone damages creatures and pushes or pulls them.
Remove Curse|End curses affecting a creature or object, subject to specific exceptions.
Revivify|Restore a recently dead creature to life with 1 HP.
Sending|Send a short message across great distance and receive a reply.
Sleet Storm|Ice and heavy precipitation hinder movement, sight and concentration.
Slow|Reduce several creatures' movement, defenses and action options.
Speak with Dead|Question a corpse that still has a mouth.
Speak with Plants|Communicate with plants and influence nearby plant terrain.
Spirit Guardians|Spirits protect you, slowing enemies and dealing Radiant or Necrotic damage.
Spirit Shroud|Nearby attacks deal extra damage; affected enemies struggle to heal or move.
Stinking Cloud|A nauseating cloud obscures an area and can waste creatures' actions.
Summon Fey|Summon a fey spirit using the spell's scaling stat block.
Summon Lesser Demons|Summon uncontrolled demons; protective blood can ward a space.
Summon Shadowspawn|Summon a shadow spirit using the spell's scaling stat block.
Summon Undead|Summon an undead spirit using the spell's scaling stat block.
Thunder Step|Teleport with a willing companion and leave a damaging Thunder burst.
Tidal Wave|A wave damages creatures, can knock them Prone and extinguishes flames.
Tiny Servant|Animate a tiny object as a temporary servant.
Tongues|Let a creature understand and be understood in spoken languages.
Vampiric Touch|A melee Necrotic spell attack heals you for part of the damage dealt.
Wall of Sand|Create an opaque sand wall that greatly slows movement through it.
Wall of Water|Create a water wall that hinders missiles and interacts with fire and cold.
Water Breathing|Allow several creatures to breathe underwater.
Water Walk|Allow creatures to travel over liquid surfaces.
Wind Wall|A wind barrier damages creatures initially and blocks small missiles or gases.
Arcane Eye|Create a movable Invisible sensor for distant sight.
Aura of Life|Protect nearby allies against Necrotic harm and help dying creatures recover.
Aura of Purity|Nearby allies resist Poison and gain benefits against harmful conditions.
Banishment|Remove a creature to another plane while the effect lasts.
Blight|Necrotic damage with stronger effects against plants.
Charm Monster|Charm a creature; mistreatment can end the effect.
Compulsion|Influence affected creatures to move in a chosen direction.
Confusion|Make creatures act unpredictably on failed saves.
Conjure Minor Elementals|Call elemental magic that aids you in combat.
Conjure Woodland Beings|Call woodland magic that aids you in combat.
Control Water|Part, redirect, raise or whirl a body of water.
Death Ward|Protect a creature once against dropping to 0 HP or an instant-death effect.
Dimension Door|Teleport a substantial distance, optionally bringing a companion.
Divination|Ask a divine source about an event within the coming week.
Dominate Beast|Charm a beast and direct its actions through a mental link.
Elemental Bane|Choose an energy type; remove Resistance and add damage when it is dealt.
Evard's Black Tentacles|An area of tentacles Restrains and crushes creatures.
Fabricate|Transform raw materials into a manufactured object.
Find Greater Steed|Summon a more powerful magical mount.
Fire Shield|Resist Fire or Cold and damage creatures that hit you in melee.
Fount of Moonlight|Gain Radiant benefits and punish nearby attackers with moonlight.
Freedom of Movement|Protect movement against certain restraints, Difficult Terrain and water.
Galder's Speedy Courier|Send a container and its contents to a recipient by elemental courier.
Giant Insect|Transform insects into temporary combat allies.
Grasping Vine|A conjured vine repeatedly pulls creatures toward it.
Gravity Sinkhole|A Force sphere damages creatures and pulls them toward its center.
Greater Invisibility|Keep a creature Invisible even while it attacks or casts.
Guardian of Faith|A stationary guardian deals Radiant damage to nearby enemies.
Guardian of Nature|Take on a beastlike or treelike form with combat benefits.
Hallucinatory Terrain|Disguise natural terrain with an illusion.
Ice Storm|Hail deals Bludgeoning and Cold damage and leaves Difficult Terrain.
Leomund's Secret Chest|Hide a chest on the Ethereal Plane and retrieve it later.
Locate Creature|Sense the direction of a familiar or specified creature nearby.
Mordenkainen's Faithful Hound|An Invisible watchdog alerts you and attacks nearby enemies.
Mordenkainen's Private Sanctum|Ward an area against observation, travel or sound as chosen.
Otiluke's Resilient Sphere|Enclose a creature in a protective Force sphere.
Phantasmal Killer|An illusory nightmare can Frighten and deal Psychic damage.
Polymorph|Transform a creature into a beast using the selected edition's rules.
Raulothim's Psychic Lance|Psychic damage can Incapacitate a target; naming it can aid targeting.
Shadow of Moil|Shadows obscure you and damage nearby attackers.
Sickening Radiance|Radiant light reveals creatures and can cause Exhaustion.
Spirit of Death|Summon a reaper spirit to pursue a marked creature.
Staggering Smite|A melee hit adds Psychic damage and hinders the target.
Stone Shape|Reshape a limited amount of stone into a desired form.
Stoneskin|Grant Resistance to eligible Bludgeoning, Piercing and Slashing damage.
Storm Sphere|Create a damaging wind sphere and launch Lightning from it.
Summon Aberration|Summon an aberrant spirit using the spell's scaling stat block.
Summon Construct|Summon a construct spirit using the spell's scaling stat block.
Summon Elemental|Summon an elemental spirit using the spell's scaling stat block.
Summon Greater Demon|Summon a powerful demon that may break your control.
Vitriolic Sphere|A burst of Acid deals immediate damage and can linger.
Wall of Fire|Create a damaging fire wall with a selected dangerous side.
Watery Sphere|Move a water sphere that can engulf and Restrain creatures.
Animate Objects|Animate selected objects as temporary combatants.
Antilife Shell|Create a barrier that keeps most living creatures away.
Awaken|Give a beast or plant intelligence and the ability to speak.
Banishing Smite|A weapon hit adds Force damage and may temporarily banish its target.
Bigby's Hand|Control a large Force hand to strike, grasp, push or protect.
Circle of Power|Nearby allies gain protective benefits against spells.
Cloudkill|Create a moving cloud of Poison that heavily obscures its area.
Commune|Ask a divine source a few yes-or-no questions.
Commune with Nature|Learn facts about the surrounding natural region.
Cone of Cold|Deal 8d8 Cold damage in a large cone; CON save halves damage.
Conjure Elemental|Call elemental magic to aid you in combat.
Conjure Volley|Magical ammunition rains down over a large area.
Contact Other Plane|Ask an extraplanar intelligence questions, risking mental harm.
Contagion|Afflict a creature with a disease through the selected edition's rules.
Control Winds|Alter winds in a large area to hinder movement or aid flight.
Create Spelljamming Helm|Turn a suitable seat into a spelljamming helm.
Creation|Create a temporary nonliving object from shadow material.
Danse Macabre|Animate several corpses as temporary undead combatants.
Dawn|Move a cylinder of damaging sunlight.
Destructive Wave|A burst damages nearby enemies with Thunder and Radiant or Necrotic energy.
Dispel Evil and Good|Protect yourself from supernatural creatures; dismiss or free affected targets.
Dominate Person|Charm a humanoid and direct its actions through a mental link.
Dream|Enter a sleeping creature's dream to communicate or create a nightmare.
Enervation|Drain a creature with recurring Necrotic damage that heals you.
Far Step|Repeatedly teleport using a Bonus Action.
Flame Strike|A vertical column deals Fire and Radiant damage.
Geas|Impose a magical command, punishing deliberate disobedience with Psychic damage.
Greater Restoration|Remove one serious condition, curse or reduction specified by the spell.
Hallow|Consecrate an area with a selected supernatural ward and extra effect.
Hold Monster|Paralyze a creature that fails its save.
Holy Weapon|Enchant a weapon with Radiant damage; dismiss it in a blinding burst.
Immolation|Set a creature ablaze with Fire damage that can recur.
Infernal Calling|Summon a devil and attempt to obtain its service.
Insect Plague|A swarm fills an area with damaging, obscuring insects.
Jallarzi's Storm of Radiance|Radiant and Thunder energy forms a harmful, disruptive storm.
Legend Lore|Learn important lore about a significant person, place or object.
Maelstrom|Create a churning water vortex that damages and pulls creatures.
Mass Cure Wounds|Restore HP to several creatures in an area.
Mislead|Become Invisible while an illusory duplicate draws attention.
Modify Memory|Alter a creature's memory of a limited event.
Negative Energy Flood|Necrotic energy harms living targets and can empower undead.
Passwall|Open a temporary passage through wood, plaster or stone.
Planar Binding|Bind a summoned extraplanar creature to service.
Raise Dead|Restore a recently dead creature to life, subject to bodily requirements.
Rary's Telepathic Bond|Link willing creatures for silent communication across any distance on a plane.
Reincarnate|Restore a dead humanoid in a new adult body.
Scrying|Observe a creature or familiar location through a magical sensor.
Seeming|Disguise several creatures without physically changing them.
Skill Empowerment|Give a proficient creature Expertise in one selected skill.
Steel Wind Strike|Make Force melee spell attacks against several targets, then teleport.
Summon Celestial|Summon a celestial spirit using the spell's scaling stat block.
Summon Draconic Spirit|Summon a draconic spirit using the spell's scaling stat block.
Summon Dragon|Summon a dragon spirit using the spell's scaling stat block.
Swift Quiver|Use Bonus Actions for two additional attacks with ammunition from your quiver.
Synaptic Static|Psychic damage leaves creatures with penalties to attacks and certain rolls.
Telekinesis|Repeatedly move a creature or object with your mind.
Teleportation Circle|Open a brief portal to a known permanent teleportation circle.
Temporal Shunt|Reaction: displace a creature in time to interrupt its attack or spell.
Transmute Rock|Turn rock into mud or mud into rock, potentially trapping creatures.
Tree Stride|Move between living trees of the same kind.
Wall of Force|Create an Invisible Force barrier in a selected shape.
Wall of Light|Create a Radiant wall that can Blind; launch beams from it.
Wall of Stone|Create stone panels that can become permanent.
Wrath of Nature|Animate terrain, trees and rocks to hinder and damage enemies.
Yolande's Regal Presence|An imposing aura can Charm, move and knock enemies Prone.
`.trim().split('\n').map(line=>line.split('|'))));
 Object.assign(descriptions,Object.fromEntries(`
Arcane Gate|Link two nearby locations with paired portals.
Blade Barrier|Create a wall of damaging blades made of magical energy.
Bones of the Earth|Raise stone pillars that lift or crush creatures.
Chain Lightning|Lightning strikes one target and jumps to several others.
Circle of Death|A wide Necrotic pulse damages creatures in an area.
Conjure Fey|Call fey magic to aid you in combat.
Contingency|Store a spell that takes effect when your chosen condition occurs.
Create Homunculus|Create a loyal tiny construct linked to you.
Create Undead|Raise stronger undead and renew control through repeated casting.
Disintegrate|Force damage can reduce a target or object to dust.
Drawmij's Instant Summons|Mark an object so breaking a gem can summon it to you.
Druid Grove|Ward a natural area with fog, grasping plants and other protections.
Eyebite|Your gaze can put a creature to sleep, sicken it or panic it.
Find the Path|Receive guidance along the shortest physical route to a known destination.
Fizban's Platinum Shield|Grant a creature cover, elemental defenses and Dexterity-save protection.
Flesh to Stone|Repeated failed saves gradually turn a creature to stone.
Forbiddance|Ward a large area against planar travel and selected supernatural creatures.
Globe of Invulnerability|A protective globe blocks eligible lower-level spells from outside it.
Gravity Fissure|A line of Force damages and pulls nearby creatures inward.
Guards and Wards|Protect a building with fog, webs, locked doors and other effects.
Harm|Deal heavy Necrotic damage and reduce a creature's maximum HP.
Heal|Restore substantial HP and remove listed ailments.
Heroes' Feast|A magical meal grants lasting defensive and HP benefits.
Investiture of Flame|Gain Fire defenses, an aura and a repeatable Fire attack.
Investiture of Ice|Gain Cold defenses, icy movement benefits and a repeatable Cold attack.
Investiture of Stone|Gain physical defenses and move through earth or shake nearby ground.
Investiture of Wind|Gain flight, protection from ranged attacks and a repeatable wind blast.
Magic Jar|Place your soul in a vessel and attempt to possess another body.
Mass Suggestion|Influence several creatures to follow a suggested course of action.
Mental Prison|Psychic damage can trap a creature in a dangerous illusory enclosure.
Move Earth|Slowly reshape an area of dirt, sand or clay.
Otiluke's Freezing Sphere|A Cold explosion can be delayed and can freeze exposed water.
Otto's Irresistible Dance|Compel a creature to dance, hindering movement and combat.
Planar Ally|Ask an extraplanar being for aid and negotiate its service.
Primordial Ward|Gain elemental resistances and a brief optional immunity.
Programmed Illusion|Set a detailed illusion to play when a chosen trigger occurs.
Scatter|Teleport several creatures to valid destinations you choose.
Soul Cage|Capture a dying humanoid's soul to draw information or temporary benefits.
Summon Fiend|Summon a fiendish spirit using the spell's scaling stat block.
Sunbeam|Repeated beams of sunlight deal Radiant damage and can Blind creatures.
Tasha's Bubbling Cauldron|Conjure a cauldron that produces a limited supply of common potions.
Tasha's Otherworldly Guise|Take a supernatural form with flight, defenses and combat benefits.
Tenser's Transformation|Gain powerful weapon-combat benefits, then risk Exhaustion.
Transport via Plants|Link two large plants for instant travel.
True Seeing|Grant Truesight and reveal illusions, transformations and invisible things.
Wall of Ice|Create an ice barrier that damages creatures and leaves freezing air.
Wall of Thorns|Create a thorn barrier that damages creatures and greatly hinders passage.
Wind Walk|Turn willing creatures into fast-moving cloud forms.
Word of Recall|Teleport yourself and willing companions to a prepared sanctuary.
Conjure Celestial|Call celestial magic to aid you in combat.
Create Magen|Create a permanent magical servant of a chosen kind.
Crown of Stars|Create motes that you launch as Radiant spell attacks.
Delayed Blast Fireball|A growing Fire explosion detonates when released or disturbed.
Divine Word|A divine utterance harms or banishes creatures based on type and current HP.
Draconic Transformation|Gain dragonlike senses, flight and a recurring breath attack.
Dream of the Blue Veil|Transport sleeping creatures to another world linked to a special object.
Etherealness|Travel on the Ethereal Plane, passing ordinary physical obstacles.
Finger of Death|Deal heavy Necrotic damage; a slain humanoid can become your zombie.
Fire Storm|Place connected cubes of Fire to damage a large, shaped area.
Forcecage|Trap creatures inside a stationary magical prison.
Mirage Arcane|Alter the appearance and feel of terrain with a large-scale illusion.
Mordenkainen's Magnificent Mansion|Create an extradimensional mansion with food and magical servants.
Mordenkainen's Sword|Create a Force blade for repeated melee spell attacks.
Plane Shift|Transport a group to another plane, or attempt to banish a hostile creature.
Power Word Fortify|Distribute a large pool of Temporary HP among selected creatures.
Power Word Pain|Inflict crippling pain on a creature below the spell's HP threshold.
Prismatic Spray|Random colored rays inflict different damage or conditions.
Project Image|Send an illusory duplicate to observe and communicate at long range.
Regenerate|Restore HP over time and regrow missing body parts.
Resurrection|Restore a dead creature to life and repair many bodily injuries.
Reverse Gravity|Turn gravity upside down in an area, lifting creatures and objects.
Sequester|Hide a willing creature or object from observation and suspend its time.
Simulacrum|Create a limited duplicate of a creature from ice and snow.
Symbol|Inscribe a powerful magical trap with a selected harmful effect.
Teleport|Instantly transport creatures or an object; accuracy depends on familiarity.
Temple of the Gods|Create a protective temple with selected supernatural wards.
Tether Essence|Link two creatures so damage and healing can pass between them.
Whirlwind|Move a damaging tornado that can lift and Restrain creatures.
Abi-Dalzim's Horrid Wilting|Necrotic energy drains moisture from creatures in a large area.
Animal Shapes|Transform willing creatures into beasts; you can change their forms again.
Antimagic Field|Suppress spells and other magic within an area around you.
Antipathy/Sympathy|Make chosen creatures strongly avoid or approach a target.
Befuddlement|Psychic damage severely disrupts a creature's thinking and spellcasting.
Clone|Grow an inert duplicate body that can receive a dead creature's soul.
Control Weather|Gradually change local temperature, precipitation and wind.
Dark Star|Create a dark, crushing sphere of Force that hinders escape and sound.
Demiplane|Open a door into a small extradimensional chamber.
Dominate Monster|Charm a creature and direct its actions through a mental link.
Earthquake|Shake a large area, disrupting concentration, terrain and structures.
Feeblemind|Psychic damage can reduce a creature's Intelligence and Charisma drastically.
Glibness|Improve Charisma checks and foil magical detection of lies.
Holy Aura|Nearby allies gain save and attack defenses; some attackers risk Blindness.
Illusory Dragon|Create a terrifying shadow dragon with a repeatable breath attack.
Incendiary Cloud|A moving cloud obscures an area and deals Fire damage.
Maddening Darkness|Fill an area with magical darkness and damaging Psychic whispers.
Maze|Banish a creature into an extradimensional maze until it finds an exit.
Mighty Fortress|Create a furnished stone fortress with servants and provisions.
Mind Blank|Protect a creature from Psychic damage, charm and mental intrusion.
Power Word Stun|Stun a creature below the spell's HP threshold.
Reality Break|A distorted reality causes randomly determined harm to a creature.
Sunburst|A burst of sunlight deals Radiant damage and can Blind creatures.
Telepathy|Form a long-range mental link with a willing creature.
Tsunami|Move an enormous wave that carries and damages creatures.
Astral Projection|Send astral bodies onto the Astral Plane while physical bodies remain behind.
Blade of Disaster|Move a planar blade for powerful Force spell attacks.
Foresight|Grant extraordinary awareness, Advantage and protection from attacks.
Gate|Open a portal between planes; naming a creature can draw it through.
Imprisonment|Bind a creature using a chosen form of lasting magical confinement.
Invulnerability|Become immune to damage while concentration lasts.
Mass Heal|Distribute a large pool of healing among visible creatures.
Mass Polymorph|Transform several creatures into beasts.
Meteor Swarm|Four vast explosions deal Fire and Bludgeoning damage.
Power Word Heal|Restore a creature's HP and remove several harmful conditions.
Power Word Kill|Kill a creature below the spell's HP threshold.
Prismatic Wall|Create a multilayered barrier with distinct hazards and removal conditions.
Psychic Scream|Psychic damage can Stun several creatures; slain heads may burst.
Ravenous Void|Create a crushing gravity sphere that pulls in and destroys matter.
Shapechange|Assume powerful creature forms while retaining specified personal abilities.
Storm of Vengeance|A huge storm develops increasingly destructive effects over several rounds.
Time Ravage|Necrotic damage rapidly ages a creature and leaves it weakened.
Time Stop|Take several extra turns while time stands still for others.
True Polymorph|Transform a creature or object; extended concentration can make it lasting.
True Resurrection|Restore a long-dead creature to life, even creating a new body.
Weird|Nightmarish illusions Frighten creatures and deal Psychic damage.
Wish|Duplicate a lower-level spell or request a riskier extraordinary effect.
`.trim().split('\n').map(line=>line.split('|'))));
 Object.assign(descriptions,Object.fromEntries(`
Wardaway|Force damage can halve a target's Speed and limit its next turn.
Spellfire Flare|A Radiant ranged spell attack ignores Half and Three-Quarters Cover.
Death Armor|Improve death saves and damage nearby melee attackers with Necrotic energy.
Deryan's Helpful Homunculi|Summon magical crafting assistants that halve crafting time.
Disruptive Tune|An area melody can break Concentration and hinder maintaining it.
Dueling Ground|Create a two-person dueling area that protects its participants from death.
Elminster's Elusion|Improve saves against magic; a successful half-damage save takes no damage.
Uncertain Footing|Illusory obstacles can halve several targets' Speed and prevent Dashing.
Cacophonic Shield|A Thunder aura damages and Deafens; gain Thunder and ranged-attack defenses.
Conjure Constructs|Command spectral constructs to deal Force damage or grant Temporary HP.
Inflict Doubt|Give a creature Disadvantage on D20 Tests until it succeeds on a later save.
Laeral's Silver Lance|A long Force line damages selected creatures and can knock them Prone.
Linked Glyphs|Set one concealed glyph to trigger a magical effect at another glyph.
Syluné's Viper|Gain Temporary HP, climbing and a spectral snake's disabling spell attack.
Backlash|Reaction: reduce incoming damage and potentially strike its source with Force.
Distorted Distance|Alter an area's distances to hinder enemies or accelerate allies.
Doomtide|A movable dark fog deals Psychic damage and can penalize saves.
Festering Blast|A Necrotic line can Poison creatures, causing recurring Poison damage.
Gate Seal|Close portals and block planar travel through a stationary area.
Spellfire Storm|A Radiant pillar damages creatures and can disrupt their spellcasting.
Zone of Amicability|A social aura lets you treat low influence-check rolls as 10.
Alustriel's Mooncloak|A moonlit aura protects allies; expend it for healing or a defensive Reaction.
Grave Ground|Skeletal hands hinder enemies, dealing Necrotic damage and weakening damage rolls.
Mordenkainen's Lucubration|Recover up to two expended spell slots of level 2 or lower.
Songal's Elemental Suffusion|Gain elemental Resistance, flight and recurring elemental bursts.
Spirit Lantern|Capture soul fragments from dying enemies and spend them for magical effects.
Summon Plant|Summon a plant spirit using the spell's scaling stat block.
Waves of Exhaustion|Repeated cones can add temporary Exhaustion, limited to level 4.
Dirge|A deathly aura prevents healing, deals Necrotic damage and hinders movement.
Elminster's Effulgent Spheres|Spend orbiting spheres on elemental attacks or defensive Reactions.
Summon Dinosaur|Summon a dinosaur spirit using the spell's scaling stat block.
Aura of Evasion|Nearby allies gain Dexterity-save Advantage and reduced save-based damage.
Fractured Awareness|Heavy Psychic damage can give a target Disadvantage on D20 Tests.
Reweave Fate|Reaction: reroll a failed D20 Test with Advantage; success grants Temporary HP.
Simbul's Synostodweomer|Let a creature spend Hit Dice to heal when it expends spell slots.
Transfix|Charm and Incapacitate a creature, drawing it toward you for Psychic harm.
Entrancing Mirrors|Illusory mirrors deal Psychic damage and can Stun and slow targets.
Holy Star of Mystra|Gain substantial cover, a repeatable Force/Radiant bolt and spell reflection.
Iron Body|Transform a willing creature into metal with extensive defenses.
Lightning Ring|A Lightning and Thunder aura can Deafen; also project a damaging line.
Moment of Prescience|Reaction: turn your failed D20 roll into 20 or an incoming attack roll into 1.
Detonate|Explode a creature with Fire damage, then damage a vast area around it.
Hindsight|Observe visions of local events from the past ten years.
Vision of Elapsing Eons|An aging illusion deals Psychic damage and can Paralyze and Exhaust a target.
Wail of the Banshee|A lethal scream kills low-HP targets or deals Psychic damage and Deafens.
`.trim().split('\n').map(line=>line.split('|'))));
 const revised={
  'Blade Ward':'Attackers subtract 1d4 from attack rolls against you while the spell lasts.',
  Resistance:'Choose a damage type; reduce that damage by 1d4, at most once per turn.',
  Friends:'A humanoid can be Charmed on a failed WIS save; it later knows it was charmed.',
  'True Strike':'Make a weapon attack using your spellcasting ability; damage may be Radiant.',
  Guidance:'Choose one skill; the target adds 1d4 to checks using it while the spell lasts.',
  Sleep:'WIS saves can first Incapacitate, then put creatures to sleep.',
  Counterspell:'Reaction: interrupt a spell on a failed CON save; its spell slot is not spent.',
  'Conjure Animals':'Move a spectral pack that deals Slashing damage to nearby enemies.',
  'Conjure Minor Elementals':'Your aura adds elemental damage to your hits and hinders enemy movement.',
  'Conjure Woodland Beings':'A Force aura damages enemies; you can Disengage as a Bonus Action.',
  'Conjure Elemental':'An elemental spirit deals elemental damage and can Restrain a nearby creature.',
  'Conjure Fey':'A movable fey spirit makes Psychic spell attacks that can Frighten targets.',
  'Conjure Celestial':'Move a pillar of light that heals allies or deals Radiant damage.',
  Barkskin:'Give a willing creature AC 17 if its AC would otherwise be lower.',
  'Inflict Wounds':'Touch: 2d10 Necrotic damage; CON save halves damage.',
  'Giant Insect':'Summon a giant centipede, spider or wasp using the spell\'s stat block.'
 };
 const legacy={
  'Blade Ward':'Resist weapon-attack Bludgeoning, Piercing and Slashing until your next turn ends.',
  Resistance:'A willing creature can add 1d4 to one saving throw before the spell ends.',
  Friends:'Gain Advantage on Charisma checks toward one creature; it later becomes hostile.',
  'True Strike':'Gain Advantage on your first attack against the target on your next turn.',
  Guidance:'A willing creature can add 1d4 to one ability check before the spell ends.',
  Sleep:'Roll an HP pool to put eligible creatures into magical sleep, weakest first.',
  Counterspell:'Reaction: stop a spell of level 3 or lower; higher levels may require a check.',
  'Conjure Animals':'Summon beasts that act as a group and obey your verbal commands.',
  'Conjure Minor Elementals':'Summon elementals; their number depends on the chosen challenge rating.',
  'Conjure Woodland Beings':'Summon fey; their number depends on the chosen challenge rating.',
  'Conjure Elemental':'Summon an elemental; losing concentration can free it from your control.',
  'Conjure Fey':'Summon a fey or fey beast; losing concentration can free it from your control.',
  'Conjure Celestial':'Summon a celestial ally that obeys your verbal commands.',
  Barkskin:'Give a willing creature an AC floor of 16, regardless of worn armor.',
  'Inflict Wounds':'Melee spell attack: deal 3d10 Necrotic damage on a hit.'
 };
 const nameOf=s=>String(s?.name||'').replace(/\s*\[(?:2014|2024)\]\s*$/,'');
 function get(spell){const name=nameOf(spell),edition=spell?.edition||(/\[(2024)\]/.test(spell?.name||'')?'2024':'2014');const variants=edition==='2024'?revised:legacy;return Object.hasOwn(variants,name)?variants[name]:Object.hasOwn(descriptions,name)?descriptions[name]:'';}
 function forRow(spell,catalog){const own=String(spell?.shortDescription||'').trim();if(own)return own;const text=get(catalog||spell);if(text)return text;const notes=String(spell?.notes||'').trim().replace(/\s+/g,' ');return notes?notes.length<=130?notes:notes.slice(0,127).replace(/\s+\S*$/,'')+'…':'Personal spell; add a short description.';}
 const schools={Abjuration:'Abj.',Conjuration:'Conj.',Divination:'Div.',Enchantment:'Ench.',Evocation:'Evoc.',Illusion:'Ill.',Necromancy:'Necro.',Transmutation:'Trans.'};
 function compact(key,value){const text=String(value??'');if(key==='school')return Object.hasOwn(schools,text)?schools[text]:text;if(key==='save')return text.replace(/STRENGTH/gi,'STR').replace(/DEXTERITY/gi,'DEX').replace(/CONSTITUTION/gi,'CON').replace(/INTELLIGENCE/gi,'INT').replace(/WISDOM/gi,'WIS').replace(/CHARISMA/gi,'CHA');if(key==='time')return text.split(' — ')[0].replace(/^1 bonus action$/i,'Bonus').replace(/^1 reaction$/i,'React.').replace(/^1 action$/i,'Action').replace(/minutes?/gi,'min').replace(/hours?/gi,'hr');if(['duration','range'].includes(key))return text.replace(/Concentration,\s*/gi,'C: ').replace(/feet/gi,'ft').replace(/minutes?/gi,'min').replace(/hours?/gi,'hr').replace(/instant(?:aneous)?/gi,'Instant').replace(/self/gi,'Self').replace(/touch/gi,'Touch');return text;}
 const levelLabel=level=>!Number(level)?'Cantrips':level===1?'1st-level spells':level===2?'2nd-level spells':level===3?'3rd-level spells':level+'th-level spells';
 return{get,forRow,compact,levelLabel,descriptions,revised,legacy};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterSpellSummaries=CharacterSpellSummaries;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSpellSummaries;
