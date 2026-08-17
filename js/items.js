export const items = [

/*    {
    id: " ",

    name: " ",

    classes: [" "],

    rarity: " ",

    category: " ",

    attunement: true,

    source: " ",

    campaign: " ",

    owner: null,

    printed: false,

    receivedDate: null,

    image: " ",

    description:
        " ",

    quote:
        " ",

    properties: [
        {
            title: " ",
            text:
                " "
        },

        {
            title: " ",
            text:
                " "
        },

        {
            title: " ",
            text:
                " "
        }
    ]
},*/
// ═══════════════════════════════════════════════════════════════════════════
// D&D 5e MAGIC ITEMS - COMPLETE REMAINING SOURCEBOOKS
// Combines Part 1, Part 2, and Part 3 into one export
//
// Sources covered in this file:
// - Icewind Dale: Rime of the Frostmaiden
// - Baldur's Gate: Descent into Avernus
// - Explorer's Guide to Wildemount (incl. Vestiges of Divergence)
// - Mythic Odysseys of Theros
// - The Wild Beyond the Witchlight
// - Strixhaven: A Curriculum of Chaos
// - Spelljammer: Adventures in Space
// - Van Richten's Guide to Ravenloft
// - Waterdeep: Dragon Heist
// - Waterdeep: Dungeon of the Mad Mage
// - Ghosts of Saltmarsh
// - Storm King's Thunder
// - Tomb of Annihilation
// - Guildmasters' Guide to Ravnica
// - Out of the Abyss
// - Princes of the Apocalypse
// - Planescape: Adventures in the Multiverse
// - Critical Role: Call of the Netherdeep
// - Tales from the Yawning Portal
// - Mordenkainen's Tome of Foes
// - Mordenkainen Presents: Monsters of the Multiverse
// - Phandelver and Below: The Shattered Obelisk
// - Candlekeep Mysteries
// - Dragonlance: Shadow of the Dragon Queen
// - Journeys through the Radiant Citadel
// - Keys from the Golden Vault
// - The Book of Many Things
// - Sword Coast Adventurer's Guide
// - Eberron: Rising from the Last War
// - Acquisitions Incorporated
// - Bigby Presents: Glory of the Giants
// - Additional DMG artifacts (Hand/Eye of Vecna, Blackrazor, Wave, Whelm, Sword of Kas)
// - Moonblade, Staff of the Woodlands
// - Additional +1/+2/+3 armor and weapon variants
// - Tasha's tiered items (rare/very rare versions)
// - Fizban's additional items
// ═══════════════════════════════════════════════════════════════════════════
  // ─── SWORD COAST ADVENTURER'S GUIDE ──────────────────────────────────────
  // ─── MINSC AND BOO'S JOURNAL OF VILLAINY ─────────────────────────────────
  {
    id: "baldurs-gate-encounter-armor",
    name: "Armor of the Fallen",
    classes: [],
    rarity: "Rare",
    category: "Armor",
    attunement: true,
    source: "Minsc and Boo's Journal of Villainy",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/armor-of-the-fallen.png",
    description: "This dark armor is inscribed with the names of fallen warriors and radiates a cold, grim energy.",
    properties: [
      { title: "AC Bonus", text: "You gain a +1 bonus to AC while wearing this armor." },
      { title: "Death's Ward", text: "When you are reduced to 0 hit points while wearing this armor, you can use your reaction to drop to 1 hit point instead. Once used, this property can't be used again until the next dawn." }
    ]
  },
 
  {
    id: "boos-hamster-ball",
    name: "Boo's Magical Miniature Giant Space Hamster Ball",
    classes: [],
    rarity: "Legendary",
    category: "Wondrous Item",
    attunement: false,
    source: "Minsc and Boo's Journal of Villainy",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/boos-hamster-ball.png",
    description: "A shimmering crystalline sphere just large enough to contain one miniature giant space hamster. The ball rolls of its own accord toward danger.",
    properties: [
      { title: "Hamster Power", text: "While holding this ball, you can use a bonus action to roll it at a creature within 30 feet. Make a ranged attack roll (+7 to hit). On a hit, the creature takes 4d6 bludgeoning damage and must succeed on a DC 15 Strength saving throw or be knocked prone." },
      { title: "Boo's Rage", text: "Once per day, the hamster ball can be activated to grant you the benefits of the barbarian's Rage feature for 1 minute, even if you are not a barbarian." }
    ]
  },
 
  {
    id: "minscs-sword",
    name: "Minsc's Blade, Lilarcor",
    classes: [],
    rarity: "Legendary",
    category: "Weapon",
    attunement: true,
    source: "Minsc and Boo's Journal of Villainy",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/lilarcor.png",
    description: "This enchanted two-handed sword belonged to the hero Minsc and is sentient, speaking loudly and boisterously.",
    properties: [
      { title: "Attack Bonus", text: "+3 bonus to attack and damage rolls made with this magic weapon." },
      { title: "Buttkicker", text: "When you hit a creature with this sword, it takes an extra 2d6 slashing damage. When you score a critical hit, the creature is also knocked prone." },
      { title: "Sentience", text: "Chaotic good, Intelligence 6, Wisdom 6, Charisma 13. The sword can speak and shout in Common at any volume. It constantly encourages its wielder to 'go for the eyes' and kick evil in the butt." },
      { title: "Magic Resistance", text: "While attuned to this sword, you have advantage on saving throws against spells and other magical effects." }
    ]
  },
 
  {
    id: "volo-staff",
    name: "Volo's Staff of Many Pens",
    classes: [],
    rarity: "Uncommon",
    category: "Staff",
    attunement: false,
    source: "Minsc and Boo's Journal of Villainy",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/volos-staff-of-many-pens.png",
    description: "This staff is decorated with quill feathers and smells faintly of ink. It belonged to the famous traveler and writer Volo.",
    properties: [
      { title: "Scribing", text: "While holding this staff, you can write at incredible speed — up to 250 words per minute with perfect penmanship. The staff never runs out of ink." },
      { title: "Compendium", text: "As an action, tap the staff on a surface to produce a blank book of 200 pages. Once used, this property can't be used again for 7 days." },
      { title: "Knowledge", text: "While holding this staff, you have advantage on Intelligence (History) checks related to locations, people, or monsters." }
    ]
  },
 
  {
    id: "jaheira-druidstaff",
    name: "Staff of the High Harpers",
    classes: ["Druid", "Bard"],
    rarity: "Very Rare",
    category: "Staff",
    attunement: true,
    source: "Minsc and Boo's Journal of Villainy",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/staff-of-the-high-harpers.png",
    description: "A staff carved from sacred druidic oak and inscribed with Harper symbols. It hums softly with nature magic.",
    properties: [
      { title: "Spellcasting Focus", text: "You can use this staff as a spellcasting focus for your druid and bard spells." },
      { title: "Nature Spells", text: "The staff has 10 charges and regains 1d6 + 4 charges daily at dawn. Cast: speak with animals (1), plant growth (3), call lightning (3), control weather (8)." },
      { title: "Harper Network", text: "While holding this staff, you can send a message to any Harper agent within 100 miles as per the sending spell, once per day." }
    ]
  },
 
  {
    id: "stone-of-the-iron-throne",
    name: "Stone of the Iron Throne",
    classes: [],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "Minsc and Boo's Journal of Villainy",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/stone-of-the-iron-throne.png",
    description: "A smooth black stone that radiates cold authority. It was once used by members of the Iron Throne mercantile consortium.",
    properties: [
      { title: "Authority", text: "While holding this stone, you have advantage on Charisma (Intimidation) checks against any creature that is not immune to being frightened." },
      { title: "Command", text: "As an action, you can cast the command spell (save DC 15) from the stone. Once used, this property can't be used again until the next dawn." },
      { title: "Network", text: "While attuned to the stone, you can communicate telepathically with any other creature attuned to a Stone of the Iron Throne within 1 mile." }
    ]
  },
 
  {
    id: "dead-three-amulet",
    name: "Amulet of the Dead Three",
    classes: [],
    rarity: "Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "Minsc and Boo's Journal of Villainy",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/amulet-of-the-dead-three.png",
    description: "This amulet bears the combined symbols of Bane, Bhaal, and Myrkul — the Dead Three. It radiates a palpable aura of dread.",
    properties: [
      { title: "Dread Aura", text: "While wearing this amulet, you emanate an aura of dread in a 10-foot radius. Creatures of your choice in the aura must succeed on a DC 14 Wisdom saving throw at the start of their turn or be frightened of you until the start of their next turn." },
      { title: "Dead Three's Gift", text: "Once per day, you can call upon one of the Dead Three for power: Bane (advantage on all attack rolls for 1 minute), Bhaal (your attacks deal an extra 2d6 necrotic damage for 1 minute), or Myrkul (cast speak with dead without components)." }
    ]
  },
 
  // ─── DOMAINS OF DELIGHT ───────────────────────────────────────────────────
 
  {
    id: "archfey-token",
    name: "Archfey's Token",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: false,
    source: "Domains of Delight",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/archfey-token.png",
    description: "A small token — often a pressed flower, a smooth river stone, or a carved acorn — given as a gift by an archfey. It carries a fragment of the archfey's power.",
    properties: [
      { title: "Archfey's Favor", text: "While carrying this token, you have advantage on Charisma checks made to interact with fey creatures. Fey creatures of CR 5 or lower are initially indifferent toward you rather than hostile." },
      { title: "Safe Passage", text: "While carrying this token within the domain of the archfey who gave it, you can't become lost by nonmagical means." }
    ]
  },
 
  {
    id: "crown-of-the-archfey",
    name: "Crown of the Archfey",
    classes: [],
    rarity: "Legendary",
    category: "Wondrous Item",
    attunement: true,
    source: "Domains of Delight",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/crown-of-the-archfey.png",
    description: "This crown of woven silver branches set with glittering moonstone marks the ruler of a Feywild domain.",
    properties: [
      { title: "Domain Control", text: "While wearing this crown within the domain it governs, you have absolute authority over the domain's natural features. You can reshape terrain, control weather, and communicate with any creature in the domain telepathically." },
      { title: "Fey Charm", text: "While wearing this crown, you have advantage on all Charisma checks, and creatures that can see you must succeed on a DC 18 Wisdom saving throw or be charmed by you for 1 hour." },
      { title: "Timeless", text: "While wearing this crown, you don't age and are immune to the effects of time-altering magic." }
    ]
  },
 
  {
    id: "feywild-gift-boon",
    name: "Feywild Boon (Charm)",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: true,
    source: "Domains of Delight",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/feywild-boon.png",
    description: "A magical gift bestowed by a powerful fey creature, manifesting as a small charm or trinket. Each boon is unique.",
    properties: [
      { title: "Fey Blessing", text: "This charm grants one of the following boons determined when it is found: advantage on one type of ability check, resistance to one damage type, the ability to cast one cantrip at will, or a +1 bonus to one ability score." },
      { title: "Fey Connection", text: "While attuned, you can sense the presence of portals to the Feywild within 1 mile of you." }
    ]
  },
 
  {
    id: "thorned-armor",
    name: "Thorned Armor",
    classes: [],
    rarity: "Rare",
    category: "Armor",
    attunement: true,
    source: "Domains of Delight",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/thorned-armor.png",
    description: "This leather armor is studded with long, wickedly sharp thorns of enchanted wood that grow from the surface.",
    properties: [
      { title: "AC Bonus", text: "+1 bonus to AC while wearing this armor." },
      { title: "Thorn Retaliation", text: "When a creature hits you with a melee attack while you wear this armor, it takes 1d6 piercing damage from the thorns." },
      { title: "Entangle", text: "As an action, you can cause thorny vines to erupt from the ground in a 10-foot radius centered on you. The area becomes difficult terrain until the start of your next turn, and creatures in the area must succeed on a DC 14 Strength saving throw or be restrained until the end of their next turn. Once used, this property can't be used again until the next dawn." }
    ]
  },
 
  {
    id: "mirror-of-the-feywild",
    name: "Mirror of the Feywild",
    classes: [],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: false,
    source: "Domains of Delight",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/mirror-of-the-feywild.png",
    description: "This ornate silver mirror shows not the viewer's reflection but instead scenes from the Feywild.",
    properties: [
      { title: "Feywild Vision", text: "As an action, gaze into the mirror to see a random scene from the Feywild. The DM chooses what you see. You can ask the mirror a yes-or-no question about the Feywild, and it answers by showing you a relevant scene. Three uses per day." },
      { title: "Portal", text: "Once per week, you can use the mirror as a portal to the Feywild. You and up to five willing creatures you can see step through the mirror's surface and emerge at a random location in the Feywild. The mirror closes behind you." }
    ]
  },
 
  {
    id: "song-of-the-wild",
    name: "Song of the Wild",
    classes: ["Bard", "Druid"],
    rarity: "Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "Domains of Delight",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/song-of-the-wild.png",
    description: "This small crystal vial contains an iridescent liquid that hums with captured fey music.",
    properties: [
      { title: "Fey Melody", text: "As an action, you can open the vial and release the song inside. All creatures within 30 feet that can hear must make a DC 14 Wisdom saving throw. On a failure, they are charmed by you for 1 minute and must use their movement to dance on their turn. Once used, the vial is empty for 7 days before refilling." },
      { title: "Inspiration", text: "While carrying this vial, when you finish a short rest you regain one expended use of Bardic Inspiration." }
    ]
  },
 
  // ─── HEROES OF KRYNN / DRAGONLANCE PLAYER OPTIONS ────────────────────────
 
  {
    id: "kender-hoodak",
    name: "Kender's Houdak",
    classes: [],
    rarity: "Common",
    category: "Wondrous Item",
    attunement: false,
    source: "Heroes of Krynn",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/kenders-houdak.png",
    description: "A kender's hoopak is a signature weapon — a staff with a sling at one end and a spike at the other. The magical version is imbued with kender luck.",
    properties: [
      { title: "Kender Luck", text: "When you make an attack roll with this weapon and miss, you can reroll the attack roll. You must use the new result. Once used, this property can't be used again until you finish a short or long rest." },
      { title: "Dual Purpose", text: "This weapon functions as both a quarterstaff and a sling, allowing it to make melee or ranged attacks. It has the thrown property (range 30/120 ft.) when used as a sling." }
    ]
  },
 
  {
    id: "medallion-of-faith",
    name: "Medallion of Faith",
    classes: ["Cleric", "Paladin"],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: true,
    source: "Heroes of Krynn",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/medallion-of-faith.png",
    description: "This medallion bears the symbol of one of Krynn's gods. It is the mark of a true cleric on Krynn, granting them divine power.",
    properties: [
      { title: "Holy Symbol", text: "You can use this medallion as a holy symbol and spellcasting focus for your cleric or paladin spells." },
      { title: "Divine Connection", text: "While wearing this medallion, you gain a +1 bonus to spell attack rolls and to the saving throw DCs of your cleric or paladin spells." },
      { title: "God's Favor", text: "Once per day, when you make a saving throw, you can invoke your deity's name to gain advantage on the roll." }
    ]
  },
 
  {
    id: "solamnic-plate",
    name: "Solamnic Plate",
    classes: [],
    rarity: "Rare",
    category: "Armor",
    attunement: true,
    source: "Heroes of Krynn",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/solamnic-plate.png",
    description: "This gleaming plate armor bears the rose-and-sword insignia of the Knights of Solamnia and has been blessed by the gods of Good.",
    properties: [
      { title: "Knightly Defense", text: "While wearing this armor, you gain a +1 bonus to AC." },
      { title: "Inspire Allies", text: "While wearing this armor, friendly creatures within 30 feet of you that can see you have advantage on saving throws against being frightened." },
      { title: "Oath of Devotion", text: "While wearing this armor, you have advantage on saving throws against spells and effects that would compel you to act against your alignment." }
    ]
  },
 
  {
    id: "dragonlance-orb",
    name: "Dragon Orb of Krynn",
    classes: [],
    rarity: "Artifact",
    category: "Wondrous Item",
    attunement: true,
    source: "Heroes of Krynn",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/dragon-orb-of-krynn.png",
    description: "One of five Dragon Orbs created during the Third Dragon War, these artifacts can control dragons.",
    properties: [
      { title: "Dragon Control", text: "As an action, you can attempt to control a dragon within 120 feet. The dragon must succeed on a DC 20 Charisma saving throw or be charmed by you for 1 hour. While charmed, the dragon obeys your commands. Once used, can't be used again for 24 hours." },
      { title: "Dragon Lure", text: "While attuned, you can sense the presence of any dragon within 10 miles. You can also communicate telepathically with any dragon within 1 mile." },
      { title: "Dangerous Attunement", text: "Each time you use the orb to control a dragon, roll a DC 15 Wisdom saving throw. On a failure, the orb attempts to control you instead, compelling you to serve its true draconic masters." }
    ]
  },
 
  {
    id: "tower-shield-of-the-crown",
    name: "Tower Shield of the Crown",
    classes: [],
    rarity: "Rare",
    category: "Armor",
    attunement: false,
    source: "Heroes of Krynn",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/tower-shield-of-the-crown.png",
    description: "A massive tower shield bearing the crown insignia of a Knight of the Crown.",
    properties: [
      { title: "Heavy Shield", text: "While holding this shield, you have a +2 bonus to AC in addition to the shield's normal bonus. However, your speed is reduced by 5 feet." },
      { title: "Shield Wall", text: "While holding this shield adjacent to another creature holding any shield, you both gain an additional +1 bonus to AC." }
    ]
  },
 
  {
    id: "black-robe",
    name: "Black Robe of the Orders",
    classes: ["Wizard"],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "Heroes of Krynn",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/black-robe-of-the-orders.png",
    description: "This black silk robe is worn by wizards of the Order of the Black Robes on Krynn, followers of Nuitari.",
    properties: [
      { title: "Arcane Bonus", text: "While wearing this robe, you gain a +2 bonus to spell attack rolls and to the saving throw DCs of your wizard spells." },
      { title: "Dark Magic", text: "Once per day when you cast a wizard spell that deals damage, you can maximize the damage instead of rolling." },
      { title: "Moon Magic", text: "During a new moon, the bonus from this robe increases to +3, and your spell save DC increases by an additional 1." }
    ]
  },
 
  {
    id: "red-robe",
    name: "Red Robe of the Orders",
    classes: ["Wizard"],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "Heroes of Krynn",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/red-robe-of-the-orders.png",
    description: "This red silk robe is worn by wizards of the Order of the Red Robes on Krynn, followers of Lunitari.",
    properties: [
      { title: "Arcane Bonus", text: "While wearing this robe, you gain a +2 bonus to spell attack rolls and to the saving throw DCs of your wizard spells." },
      { title: "Balanced Magic", text: "Once per day, when you fail a concentration check, you can choose to succeed instead." },
      { title: "Moon Magic", text: "During a half moon, the bonus from this robe increases to +3, and you regain one expended spell slot of 3rd level or lower at dawn." }
    ]
  },
 
  {
    id: "white-robe",
    name: "White Robe of the Orders",
    classes: ["Wizard"],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "Heroes of Krynn",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/white-robe-of-the-orders.png",
    description: "This white silk robe is worn by wizards of the Order of the White Robes on Krynn, followers of Solinari.",
    properties: [
      { title: "Arcane Bonus", text: "While wearing this robe, you gain a +2 bonus to spell attack rolls and to the saving throw DCs of your wizard spells." },
      { title: "Protective Magic", text: "While wearing this robe, you and friendly creatures within 10 feet have advantage on saving throws against spells." },
      { title: "Moon Magic", text: "During a full moon, the bonus from this robe increases to +3, and you can cast one additional spell of 3rd level or lower without expending a spell slot." }
    ]
  },
 
  // ─── THE PRACTICALLY COMPLETE GUIDE TO DRAGONS ───────────────────────────
 
  {
    id: "dragonscale-cloak",
    name: "Dragonscale Cloak",
    classes: [],
    rarity: "Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "The Practically Complete Guide to Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/dragonscale-cloak.png",
    description: "A cloak fashioned from the scales of a dragon, retaining some of the dragon's innate magical energy.",
    properties: [
      { title: "Elemental Resistance", text: "You have resistance to the damage type associated with the dragon whose scales form the cloak: acid (black/green), cold (white/silver), fire (red/gold/brass), lightning (blue/bronze), or poison (green)." },
      { title: "Draconic Presence", text: "While wearing this cloak, dragons of the same type as the cloak treat you with initial respect rather than immediate hostility." }
    ]
  },
 
  {
    id: "scale-of-the-ancient",
    name: "Scale of the Ancient",
    classes: [],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "The Practically Complete Guide to Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/scale-of-the-ancient.png",
    description: "This single scale from an ancient dragon pulses with tremendous magical energy.",
    properties: [
      { title: "Elemental Immunity", text: "You have immunity to the damage type associated with the dragon this scale came from." },
      { title: "Dragon Speech", text: "While holding this scale, you can speak and understand Draconic." },
      { title: "Ancient Power", text: "Once per day, you can use an action to breathe a line or cone of elemental energy matching the scale's dragon type. The breath weapon extends 60 feet and deals 10d6 damage of the associated type (DC 17 Dexterity save for half)." }
    ]
  },
 
  {
    id: "dragon-tooth-weapon",
    name: "Dragon Tooth Weapon",
    classes: [],
    rarity: "Uncommon",
    category: "Weapon",
    attunement: false,
    source: "The Practically Complete Guide to Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/dragon-tooth-weapon.png",
    description: "A weapon crafted from or with a dragon's tooth, retaining some of the dragon's elemental power.",
    properties: [
      { title: "Attack Bonus", text: "+1 bonus to attack and damage rolls." },
      { title: "Elemental Strike", text: "When you hit a creature with this weapon, you can choose to deal an extra 1d6 damage of the type associated with the dragon (acid, cold, fire, lightning, or poison). Once used, this property can't be used again until the next dawn." }
    ]
  },
 
  {
    id: "wyrmling-egg-charm",
    name: "Wyrmling Egg Charm",
    classes: [],
    rarity: "Common",
    category: "Wondrous Item",
    attunement: false,
    source: "The Practically Complete Guide to Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/wyrmling-egg-charm.png",
    description: "A charm carved from the shell of a dragon egg. It carries a faint echo of draconic magic.",
    properties: [
      { title: "Draconic Luck", text: "Once per day, when you make an ability check, attack roll, or saving throw, you can add 1d4 to the result after seeing the roll but before the outcome is determined." }
    ]
  },
 
  {
    id: "dragon-blood-potion",
    name: "Potion of Dragon Blood",
    classes: [],
    rarity: "Rare",
    category: "Potion",
    attunement: false,
    source: "The Practically Complete Guide to Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/potion-of-dragon-blood.png",
    description: "This vial contains a few drops of dragon blood mixed with magical reagents. It glows faintly with the color of the associated dragon type.",
    properties: [
      { title: "Dragon's Gift", text: "When you drink this potion, you gain resistance to one damage type based on the dragon whose blood was used (acid, cold, fire, lightning, or poison) for 1 hour. Additionally, your unarmed strikes deal an extra 1d6 damage of that type for the same duration." }
    ]
  },
 
  {
    id: "chronicle-of-the-reckoning",
    name: "Chronicle of the Reckoning",
    classes: [],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "The Practically Complete Guide to Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/chronicle-of-the-reckoning.png",
    description: "This ancient tome contains records of every known dragon on the Material Plane. Its pages seem to update themselves.",
    properties: [
      { title: "Dragon Lore", text: "While attuned to this book, you know the name, approximate location, and general disposition of every dragon on the plane you currently occupy. You have advantage on Intelligence checks related to dragons." },
      { title: "Dragon Sense", text: "You can sense the presence of any dragon within 10 miles. As an action, you can concentrate on the book to pinpoint the exact location of any dragon you know the name of within 100 miles." }
    ]
  },
 
  // ─── GLORY OF THE GIANTS – ADDITIONAL PLAYER ITEMS ───────────────────────
 
  {
    id: "giants-ring",
    name: "Ring of Giant Influence",
    classes: [],
    rarity: "Rare",
    category: "Ring",
    attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/ring-of-giant-influence.png",
    description: "This oversized ring is made from the melted metal of a giant's weapon and fits any finger when worn.",
    properties: [
      { title: "Giant Speech", text: "While wearing this ring, you can speak, read, and write Giant." },
      { title: "Giant Diplomacy", text: "While wearing this ring, you have advantage on Charisma checks made to interact with giants of any kind." },
      { title: "Enlarging Power", text: "Once per day, you can cast the enlarge/reduce spell (enlarge only) on yourself without using a spell slot." }
    ]
  },
 
  {
    id: "rune-shield",
    name: "Rune Shield",
    classes: [],
    rarity: "Rare",
    category: "Armor",
    attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/rune-shield.png",
    description: "This shield is inscribed with a giant rune that glows faintly when danger is near.",
    properties: [
      { title: "AC Bonus", text: "+1 bonus to AC while wielding this shield, in addition to the shield's normal bonus." },
      { title: "Runic Ward", text: "When you are hit by an attack, you can use your reaction to expend 1 charge and add your proficiency bonus to your AC against that attack, potentially causing it to miss. The shield has 3 charges and regains 1d3 charges daily at dawn." }
    ]
  },
 
  {
    id: "potion-of-giant-size",
    name: "Potion of Giant Size",
    classes: [],
    rarity: "Legendary",
    category: "Potion",
    attunement: false,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/potion-of-giant-size.png",
    description: "When you drink this potion, you grow to Huge size for 24 hours.",
    properties: [
      { title: "Giant Growth", text: "When you drink this potion, you grow to Huge size for 24 hours. Your Strength score becomes 25 (unless it is already higher). Your weapons also grow to match, and your weapon attacks deal an extra 2d6 damage of the same type. Your space and reach double." }
    ]
  },
 
  {
    id: "giant-rune-focus",
    name: "Giant Rune Focus",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/giant-rune-focus.png",
    description: "A carved stone disc etched with a giant rune that can serve as a spellcasting focus.",
    properties: [
      { title: "Spellcasting Focus", text: "You can use this disc as a spellcasting focus for your spells." },
      { title: "Rune Power", text: "Once per day, when you cast a spell that deals damage, you can change the damage type to one of the following: acid, cold, fire, lightning, or thunder." }
    ]
  },
 
  {
    id: "thunderous-greatclub",
    name: "Thunderous Greatclub",
    classes: [],
    rarity: "Rare",
    category: "Weapon",
    attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/thunderous-greatclub.png",
    description: "This massive greatclub is carved from the wood of a tree struck by lightning a hundred times. It crackles with electrical energy.",
    properties: [
      { title: "Attack Bonus", text: "+1 bonus to attack and damage rolls." },
      { title: "Thunder Crack", text: "On a hit, the target takes an extra 1d8 thunder damage." },
      { title: "Ground Slam", text: "As an action, you can slam the greatclub into the ground. Each creature within 10 feet must make a DC 14 Strength saving throw or be knocked prone and take 2d8 thunder damage. On a success, the creature takes half damage and isn't knocked prone. Once used, this property can't be used again until the next dawn." }
    ]
  },
 
  {
    id: "hill-giant-bag",
    name: "Hill Giant's Sack",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: false,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/hill-giants-sack.png",
    description: "This enormous sack was made for a hill giant but has been magically resized for smaller creatures.",
    properties: [
      { title: "Giant Capacity", text: "This bag can hold up to 1,000 pounds of material not exceeding a volume of 128 cubic feet. The bag weighs 25 pounds, regardless of its contents. If the bag is overloaded, pierced, or torn, it ruptures and is destroyed, and its contents are scattered." }
    ]
  },
 
  // ─── VECNA: EVE OF RUIN (2024) ────────────────────────────────────────────
 
  {
    id: "vecna-rod",
    name: "Rod of Seven Parts",
    classes: [],
    rarity: "Artifact",
    category: "Rod",
    attunement: true,
    source: "Vecna: Eve of Ruin",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/rod-of-seven-parts.png",
    description: "The Rod of Seven Parts was shattered in a battle between the Wind Dukes of Aaqa and the Queen of Chaos. Its seven pieces were scattered across the multiverse.",
    properties: [
      { title: "Piece Power", text: "Each piece of the rod, when found, grants a +1 bonus to AC and saving throws. For each additional piece added, the bonus increases by 1 (maximum +7 when all pieces are assembled)." },
      { title: "Wind Walk", text: "When all seven pieces are assembled, you can cast the wind walk spell once per day without using a spell slot." },
      { title: "Imprisonment", text: "When all seven pieces are assembled, you can cast the imprisonment spell once per week without using a spell slot or material components." }
    ]
  },
 
  {
    id: "vecnas-spellbook",
    name: "Vecna's Fallen Leaves",
    classes: ["Wizard"],
    rarity: "Artifact",
    category: "Wondrous Item",
    attunement: true,
    source: "Vecna: Eve of Ruin",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/vecnas-fallen-leaves.png",
    description: "These pages torn from Vecna's personal spellbook contain some of the most powerful and dangerous spells ever recorded.",
    properties: [
      { title: "Forbidden Knowledge", text: "These pages contain 2d6 spells of 6th level or higher chosen by the DM, all from Vecna's personal collection. You can copy these spells into your own spellbook." },
      { title: "Vecna's Influence", text: "While attuned to these pages, you gain a +2 bonus to spell attack rolls and spell save DCs. However, Vecna can read your thoughts and knows your location at all times." },
      { title: "Dark Secrets", text: "Once per day, you can consult the pages to gain advantage on one Intelligence check related to forbidden or secret knowledge." }
    ]
  },
 
  // ─── ADDITIONAL ITEMS FROM PREVIOUSLY COVERED BOOKS ──────────────────────
 
  {
    id: "potion-of-vitality",
    name: "Potion of Vitality",
    classes: [],
    rarity: "Very Rare",
    category: "Potion",
    attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/potion-of-vitality.png",
    description: "When you drink this potion, it removes any exhaustion you are suffering and cures any disease or poison affecting you.",
    properties: [
      { title: "Vitality", text: "When you drink this potion, it removes any exhaustion you are suffering and cures any disease or poison affecting you. For the next 24 hours, you regain the maximum number of hit points for any Hit Die you spend." }
    ]
  },
 
  {
    id: "oil-of-etherealness",
    name: "Oil of Etherealness",
    classes: [],
    rarity: "Rare",
    category: "Potion",
    attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/oil-of-etherealness.png",
    description: "Beads of this cloudy gray oil form on the outside of its container and quickly evaporate.",
    properties: [
      { title: "Ethereal", text: "You can use the oil to cover a Medium or smaller creature. Applying the oil takes 10 minutes. The affected creature then gains the effect of the etherealness spell for 1 hour." }
    ]
  },
 
  {
    id: "oil-of-sharpness",
    name: "Oil of Sharpness",
    classes: [],
    rarity: "Very Rare",
    category: "Potion",
    attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/oil-of-sharpness.png",
    description: "This clear, gelatinous oil sparkles with tiny, ultrathin silver shards.",
    properties: [
      { title: "Sharpen", text: "You can use the oil to cover a slashing or piercing weapon or up to 5 pieces of slashing or piercing ammunition. Applying the oil takes 1 minute. For 1 hour, the coated item is magical and has a +3 bonus to attack and damage rolls." }
    ]
  },
 
  {
    id: "oil-of-slipperiness",
    name: "Oil of Slipperiness",
    classes: [],
    rarity: "Uncommon",
    category: "Potion",
    attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/oil-of-slipperiness.png",
    description: "This sticky, black unguent is thick and heavy in the container but quickly spreads across the skin.",
    properties: [
      { title: "Slippery", text: "This oil can cover a Medium or smaller creature (along with the equipment it's wearing and carrying). The creature benefits from the freedom of movement spell for 8 hours. Alternatively, you can pour the oil on the ground as an action, creating a 10-foot square of difficult terrain. Each creature that enters the area or starts its turn there must succeed on a DC 10 Dexterity saving throw or fall prone." }
    ]
  },
 
  {
    id: "potion-of-pugilism",
    name: "Elixir of Health",
    classes: [],
    rarity: "Rare",
    category: "Potion",
    attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/elixir-of-health.png",
    description: "When you drink this potion, it cures any disease afflicting you, and it removes the blinded, deafened, paralyzed, and poisoned conditions.",
    properties: [
      { title: "Cure", text: "When you drink this potion, it cures any disease afflicting you, and it removes the blinded, deafened, paralyzed, and poisoned conditions. The clear red liquid has tiny bubbles of light in it." }
    ]
  },
 
  {
    id: "necklace-of-strangulation",
    name: "Necklace of Strangulation",
    classes: [],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/necklace-of-strangulation.png",
    description: "When you put on this necklace, it tightens around your throat and can't be removed except by magic.",
    properties: [
      { title: "Curse", text: "When you put on this necklace, it tightens around your throat and is cursed. You take 2 (1d4) bludgeoning damage at the start of each hour you wear it. The necklace can be removed only by a remove curse spell or similar magic." }
    ]
  },
 
  {
    id: "hat-of-stupidity",
    name: "Hat of Stupidity",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/hat-of-stupidity.png",
    description: "This hat muffles the wearer's ability to think.",
    properties: [
      { title: "Curse", text: "While wearing this hat, your Intelligence score is 1, and you have disadvantage on Intelligence checks. You are under the compulsion to put on the hat if you come within 10 feet of it. The hat can't be removed while cursed by it, and it is only removed when a remove curse spell or similar magic is used." }
    ]
  },
 
  {
    id: "medallion-of-thoughts-rare",
    name: "Cloak of Poisonousness",
    classes: [],
    rarity: "Very Rare",
    category: "Wondrous Item",
    attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/cloak-of-poisonousness.png",
    description: "This fine garment appears to be a cloak of protection, and it registers as magical if targeted by detect magic. However it is cursed.",
    properties: [
      { title: "Curse", text: "When you put on the cloak and become attuned to it, you are poisoned. You are not aware of the poison but others who can smell can determine you are unwell. Only a remove curse spell ends the attunement to the cloak and removes the curse, after which the cloak is no longer magical." }
    ]
  },
 
  {
    id: "ring-of-clumsiness",
    name: "Ring of Clumsiness",
    classes: [],
    rarity: "Uncommon",
    category: "Ring",
    attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/ring-of-clumsiness.png",
    description: "This ring is cursed. Attuning to it curses you until you are targeted by the remove curse spell or similar magic.",
    properties: [
      { title: "Curse", text: "This ring is cursed. While attuned to it, you have disadvantage on Dexterity saving throws and Dexterity checks. In addition, if you are concentrating on a spell, you must succeed on a DC 15 Constitution saving throw each round or lose concentration." }
    ]
  },
 
  {
    id: "gauntlets-of-fumbling",
    name: "Gauntlets of Fumbling",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/gauntlets-of-fumbling.png",
    description: "These gauntlets look like gauntlets of ogre power and have the same Strength-enhancing properties.",
    properties: [
      { title: "Strength", text: "Your Strength score is 19 while you wear these gauntlets." },
      { title: "Curse", text: "These gauntlets are cursed. When you attack with a weapon while wearing them, you have disadvantage on the attack roll. If you roll a 1 on the attack roll, you drop the weapon. Removing the gauntlets requires a remove curse spell or similar magic." }
    ]
  },
 
  {
    id: "drums-of-panic",
    name: "Drums of Panic",
    classes: [],
    rarity: "Rare",
    category: "Wondrous Item",
    attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/drums-of-panic.png",
    description: "These leather drums are 6 inches in diameter. If you are proficient with drums you can use them to create supernatural fear.",
    properties: [
      { title: "Panic", text: "While playing the drums, you can use an action to force creatures of your choice within 500 feet of you that can hear the drums to make a DC 13 Wisdom saving throw. On a failure, the creature is frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns. Once the drums have been used this way, they can't be used again until the next dawn." }
    ]
  },
 
  {
    id: "wind-fan",
    name: "Wind Fan",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/wind-fan.png",
    description: "While holding this fan, you can use an action to cast the gust of wind spell (save DC 13) from it.",
    properties: [
      { title: "Gust of Wind", text: "While holding this fan, you can use an action to cast the gust of wind spell (save DC 13) from it. Once used, there is a cumulative 20 percent chance each time you use the fan again that it loses its magic and becomes a nonmagical item." }
    ]
  },
 
  {
    id: "wings-of-flying-rare",
    name: "Quiver of Ehlonna",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/quiver-of-ehlonna.png",
    description: "Each of the quiver's three compartments connects to an extradimensional space that allows the quiver to hold numerous items.",
    properties: [
      { title: "Extended Storage", text: "The quiver has three compartments: the first holds up to 60 arrows or bolts; the second holds up to 18 javelins or similar weapons; the third holds up to 6 long objects such as bows, quarterstaffs, or spears. Drawing an item from the quiver requires a normal interaction with the item." }
    ]
  },
 
  {
    id: "circlet-of-human-perfection",
    name: "Circlet of Human Perfection",
    classes: [],
    rarity: "Uncommon",
    category: "Wondrous Item",
    attunement: true,
    source: "Waterdeep: Dungeon of the Mad Mage",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/circlet-of-human-perfection.png",
    description: "The circlet transforms its attuned wearer into a handsome human of average height and weight.",
    properties: [
      { title: "Human Disguise", text: "The circlet transforms its attuned wearer into a handsome human of average height and weight. The wearer's physical appearance (hair color, eye color, skin tone) changes slightly. The wearer's statistics don't change. The disguise ends when the circlet is removed or the attunement ends." }
    ]
  },
 
  {
    id: "staff-of-power-rare",
    name: "Nature's Wrath",
    classes: ["Druid"],
    rarity: "Rare",
    category: "Staff",
    attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/natures-wrath.png",
    description: "This gnarled staff is carved from the heartwood of a tree struck by both lightning and a giant's fist. It crackles with primal energy.",
    properties: [
      { title: "Spellcasting Focus", text: "You can use this staff as a spellcasting focus for your druid spells." },
      { title: "Nature Spells", text: "8 charges, regains 1d6 + 2 at dawn. Cast: thunderwave (1 charge), call lightning (3 charges), erupting earth (3 charges), control weather (8 charges)." },
      { title: "Primal Strike", text: "The staff can be used as a magic quarterstaff. On a hit, it deals an extra 1d8 thunder or lightning damage (your choice)." }
    ]
  },
 
];