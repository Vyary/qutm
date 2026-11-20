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
