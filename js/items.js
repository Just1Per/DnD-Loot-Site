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

  {
    id: "moonblade",
    name: "Moonblade",
    classes: ["Elf", "Half-Elf"], rarity: "Legendary", category: "Weapon", attunement: true,
    source: "Sword Coast Adventurer's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/moonblade.png",
    description: "One of the most prized magic items created by the elves, nearly all elven noble houses once claimed one.",
    properties: [
      { title: "Attack Bonus", text: "+1 bonus to attack and damage rolls (increases by 1 per additional rune, max +3)." },
      { title: "Runes", text: "Each moonblade has 1d6+1 runes carved into its blade, each granting a different property such as additional damage types, advantage on saves, or the ability to cast spells." },
      { title: "Sentience", text: "Chaotic good, Intelligence 12, Wisdom 10, Charisma 12. Hearing and darkvision 120 ft. Communicates telepathically with its wielder." }
    ]
  },

  // ─── DMG STAFF OF THE WOODLANDS ───────────────────────────────────────────

  {
    id: "staff-of-the-woodlands",
    name: "Staff of the Woodlands",
    classes: ["Druid"], rarity: "Rare", category: "Staff", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/staff-of-the-woodlands.png",
    description: "This staff can be wielded as a magic quarterstaff that grants a +2 bonus to attack and damage rolls.",
    properties: [
      { title: "Attack Bonus", text: "+2 bonus to attack and damage rolls. +2 bonus to spell attack rolls while holding." },
      { title: "Spells", text: "10 charges, regains 1d6+4 at dawn. Cast animal friendship (1), awaken (5), barkskin (2), locate animals or plants (2), speak with animals (1), speak with plants (3), wall of thorns (6)." },
      { title: "Tree Form", text: "As an action, plant the staff in earth and expend 1 charge to transform it into a 60-foot-tall tree. As an action, touch the tree and expend 1 charge to return it to staff form." }
    ]
  },

  // ─── DMG ARTIFACTS ────────────────────────────────────────────────────────

  {
    id: "hand-of-vecna",
    name: "Hand of Vecna",
    classes: [], rarity: "Artifact", category: "Wondrous Item", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/hand-of-vecna.png",
    description: "The Hand of Vecna is a mummified human hand. To attune, you must place it where your own left hand would be, and it grafts itself to your wrist.",
    properties: [
      { title: "Strength", text: "Your Strength score becomes 20 unless it is already 20 or higher." },
      { title: "Spells", text: "4d4+4 charges, regains 1d4+4 at dawn. Cast finger of death, sleep, slow, or telekinesis (DC 18). Each spell costs 1-3 charges." },
      { title: "Dark Gift", text: "Vecna can read your thoughts and communicate with you telepathically from any distance." }
    ]
  },

  {
    id: "eye-of-vecna",
    name: "Eye of Vecna",
    classes: [], rarity: "Artifact", category: "Wondrous Item", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/eye-of-vecna.png",
    description: "The Eye of Vecna is a preserved human eye. To attune, you must gouge out your own eye and press the artifact into the empty socket.",
    properties: [
      { title: "Wisdom", text: "Your Wisdom score becomes 18 unless it is already 18 or higher." },
      { title: "Eye Abilities", text: "Truesight, see through solid objects to 30 ft. Cast clairvoyance, crown of madness, disintegrate, dominate monster, eyebite. Regains 1d4+4 charges at dawn." }
    ]
  },

  {
    id: "sword-of-kas",
    name: "Sword of Kas",
    classes: [], rarity: "Artifact", category: "Weapon", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/sword-of-kas.png",
    description: "When Vecna grew in power, he appointed Kas the Bloody-Handed as his lieutenant and bodyguard.",
    properties: [
      { title: "Attack Bonus", text: "+3 bonus to attack and damage rolls. Scores a critical hit on a roll of 19 or 20." },
      { title: "Spells", text: "3 charges, regains 1d3 at dawn. Cast call lightning (3), divine word at 7th level (3), or finger of death (3)." },
      { title: "Sentience", text: "Chaotic evil, Intelligence 15, Wisdom 13, Charisma 16. Hearing and darkvision 120 ft. Speaks Common and Abyssal. Urges its wielder to turn against Vecna." }
    ]
  },

  {
    id: "blackrazor",
    name: "Blackrazor",
    classes: [], rarity: "Legendary", category: "Weapon", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/blackrazor.png",
    description: "Black as night, this blade was forged with an evil purpose and hungers for souls.",
    properties: [
      { title: "Attack Bonus", text: "+3 bonus to attack and damage rolls. The sword can cut through objects that are not artifacts." },
      { title: "Soul Hungering", text: "When you kill a creature, its soul is devoured. Until your next long rest, gain temporary HP equal to the creature's CR, and have advantage on attack rolls and saving throws." },
      { title: "Sentience", text: "Chaotic neutral, Intelligence 17, Wisdom 10, Charisma 19. Hearing and darkvision 60 ft. Speaks Common. Desires to consume souls." }
    ]
  },

  {
    id: "wave",
    name: "Wave",
    classes: [], rarity: "Legendary", category: "Weapon", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/wave.png",
    description: "This trident is dedicated to the worship of Olhydra, Princess of Evil Water.",
    properties: [
      { title: "Attack Bonus", text: "+3 bonus to attack and damage rolls. Extra 2d6 damage against creatures vulnerable to cold or fire." },
      { title: "Water Mastery", text: "Breathe underwater. Swimming speed equals walking speed. Cast dominate beast (aquatic only), wall of water, water walk." },
      { title: "Sentience", text: "Neutral, Intelligence 14, Wisdom 10, Charisma 18. Hearing and darkvision 120 ft. Seeks to drown all it encounters." }
    ]
  },

  {
    id: "whelm",
    name: "Whelm",
    classes: ["Dwarf"], rarity: "Legendary", category: "Weapon", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/whelm.png",
    description: "Whelm is a powerful warhammer forged by dwarves and lost in White Plume Mountain.",
    properties: [
      { title: "Attack Bonus", text: "+3 bonus to attack and damage rolls." },
      { title: "Thrown", text: "Range 20/60 ft. when thrown. Returns to your hand immediately after hitting or missing." },
      { title: "Shock Wave", text: "As an action, strike the ground to send a shock wave in a 60-foot radius. DC 15 Constitution save or fall prone and be stunned until the start of your next turn." },
      { title: "Sentience", text: "Lawful neutral, Intelligence 15, Wisdom 12, Charisma 15. Hearing and darkvision 60 ft. Hates giants and loves dwarven culture." }
    ]
  },

  // ─── EBERRON: RISING FROM THE LAST WAR ───────────────────────────────────

  {
    id: "docent",
    name: "Docent",
    classes: [], rarity: "Rare", category: "Wondrous Item", attunement: true,
    source: "Eberron: Rising from the Last War",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/docent.png",
    description: "A small metal sphere, 2 inches across, studded with dragonshards. You must embed it in your chest to attune to it.",
    properties: [
      { title: "Personality", text: "Sentient, any alignment. Intelligence 14, Wisdom 14, Charisma 14. Hearing and darkvision 60 ft. Communicates telepathically with its wearer." },
      { title: "Skills", text: "+7 bonus to History and Nature checks, and can share this knowledge with its wearer." }
    ]
  },

  {
    id: "living-armor",
    name: "Living Armor",
    classes: [], rarity: "Very Rare", category: "Armor", attunement: true,
    source: "Eberron: Rising from the Last War",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/living-armor.png",
    description: "This armor is partially composed of organic material integrated into its structure.",
    properties: [
      { title: "AC Bonus", text: "+1 bonus to AC while wearing this armor." },
      { title: "Living Resilience", text: "The armor regains 1d8 hit points at the start of each of your turns if it has at least 1 hit point." },
      { title: "Curse", text: "Cursed. Can't doff unless targeted by remove curse. Once per day when you take damage, the armor heals itself for half the damage dealt to you." }
    ]
  },

  {
    id: "prosthetic-limb",
    name: "Prosthetic Limb",
    classes: [], rarity: "Common", category: "Wondrous Item", attunement: false,
    source: "Eberron: Rising from the Last War",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/prosthetic-limb.png",
    description: "This item replaces a lost limb, such as a hand, arm, foot, or leg.",
    properties: [{ title: "Prosthetic", text: "While attached, functions identically to the body part it replaces. Detach or reattach as an action. Can't be removed against your will. Detaches if you die." }]
  },

  {
    id: "spellshard",
    name: "Spellshard",
    classes: [], rarity: "Common", category: "Wondrous Item", attunement: false,
    source: "Eberron: Rising from the Last War",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/spellshard.png",
    description: "This polished Eberron dragonshard is a common magical item across Eberron.",
    properties: [{ title: "Message Storage", text: "Stores any number of written messages. The attuned creature or creator can speak a command word to display a stored message. As an action, touch the shard and speak to store a message of up to 50 words." }]
  },

  {
    id: "wheel-of-wind-and-water",
    name: "Wheel of Wind and Water",
    classes: [], rarity: "Uncommon", category: "Wondrous Item", attunement: false,
    source: "Eberron: Rising from the Last War",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/wheel-of-wind-and-water.png",
    description: "When mounted at the helm of an elemental vessel, this wheel allows control of its bound elemental.",
    properties: [{ title: "Elemental Control", text: "When mounted at the helm of an elemental vessel, communicate with and control the bound elemental to increase or decrease speed, change direction, and perform other basic navigation tasks." }]
  },

  // ─── ACQUISITIONS INCORPORATED ────────────────────────────────────────────

  {
    id: "orrery-of-the-wanderer",
    name: "Orrery of the Wanderer",
    classes: [], rarity: "Artifact", category: "Wondrous Item", attunement: true,
    source: "Acquisitions Incorporated",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/orrery-of-the-wanderer.png",
    description: "A portable arcane device resembling a model solar system with spinning spheres of glass and wire.",
    properties: [
      { title: "Extraplanar Attunement", text: "Advantage on Intelligence checks about the planes of existence. Cast plane shift once per day without using a spell slot." },
      { title: "Planar Awareness", text: "Always know which plane of existence you are on and the direction and distance to the nearest portal to another plane within 1 mile." }
    ]
  },

  // ─── BIGBY PRESENTS: GLORY OF THE GIANTS ─────────────────────────────────

  {
    id: "adze-of-annam",
    name: "Adze of Annam",
    classes: [], rarity: "Artifact", category: "Weapon", attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/adze-of-annam.png",
    description: "The adze of Annam is a greataxe-sized tool that belonged to Annam the All-Father, god of giants.",
    properties: [
      { title: "Giant Size", text: "Sized for a Huge creature. A Medium or smaller attuned creature can wield it without penalty." },
      { title: "Attack Bonus", text: "+3 bonus to attack and damage. Deals 3d12+3 slashing damage and deals maximum damage to objects." },
      { title: "Rune Carving", text: "As an action, carve a rune into a Huge or larger object granting a magical effect. You can have up to 3 runes active at once." }
    ]
  },

  {
    id: "belt-of-giant-endurance",
    name: "Belt of Giant Endurance",
    classes: [], rarity: "Rare", category: "Wondrous Item", attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/belt-of-giant-endurance.png",
    description: "This wide belt is made from the hide of a giant and decorated with runes.",
    properties: [
      { title: "Giant Endurance", text: "Your Constitution score becomes 21 while wearing this belt, unless it is already 21 or higher." },
      { title: "Rune of Endurance", text: "Once per day when you take damage, use your reaction to reduce the damage by 2d12." }
    ]
  },

  {
    id: "giant-strider-hide",
    name: "Giant Strider Hide",
    classes: [], rarity: "Rare", category: "Armor", attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/giant-strider-hide.png",
    description: "This medium armor is crafted from the hide of a giant strider.",
    properties: [
      { title: "Fire Resistance", text: "Resistance to fire damage while wearing this armor." },
      { title: "Ember Step", text: "Walk across lava or fire without taking damage, as long as no single source deals more than 20 fire damage per round." }
    ]
  },

  {
    id: "gavel-of-the-venn-rune",
    name: "Gavel of the Venn Rune",
    classes: [], rarity: "Very Rare", category: "Weapon", attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/gavel-of-the-venn-rune.png",
    description: "A heavy stone gavel inscribed with the venn rune used by storm giants.",
    properties: [
      { title: "Attack Bonus", text: "+2 bonus to attack and damage rolls." },
      { title: "Thunder Crack", text: "3 charges, regains 1d3 at dawn. Expend 1 charge on a hit to deal extra 4d8 thunder damage and force a DC 16 Constitution save or be stunned until end of target's next turn." }
    ]
  },

  {
    id: "lash-of-immolation",
    name: "Lash of Immolation",
    classes: [], rarity: "Rare", category: "Weapon", attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/lash-of-immolation.png",
    description: "This whip is crafted from the hide of a fire giant and is always warm to the touch.",
    properties: [
      { title: "Attack Bonus", text: "+1 bonus to attack and damage rolls." },
      { title: "Fire Damage", text: "Extra 1d6 fire damage on a hit." },
      { title: "Immolate", text: "3 charges, regains 1d3 at dawn. Once per turn on a hit, expend 1 charge to force DC 14 Constitution save or the creature catches fire, taking 2d6 fire damage at the start of each of its turns." }
    ]
  },

  {
    id: "staff-of-the-rune-carver",
    name: "Staff of the Rune Carver",
    classes: [], rarity: "Rare", category: "Staff", attunement: true,
    source: "Bigby Presents: Glory of the Giants",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/staff-of-the-rune-carver.png",
    description: "This staff is made of petrified giant oak and etched with ancient giant runes.",
    properties: [
      { title: "Giant Runes", text: "6 charges, regains 1d6 at dawn. Cast comprehend languages, detect magic, identify, or legend lore from the staff." },
      { title: "Rune Mastery", text: "Advantage on Intelligence checks related to giant history and runes. Can read Giant runes even without speaking the language." }
    ]
  },

  // ─── ADDITIONAL DMG ITEMS ─────────────────────────────────────────────────

  {
    id: "arrow-of-slaying",
    name: "Arrow of Slaying",
    classes: [], rarity: "Very Rare", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/arrow-of-slaying.png",
    description: "An arrow of slaying is a magic weapon meant to kill a particular kind of creature.",
    properties: [{ title: "Slaying", text: "If a creature belonging to the associated type takes damage from the arrow, it must make a DC 17 Constitution saving throw, taking extra 6d10 piercing damage on a failure, or half extra damage on a success. Once it deals its extra damage, it becomes a nonmagical arrow." }]
  },

  {
    id: "ammunition-plus-1",
    name: "+1 Ammunition",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/ammunition-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this piece of magic ammunition.",
    properties: [{ title: "+1 Bonus", text: "+1 to attack and damage rolls. Once it hits a target, it becomes nonmagical." }]
  },

  {
    id: "ammunition-plus-2",
    name: "+2 Ammunition",
    classes: [], rarity: "Rare", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/ammunition-plus-2.png",
    description: "You have a +2 bonus to attack and damage rolls made with this piece of magic ammunition.",
    properties: [{ title: "+2 Bonus", text: "+2 to attack and damage rolls. Once it hits a target, it becomes nonmagical." }]
  },

  {
    id: "ammunition-plus-3",
    name: "+3 Ammunition",
    classes: [], rarity: "Very Rare", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/ammunition-plus-3.png",
    description: "You have a +3 bonus to attack and damage rolls made with this piece of magic ammunition.",
    properties: [{ title: "+3 Bonus", text: "+3 to attack and damage rolls. Once it hits a target, it becomes nonmagical." }]
  },

  {
    id: "bead-of-force",
    name: "Bead of Force",
    classes: [], rarity: "Rare", category: "Wondrous Item", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/bead-of-force.png",
    description: "This small black sphere measures 3/4 of an inch in diameter.",
    properties: [{ title: "Force Sphere", text: "As an action, throw the bead up to 60 feet. On impact, creatures within 10 feet make a DC 15 Dexterity save or take 5d4 force damage. A sphere of transparent force encloses the area for 1 minute. Creatures that failed the save are trapped inside." }]
  },

  {
    id: "chime-of-opening",
    name: "Chime of Opening",
    classes: [], rarity: "Rare", category: "Wondrous Item", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/chime-of-opening.png",
    description: "This hollow metal tube measures about 1 foot long and weighs 1 pound.",
    properties: [{ title: "Open", text: "Strike the chime and point at an object within 120 feet that can be opened. The chime issues a clear tone, and one lock or latch on the object opens. Can be used 10 times. After the 10th time, it cracks and becomes useless." }]
  },

  {
    id: "cloak-of-invisibility",
    name: "Cloak of Invisibility",
    classes: [], rarity: "Legendary", category: "Wondrous Item", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/cloak-of-invisibility.png",
    description: "While wearing this cloak, you can pull its hood over your head to become invisible.",
    properties: [{ title: "Invisibility", text: "Pull the hood over your head to become invisible along with everything you wear or carry. The cloak can be used for a total of 2 hours per day. After 2 hours, it stops functioning until the next dawn." }]
  },

  {
    id: "crystal-ball-of-mind-reading",
    name: "Crystal Ball of Mind Reading",
    classes: [], rarity: "Very Rare", category: "Wondrous Item", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/crystal-ball-of-mind-reading.png",
    description: "A crystal ball with the ability to also read the minds of those you observe.",
    properties: [
      { title: "Scrying", text: "Cast the scrying spell (save DC 17) while touching it." },
      { title: "Mind Reading", text: "While scrying, cast detect thoughts (save DC 17) on a creature you can see through the sensor. No need to concentrate on detect thoughts during its duration." }
    ]
  },

  {
    id: "crystal-ball-of-telepathy",
    name: "Crystal Ball of Telepathy",
    classes: [], rarity: "Very Rare", category: "Wondrous Item", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/crystal-ball-of-telepathy.png",
    description: "A crystal ball that also enables telepathic communication with those you observe.",
    properties: [
      { title: "Scrying", text: "Cast the scrying spell (save DC 17) while touching it." },
      { title: "Telepathy", text: "While scrying, communicate telepathically with creatures within 30 feet of the sensor. Also cast suggestion (save DC 17) on one such creature. Once used, can't cast suggestion again until the next dawn." }
    ]
  },

  {
    id: "crystal-ball-of-true-seeing",
    name: "Crystal Ball of True Seeing",
    classes: [], rarity: "Legendary", category: "Wondrous Item", attunement: true,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/crystal-ball-of-true-seeing.png",
    description: "A crystal ball that grants truesight while scrying.",
    properties: [
      { title: "Scrying", text: "Cast the scrying spell (save DC 17) while touching it." },
      { title: "True Seeing", text: "While scrying with this crystal ball, you have truesight with a radius of 120 feet centered on the scrying sensor." }
    ]
  },

  {
    id: "folding-boat",
    name: "Folding Boat",
    classes: [], rarity: "Rare", category: "Wondrous Item", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/folding-boat.png",
    description: "This object appears as a wooden box that measures 12 inches long, 6 inches wide, and 6 inches deep.",
    properties: [
      { title: "Rowboat", text: "First command word: unfolds into a 10-foot-long boat with oars, anchor, mast, and sail." },
      { title: "Sailboat", text: "Second command word: unfolds into a 24-foot-long ship with deck, rowing seats, five oar sets, and a square sail. Requires a crew of four." },
      { title: "Refold", text: "Speak the second command word to fold back into box form, provided no creatures are aboard." }
    ]
  },

  // ─── ADDITIONAL WEAPON VARIANTS ───────────────────────────────────────────

  {
    id: "flail-plus-1",
    name: "+1 Flail",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/flail-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic flail." }]
  },

  {
    id: "glaive-plus-1",
    name: "+1 Glaive",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/glaive-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic glaive." }]
  },

  {
    id: "halberd-plus-1",
    name: "+1 Halberd",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/halberd-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic halberd." }]
  },

  {
    id: "lance-plus-1",
    name: "+1 Lance",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/lance-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic lance." }]
  },

  {
    id: "morningstar-plus-1",
    name: "+1 Morningstar",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/morningstar-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic morningstar." }]
  },

  {
    id: "pike-plus-1",
    name: "+1 Pike",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/pike-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic pike." }]
  },

  {
    id: "sickle-plus-1",
    name: "+1 Sickle",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/sickle-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic sickle." }]
  },

  {
    id: "trident-plus-1",
    name: "+1 Trident",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/trident-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic trident." }]
  },

  {
    id: "war-pick-plus-1",
    name: "+1 War Pick",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/war-pick-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic war pick." }]
  },

  {
    id: "whip-plus-1",
    name: "+1 Whip",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/whip-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic whip." }]
  },

  {
    id: "hand-crossbow-plus-1",
    name: "+1 Hand Crossbow",
    classes: [], rarity: "Uncommon", category: "Weapon", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/hand-crossbow-plus-1.png",
    description: "You have a +1 bonus to attack and damage rolls made with this magic weapon.",
    properties: [{ title: "+1 Bonus", text: "+1 bonus to attack and damage rolls made with this magic hand crossbow." }]
  },

  // ─── ADDITIONAL ARMOR VARIANTS ────────────────────────────────────────────

  {
    id: "hide-armor-plus-1",
    name: "+1 Hide Armor",
    classes: [], rarity: "Uncommon", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/hide-armor-plus-1.png",
    description: "You have a +1 bonus to AC while wearing this armor.",
    properties: [{ title: "+1 AC", text: "+1 bonus to AC while wearing this armor." }]
  },

  {
    id: "hide-armor-plus-2",
    name: "+2 Hide Armor",
    classes: [], rarity: "Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/hide-armor-plus-2.png",
    description: "You have a +2 bonus to AC while wearing this armor.",
    properties: [{ title: "+2 AC", text: "+2 bonus to AC while wearing this armor." }]
  },

  {
    id: "hide-armor-plus-3",
    name: "+3 Hide Armor",
    classes: [], rarity: "Very Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/hide-armor-plus-3.png",
    description: "You have a +3 bonus to AC while wearing this armor.",
    properties: [{ title: "+3 AC", text: "+3 bonus to AC while wearing this armor." }]
  },

  {
    id: "padded-armor-plus-1",
    name: "+1 Padded Armor",
    classes: [], rarity: "Uncommon", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/padded-armor-plus-1.png",
    description: "You have a +1 bonus to AC while wearing this armor.",
    properties: [{ title: "+1 AC", text: "+1 bonus to AC while wearing this armor." }]
  },

  {
    id: "scale-mail-plus-2",
    name: "+2 Scale Mail",
    classes: [], rarity: "Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/scale-mail-plus-2.png",
    description: "You have a +2 bonus to AC while wearing this armor.",
    properties: [{ title: "+2 AC", text: "+2 bonus to AC while wearing this armor." }]
  },

  {
    id: "scale-mail-plus-3",
    name: "+3 Scale Mail",
    classes: [], rarity: "Very Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/scale-mail-plus-3.png",
    description: "You have a +3 bonus to AC while wearing this armor.",
    properties: [{ title: "+3 AC", text: "+3 bonus to AC while wearing this armor." }]
  },

  {
    id: "splint-armor-plus-2",
    name: "+2 Splint Armor",
    classes: [], rarity: "Very Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/splint-armor-plus-2.png",
    description: "You have a +2 bonus to AC while wearing this armor.",
    properties: [{ title: "+2 AC", text: "+2 bonus to AC while wearing this armor." }]
  },

  {
    id: "splint-armor-plus-3",
    name: "+3 Splint Armor",
    classes: [], rarity: "Legendary", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/splint-armor-plus-3.png",
    description: "You have a +3 bonus to AC while wearing this armor.",
    properties: [{ title: "+3 AC", text: "+3 bonus to AC while wearing this armor." }]
  },

  {
    id: "ring-mail-plus-2",
    name: "+2 Ring Mail",
    classes: [], rarity: "Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/ring-mail-plus-2.png",
    description: "You have a +2 bonus to AC while wearing this armor.",
    properties: [{ title: "+2 AC", text: "+2 bonus to AC while wearing this armor." }]
  },

  {
    id: "ring-mail-plus-3",
    name: "+3 Ring Mail",
    classes: [], rarity: "Very Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/ring-mail-plus-3.png",
    description: "You have a +3 bonus to AC while wearing this armor.",
    properties: [{ title: "+3 AC", text: "+3 bonus to AC while wearing this armor." }]
  },

  {
    id: "chain-shirt-plus-2",
    name: "+2 Chain Shirt",
    classes: [], rarity: "Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/chain-shirt-plus-2.png",
    description: "You have a +2 bonus to AC while wearing this armor.",
    properties: [{ title: "+2 AC", text: "+2 bonus to AC while wearing this armor." }]
  },

  {
    id: "chain-shirt-plus-3",
    name: "+3 Chain Shirt",
    classes: [], rarity: "Very Rare", category: "Armor", attunement: false,
    source: "Dungeon Master's Guide",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/chain-shirt-plus-3.png",
    description: "You have a +3 bonus to AC while wearing this armor.",
    properties: [{ title: "+3 AC", text: "+3 bonus to AC while wearing this armor." }]
  },

  // ─── TASHA'S TIERED ITEMS ─────────────────────────────────────────────────

  {
    id: "amulet-of-the-devout-rare",
    name: "Amulet of the Devout (Rare)",
    classes: ["Cleric", "Paladin"], rarity: "Rare", category: "Wondrous Item", attunement: true,
    source: "Tasha's Cauldron of Everything",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/amulet-of-the-devout-rare.png",
    description: "A rare amulet bearing the symbol of a deity.",
    properties: [
      { title: "Holy Symbol", text: "+2 bonus to spell attack rolls and to the saving throw DCs of your spells while you wear or hold it." },
      { title: "Channel Divinity", text: "Use Channel Divinity without expending a use. Once used, can't be used again until the next dawn." }
    ]
  },

  {
    id: "amulet-of-the-devout-very-rare",
    name: "Amulet of the Devout (Very Rare)",
    classes: ["Cleric", "Paladin"], rarity: "Very Rare", category: "Wondrous Item", attunement: true,
    source: "Tasha's Cauldron of Everything",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/amulet-of-the-devout-very-rare.png",
    description: "A very rare amulet bearing the symbol of a deity.",
    properties: [
      { title: "Holy Symbol", text: "+3 bonus to spell attack rolls and to the saving throw DCs of your spells while you wear or hold it." },
      { title: "Channel Divinity", text: "Use Channel Divinity without expending a use. Once used, can't be used again until the next dawn." }
    ]
  },

  {
    id: "arcane-grimoire-rare",
    name: "Arcane Grimoire (Rare)",
    classes: ["Wizard"], rarity: "Rare", category: "Wondrous Item", attunement: true,
    source: "Tasha's Cauldron of Everything",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/arcane-grimoire-rare.png",
    description: "A rare leather-bound tome that enhances wizard spellcasting.",
    properties: [
      { title: "Spellcasting Focus", text: "Use this book as a spellcasting focus for your wizard spells." },
      { title: "Arcane Bonus", text: "+2 bonus to spell attack rolls and to the saving throw DCs of your wizard spells." }
    ]
  },

  {
    id: "arcane-grimoire-very-rare",
    name: "Arcane Grimoire (Very Rare)",
    classes: ["Wizard"], rarity: "Very Rare", category: "Wondrous Item", attunement: true,
    source: "Tasha's Cauldron of Everything",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/arcane-grimoire-very-rare.png",
    description: "A very rare leather-bound tome that greatly enhances wizard spellcasting.",
    properties: [
      { title: "Spellcasting Focus", text: "Use this book as a spellcasting focus for your wizard spells." },
      { title: "Arcane Bonus", text: "+3 bonus to spell attack rolls and to the saving throw DCs of your wizard spells." }
    ]
  },

  {
    id: "bloodwell-vial-rare",
    name: "Bloodwell Vial (Rare)",
    classes: ["Sorcerer"], rarity: "Rare", category: "Wondrous Item", attunement: true,
    source: "Tasha's Cauldron of Everything",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/bloodwell-vial-rare.png",
    description: "A rare vial that enhances sorcerer spellcasting.",
    properties: [
      { title: "Sorcery Points", text: "If your sorcery point total is 0 when you regain sorcery points, you regain 1d4 sorcery points." },
      { title: "Bonus", text: "+2 bonus to spell attack rolls and to the saving throw DCs of your sorcerer spells." }
    ]
  },

  {
    id: "bloodwell-vial-very-rare",
    name: "Bloodwell Vial (Very Rare)",
    classes: ["Sorcerer"], rarity: "Very Rare", category: "Wondrous Item", attunement: true,
    source: "Tasha's Cauldron of Everything",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/bloodwell-vial-very-rare.png",
    description: "A very rare vial that greatly enhances sorcerer spellcasting.",
    properties: [
      { title: "Sorcery Points", text: "If your sorcery point total is 0 when you regain sorcery points, you regain 1d4 sorcery points." },
      { title: "Bonus", text: "+3 bonus to spell attack rolls and to the saving throw DCs of your sorcerer spells." }
    ]
  },

  {
    id: "moon-sickle-rare",
    name: "Moon Sickle (Rare)",
    classes: ["Druid", "Ranger"], rarity: "Rare", category: "Weapon", attunement: true,
    source: "Tasha's Cauldron of Everything",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/moon-sickle-rare.png",
    description: "A rare silver-bladed sickle that glimmers with moonlight.",
    properties: [
      { title: "Attack Bonus", text: "+2 bonus to attack and damage rolls." },
      { title: "Spellcasting Focus", text: "Use as a spellcasting focus for druid and ranger spells. +2 bonus to spell attack rolls and spell save DCs of your druid and ranger spells." }
    ]
  },

  {
    id: "moon-sickle-very-rare",
    name: "Moon Sickle (Very Rare)",
    classes: ["Druid", "Ranger"], rarity: "Very Rare", category: "Weapon", attunement: true,
    source: "Tasha's Cauldron of Everything",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/moon-sickle-very-rare.png",
    description: "A very rare silver-bladed sickle that blazes with moonlight.",
    properties: [
      { title: "Attack Bonus", text: "+3 bonus to attack and damage rolls." },
      { title: "Spellcasting Focus", text: "Use as a spellcasting focus for druid and ranger spells. +3 bonus to spell attack rolls and spell save DCs of your druid and ranger spells." }
    ]
  },

  // ─── FIZBAN'S ADDITIONAL ITEMS ────────────────────────────────────────────

  {
    id: "platinum-scarf",
    name: "Platinum Scarf",
    classes: [], rarity: "Legendary", category: "Wondrous Item", attunement: true,
    source: "Fizban's Treasury of Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/platinum-scarf.png",
    description: "This scarf is made of sturdy platinum-colored fabric covered with astrological symbols.",
    properties: [
      { title: "Protective Ends", text: "6 ends. As a bonus action, animate one end to protect a creature within 30 feet, granting +2 to AC until the start of your next turn." },
      { title: "Breath of Life", text: "As an action, expend 2 ends (3rd level) or 4 ends (5th level) to cast the breath weapon spell. Regains all ends daily at dawn." }
    ]
  },

  {
    id: "dragonhide-belt",
    name: "Dragonhide Belt",
    classes: ["Monk"], rarity: "Uncommon", category: "Wondrous Item", attunement: true,
    source: "Fizban's Treasury of Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/dragonhide-belt.png",
    description: "This belt is made from the scales and hide of a dragon.",
    properties: [
      { title: "Ki Focus", text: "+1 bonus to the saving throw DCs of your ki features. While not wearing armor and not using a shield, your AC equals 10 + Dexterity modifier + Wisdom modifier." },
      { title: "Draconic Strike", text: "Your unarmed strikes deal damage of the type associated with the belt's dragon, plus an extra 1d4 of that damage type." }
    ]
  },

  {
    id: "dragon-vessel",
    name: "Dragon Vessel",
    classes: [], rarity: "Uncommon", category: "Wondrous Item", attunement: false,
    source: "Fizban's Treasury of Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/dragon-vessel.png",
    description: "This vessel is decorated with the image of a dragon.",
    properties: [{ title: "Dragon Breath", text: "As an action, produce a Tiny amount of liquid associated with a specific dragon type. The liquid disappears after 1 minute. Once used, can't be used again until the next dawn." }]
  },

  {
    id: "scaled-ornament",
    name: "Scaled Ornament",
    classes: [], rarity: "Common", category: "Wondrous Item", attunement: true,
    source: "Fizban's Treasury of Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/scaled-ornament.png",
    description: "This ornament is made from dragon scales.",
    properties: [{ title: "Draconic Aura", text: "Advantage on saving throws against the Frightful Presence and breath weapons of dragons. Resistance to the damage type associated with the dragon whose scales the ornament is made from." }]
  },

  {
    id: "gem-of-dragon-sight",
    name: "Gem of Dragon Sight",
    classes: [], rarity: "Rare", category: "Wondrous Item", attunement: false,
    source: "Fizban's Treasury of Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/gem-of-dragon-sight.png",
    description: "This gem is carved in the shape of a dragon's eye.",
    properties: [{ title: "Dragon Sight", text: "As an action, attach the gem to your forehead for 10 minutes. Grants darkvision 60 ft. (or extra 60 ft. if you already have darkvision). Once used, can't be used again until the next dawn." }]
  },

  {
    id: "topaz-annihilator",
    name: "Topaz Annihilator",
    classes: [], rarity: "Legendary", category: "Weapon", attunement: true,
    source: "Fizban's Treasury of Dragons",
    campaign: null, looted: false, owner: null, printed: false, receivedDate: null,
    image: "images/topaz-annihilator.png",
    description: "This magic ranged weapon resembles a greatbow and is made from the scale and sinew of a topaz dragon.",
    properties: [
      { title: "Necrotic Bolt", text: "Range 100/300 ft. +3 bonus to attack and damage. Deals necrotic damage instead of piercing and ignores resistance to necrotic damage." },
      { title: "Annihilating Shot", text: "When you hit a creature, it makes a DC 18 Constitution save or have its hit point maximum reduced by the necrotic damage taken. This reduction lasts until the creature finishes a long rest." }
    ]
  },

];