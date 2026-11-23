export const ITEM_CLASSES: Record<
  string,
  { id: string; type: string; categories?: string[] }
> = {
  // ARMOUR STATS + REQUIREMENTS + QUALITY
  Helmets: {
    id: "armour.helmet",
    type: "armour",
    categories: ["Helmets", "Armour", "All Equipment"],
  },
  "Body Armours": {
    id: "armour.chest",
    type: "armour",
    categories: ["Body Armours", "Armour", "All Equipment"],
  },
  Gloves: {
    id: "armour.gloves",
    type: "armour",
    categories: ["Gloves", "Armour", "All Equipment"],
  },
  Boots: {
    id: "armour.boots",
    type: "armour",
    categories: ["Boots", "Armour", "All Equipment"],
  },
  Foci: {
    id: "armour.focus",
    type: "armour",
    categories: ["Foci", "Armour", "All Equipment"],
  },
  Shields: {
    id: "armour.shield",
    type: "armour",
    categories: ["Shields", "Shields and Bucklers", "Armour", "All Equipment"],
  },
  Bucklers: {
    id: "armour.buckler",
    type: "armour",
    categories: ["Bucklers", "Shields and Bucklers", "Armour", "All Equipment"],
  },

  // WEAPON STATS + REQUIREMENTS + QUALITY
  "One Hand Maces": {
    id: "weapon.onemace",
    type: "weapon",
    categories: [
      "Martial Weapon",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "One Hand Maces",
      "One Hand Mace or Quarterstaff",
      "One Hand Mace, Two Hand Mace or Talisman",
    ],
  },
  "Two Hand Maces": {
    id: "weapon.twomace",
    type: "weapon",
    categories: [
      "Martial Weapon",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "Two Hand Maces",
      "One Hand Mace, Two Hand Mace or Talisman",
    ],
  },
  Sceptres: {
    id: "weapon.sceptre",
    type: "weapon",
    categories: ["All Equipment", "Sceptres", "Weapon", "Caster Weapon"],
  },
  Talismans: {
    id: "weapon.talisman",
    type: "weapon",
    categories: [
      "Martial Weapon",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "Talismans",
      "One Hand Mace, Two Hand Mace or Talisman",
    ],
  },
  Spears: {
    id: "weapon.spear",
    type: "weapon",
    categories: [
      "Martial Weapon",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "Spears",
      "Crossbow, Bow or Spear",
      "Quarterstaff or Spear",
    ],
  },
  Quarterstaves: {
    id: "weapon.warstaff",
    type: "weapon",
    categories: [
      "Martial Weapon",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "Quarterstaves",
      "One Hand Mace or Quarterstaff",
      "Quarterstaff or Spear",
    ],
  },
  Bows: {
    id: "weapon.bow",
    type: "weapon",
    categories: [
      "Martial Weapon",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "Bows",
      "Crossbow, Bow or Spear",
    ],
  },
  Crossbows: {
    id: "weapon.crossbow",
    type: "weapon",
    categories: [
      "Martial Weapon",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "Crossbows",
      "Crossbow, Bow or Spear",
    ],
  },

  // REQUIREMENTS
  Augment: { id: "currency.rune", type: "augment" },
  Belts: { id: "accessory.belt", type: "belt" },
  Quivers: { id: "armour.quiver", type: "quiver" },

  // REQUIREMENTS + QUALITY
  Staves: {
    id: "weapon.staff",
    type: "caster",
    categories: [
      "Wand or Staff",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "Caster Weapon",
      "Staves",
    ],
  },
  Wands: {
    id: "weapon.wand",
    type: "caster",
    categories: [
      "Wand or Staff",
      "All Equipment",
      "Martial Weapon, Wand or Staff",
      "Weapon",
      "Caster Weapon",
      "Wands",
    ],
  },
  Amulets: { id: "accessory.amulet", type: "accessory" },
  Rings: { id: "accessory.ring", type: "accessory" },
  "Skill Gems": { id: "gem.activegem", type: "gem" },
  "Life Flasks": { id: "flask.life", type: "flask" },
  "Mana Flasks": { id: "flask.mana", type: "flask" },
  Charms: { id: "flask.charm", type: "charm" },

  // QUALITY
  Jewels: { id: "jewel", type: "jewel" },

  // Waystones
  Waystones: { id: "map.waystone", type: "waystone" },

  // --- NO QUALITY / NO ATTRIBUTE REQUIREMENTS ---
  "Stackable Currency": { id: "", type: "currency" },
  "Support Gems": { id: "gem.supportgem", type: "support" },
  Relics: { id: "sanctum.relic", type: "relic" },
  Tablet: { id: "map.tablet", type: "map" },
  "Trial Coins": { id: "map.barya", type: "map" },
  "Inscribed Ultimatum": { id: "map.ultimatum", type: "map" },
  "Pinnacle Keys": { id: "map.bosskey", type: "map" },
};
