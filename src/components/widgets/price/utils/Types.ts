export const CLASSES: Record<
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

export interface PoeTradeQueryPayload {
  query?: {
    filters?: {
      type_filters?: {
        filters: {
          category?: { option: string };
          ilvl?: { min?: number; max?: number };
          quality?: { min?: number; max?: number };
          rarity?: { option: string };
        };
      };
      equipment_filters?: {
        disabled: boolean;
        filters: {
          aps?: MinMax;
          ar?: MinMax;
          block?: MinMax;
          crit?: MinMax;
          damage?: MinMax;
          dps?: MinMax;
          edps?: MinMax;
          es?: MinMax;
          ev?: MinMax;
          pdps?: MinMax;
          reload_time?: MinMax;
          spirit?: MinMax;
          total_augment_sockets?: MinMax;
          ward?: MinMax;
        };
      };
      req_filters?: {
        disabled: boolean;
        filters: {
          lvl?: MinMax;
          str?: MinMax;
          dex?: MinMax;
          int?: MinMax;
        };
      };
      map_filters?: {
        disabled: boolean;
        filters: {
          map_bonus?: MinMax;
          map_iir?: MinMax;
          map_magic_monsters?: MinMax;
          map_packsize?: MinMax;
          map_rare_monsters?: MinMax;
          map_revives?: MinMax;
          map_tier?: MinMax;
        };
      };
      misc_filters?: {
        disabled: boolean;
        filters: {
          area_level?: MinMax;
          corrupted?: { option: boolean };
          crafted?: { option: boolean };
          desecrated?: { option: boolean };
          foreseeing?: { option: boolean };
          fractured_item?: { option: boolean };
          gem_level?: MinMax;
          gem_sockets?: MinMax;
          identified?: { option: boolean };
          mirrored?: { option: boolean };
          mutated?: { option: boolean };
          sanctified?: { option: boolean };
          sanctum_gold?: MinMax;
          stack_size?: MinMax;
          twice_corrupted?: { option: boolean };
          unidentified_tier?: MinMax;
          veiled?: { option: boolean };
        };
      };
    };
    name?: string;
    stats?: PoeStatGroup[];
    status: {
      option: "any" | "online" | "onlineleague" | "securable";
    };
    term?: string;
    type?: string;
  };
  sort?: {
    [key: string]: "asc" | "desc";
  };
}

export interface MinMax {
  min?: number;
  max?: number;
}

export interface PoeStatGroup {
  type: "and" | "not" | "count" | "weight" | "if";
  filters: PoeStatFilter[];
  value?: { min?: number; max?: number };
}

interface PoeStatFilter {
  id: string;
  value?: {
    min?: number;
    max?: number;
  };
  disabled?: boolean;
}

export interface Item {
  name?: Toggleable<string>;
  type?: Toggleable<string>;
  TypeFilters: {
    filters: {
      category: Toggleable<string>;
      ilvl?: Toggleable<MinMax>;
      quality?: Toggleable<MinMax>;
      rarity?: Toggleable<string>;
    };
  };
  EquipmentFilters: {
    disabled: boolean;
    filters: {
      aps?: Toggleable<MinMax>;
      ar?: Toggleable<MinMax>;
      block?: Toggleable<MinMax>;
      crit?: Toggleable<MinMax>;
      damage?: Toggleable<MinMax>;
      dps?: Toggleable<MinMax>;
      edps?: Toggleable<MinMax>;
      es?: Toggleable<MinMax>;
      ev?: Toggleable<MinMax>;
      pdps?: Toggleable<MinMax>;
      reloadTime?: Toggleable<MinMax>;
      spirit?: Toggleable<MinMax>;
      sockets?: Toggleable<MinMax>;
      ward?: Toggleable<MinMax>;
    };
  };
  ReqFilters: {
    disabled: boolean;
    filters: {
      lvl?: Toggleable<MinMax>;
      str?: Toggleable<MinMax>;
      dex?: Toggleable<MinMax>;
      int?: Toggleable<MinMax>;
    };
  };
  MapFilters: {
    disabled: boolean;
    filters: {
      bonus?: Toggleable<MinMax>;
      iir?: Toggleable<MinMax>;
      magicMonsters?: Toggleable<MinMax>;
      packsize?: Toggleable<MinMax>;
      rareMonsters?: Toggleable<MinMax>;
      revives?: Toggleable<MinMax>;
      tier?: Toggleable<MinMax>;
    };
  };
  MiscFilters: {
    disabled: boolean;
    filters: {
      corrupted?: Toggleable<boolean>;
      fractured?: Toggleable<boolean>;
      gemLevel?: Toggleable<MinMax>;
      gemSockets?: Toggleable<MinMax>;
      identified?: Toggleable<boolean>;
      mirrored?: Toggleable<boolean>;
      sanctified?: Toggleable<boolean>;
      twiceCorrupted?: Toggleable<boolean>;
      veiled?: Toggleable<boolean>;
    };
  };
  enhancement: ItemMod[];
  implicit: ItemMod[];
  explicit: ItemMod[];
  skill: ItemMod[];
  runes: Rune[];
}

export interface Toggleable<T> {
  value: T;
  disabled: boolean;
}

export interface ItemMod {
  id: string;
  mod: string;
  disabled: boolean;
  min?: number;
  max?: number;
  fractured?: Toggleable<boolean>;
}

export interface Prices {
  amount: number;
  currency: string;
  listed: string;
}

export interface Rune {
  id: string;
  mod: string;
  disabled: boolean;
  min?: number;
  max?: number;
  name?: string;
  count: number;
  fractured?: Toggleable<boolean>;
}
