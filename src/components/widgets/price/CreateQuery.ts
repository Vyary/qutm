import { error, info, warn } from "@tauri-apps/plugin-log";
import { mods } from "./Mods";
import { Item } from "./ParseItem";
import { createStore } from "solid-js/store";
import { onMount } from "solid-js";

interface RangeValue {
  min?: number;
  max?: number;
}

interface CountValue {
  min: number;
}

interface StatFilter {
  disabled?: boolean;
  id: string;
  value: RangeValue;
}

interface StatGroup {
  filters: StatFilter[];
  type: "and" | "count";
  value?: CountValue;
}

const convertToCategory = (itemClass: string) => {
  if (itemClass.includes("Helmet")) return "armour.helmet";
  if (itemClass.includes("Body Armour")) return "armour.chest";
  if (itemClass.includes("Gloves")) return "armour.gloves";
  if (itemClass.includes("Belts")) return "accessory.belt";
  if (itemClass.includes("Amulets")) return "accessory.amulet";
  if (itemClass.includes("Rings")) return "accessory.ring";
  if (itemClass.includes("Boots")) return "armour.boots";

  if (itemClass.includes("Wand")) return "weapon.wand";
  if (itemClass.includes("Sceptre")) return "weapon.sceptre";
  if (itemClass.includes("Talisman")) return "weapon.talisman";

  if (itemClass.includes("Foci")) return "armour.focus";
  if (itemClass.includes("Shield")) return "armour.shield";
  if (itemClass.includes("Bucklers")) return "armour.buckler";
  if (itemClass.includes("Quiver")) return "armour.quiver";

  if (itemClass.includes("Staves")) return "weapon.staff";
  if (itemClass.includes("Quarterstaff")) return "weapon.warstaff";
  if (itemClass.includes("Spear")) return "weapon.spear";
  if (itemClass.includes("Two Hand Mace")) return "weapon.twomace";
  if (itemClass.includes("Two Hand Axe")) return "weapon.twoaxe";
  if (itemClass.includes("Two Hand Sword")) return "weapon.twosword";

  if (itemClass.includes("Bow")) return "weapon.bow";
  if (itemClass.includes("Crossbow")) return "weapon.crossbow";

  if (itemClass.includes("Waystone")) return "map.waystone";
  if (itemClass.includes("Tablet")) return "map.tablet";
  if (itemClass.includes("Ultimatum")) return "map.ultimatum";
  if (itemClass.includes("Barya")) return "map.barya";
  if (itemClass.includes("Relic")) return "sanctum.relic";
  if (itemClass.includes("Charm")) return "flask.charm";
  if (itemClass.includes("Jewel")) return "jewel";

  error(`--> no category found for: ${itemClass} <--`);
  return "";
};

export const findModId = (modType: string, modText: string) => {
  const id = mods?.[modType]?.[modText];

  if (id) info(`[${modType}][${modText}] -> id=${id}`);
  if (id) return id;

  warn(`[${modType}][${modText}] -> no id found`);
};

const modIdExceptions = (id: string, category: string): string => {
  // explicit.stat_2704225257 - is never used
  if (id == "explicit.stat_2704225257") {
    return "explicit.stat_3981240776";
  }

  // maximum Energy Shield / maximum Energy Shield (Local)
  if (
    id == "explicit.stat_3489782002" &&
    category != "Amulets" &&
    category != "Jewel"
  ) {
    return "explicit.stat_4052037485";
  }

  // # to Evasion Rating / # to Evasion Rating (local)
  if (
    id == "explicit.stat_2144192055" &&
    category != "Amulets" &&
    category != "Rings"
  ) {
    return "explicit.stat_53045048";
  }

  // # to Accuracy Rating / # to Accuracy Rating (Local)
  if (
    id == "explicit.stat_803737631" &&
    category != "Gloves" &&
    category != "Helmet" &&
    category != "Rings" &&
    category != "Quiver" &&
    category != "Amulets"
  ) {
    return "explicit.stat_691932474";
  }

  // increased Evasion Rating / increased Evasion Rating (Local)
  if (
    id == "explicit.stat_2106365538" &&
    category != "Amulets" &&
    category != "Rings"
  ) {
    return "explicit.stat_124859000";
  }

  // # to Armour / # to Armour (Local)
  if (id == "explicit.stat_809229260" && category != "Belts") {
    return "explicit.stat_3484657501";
  }

  // increased Armour / increased Armour (Local)
  if (
    id == "explicit.stat_2866361420" &&
    category != "Amulets" &&
    category != "Rings"
  ) {
    return "explicit.stat_1062208444";
  }

  // increased Attack Speed / increased Attack Speed (Local)
  if (
    id == "explicit.stat_681332047" &&
    category != "Quiver" &&
    category != "Jewel" &&
    category != "Rings" &&
    category != "Gloves"
  ) {
    return "explicit.stat_210067635";
  }

  // #% increased Block chance // #% increased Block chance (Local)
  if (
    id == "explicit.stat_4147897060" &&
    category != "Amulets" &&
    category != "Jewel"
  ) {
    return "explicit.stat_2481353198";
  }

  // Crown of Thorns - Pain Attunement
  if (id == "explicit.stat_3831171903|7" && category == "Helmets") {
    return "explicit.stat_98977150";
  }

  if (id == "explicit.stat_1416406066" && category != "Amulets") {
    return "explicit.stat_3984865854";
  }

  // Decompose has 2 variants for a wep and boots
  if (id == "skill.corpse_cloud" && category == "Boots") {
    id = "skill.corpse_cloud_triggered";
  }

  // to all Attributes
  if (
    id == "explicit.stat_2897413282" &&
    (category == "Amulets" || category == "Rings")
  ) {
    id = "explicit.stat_1379411836";
  }

  return id;
};

export interface PoeTradeQueryPayload {
  query?: {
    filters?: {
      equipment_filters?: {
        disabled: boolean;
        filters: {
          total_augment_sockets?: {
            min?: number;
            max?: number;
          };
        };
      };
      misc_filters?: {
        disabled: boolean;
        filters: {
          corrupted?: { option: boolean };
          sanctified?: { option: boolean };
          mirrored?: { option: boolean };
        };
      };
      req_filters?: {
        disabled: boolean;
        filters: {
          lvl?: MinMaxFilter;
          str?: MinMaxFilter;
          dex?: MinMaxFilter;
          int?: MinMaxFilter;
        };
      };
      type_filters?: {
        filters: {
          category?: { option: string };
          ilvl?: { min?: number; max?: number };
          quality?: { min?: number; max?: number };
          rarity?: { option: string };
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

// Supporting Helper Types
interface MinMaxFilter {
  min?: number;
  max?: number;
}

interface PoeStatGroup {
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

export const createQuery = (item: Item) => {
  const [query, setQuery] = createStore<PoeTradeQueryPayload>({
    query: {
      filters: {
        equipment_filters: {
          disabled: true,
          filters: {},
        },
        misc_filters: {
          disabled: true,
          filters: {},
        },
        req_filters: {
          disabled: true,
          filters: {},
        },
        type_filters: {
          filters: {},
        },
      },
      status: {
        option: "securable",
      },
    },

    sort: {
      price: "asc",
    },
  });
  const [stats, setStats] = createStore<StatGroup[]>([
    {
      filters: [],
      type: "and",
    },
    {
      filters: [],
      type: "and",
    },
  ]);

  const createFilters = () => {
    for (let i = 0; i < item.skill.length; i++) {
      let id = item.skill[i].id;

      id = modIdExceptions(id, item.category);

      setStats(0, "filters", (filters) => [
        ...filters,
        {
          disabled: item.skill[i].disabled,
          id: id,
          value: {
            min: item.skill[i]?.min,
            max: item.skill[i]?.max,
          },
        },
      ]);
    }

    for (let i = 0; i < item.enhancement.length; i++) {
      let id = item.enhancement[i].id;

      setStats(0, "filters", (filters) => [
        ...filters,
        {
          disabled: item.enhancement[i].disabled,
          id: id,
          value: {
            min: item.enhancement[i]?.min,
            max: item.enhancement[i]?.max,
          },
        },
      ]);
    }

    for (let i = 0; i < item.implicit.length; i++) {
      let id = item.implicit[i].id;

      setStats(0, "filters", (filters) => [
        ...filters,
        {
          disabled: item.implicit[i].disabled,
          id: id,
          value: {
            min: item.implicit[i]?.min,
            max: item.implicit[i]?.max,
          },
        },
      ]);
    }

    for (let i = 0; i < item.explicit.length; i++) {
      let id = item.explicit[i].id;

      id = modIdExceptions(id, item.category);

      if (item.explicit[i].fractured && !item.explicit[i].fractured?.disabled) {
        id = findModId("fractured", item.explicit[i].mod) ?? id;
      }

      setStats(1, "filters", (filters) => [
        ...filters,
        {
          disabled: item.explicit[i].disabled,
          id: id,
          value: {
            min: item.explicit[i]?.min,
            max: item.explicit[i]?.max,
          },
        },
      ]);
    }
  };

  const createQuery = () => {
    if (!item.name.disabled && item.rarity.value == "Unique") {
      setQuery("query", "name", item.name.value);
    }

    if (!item.type.disabled && item.type.value != "") {
      setQuery("query", "type", item.type.value);
    }

    if (
      !item.name.disabled &&
      item.rarity.value != "Unique" &&
      item.rarity.value != "Rare"
    ) {
      setQuery("query", "term", item.name.value);
    }

    setQuery("query", "stats", stats);

    // Type Filters
    setQuery("query", "filters", "type_filters", "filters", "category", {});
    setQuery(
      "query",
      "filters",
      "type_filters",
      "filters",
      "category",
      "option",
      convertToCategory(item.category),
    );

    if (!item.rarity.disabled) {
      setQuery("query", "filters", "type_filters", "filters", "rarity", {});
      setQuery(
        "query",
        "filters",
        "type_filters",
        "filters",
        "rarity",
        "option",
        item.rarity.value.toLowerCase(),
      );
    }

    if (!item.ilvl.disabled) {
      setQuery("query", "filters", "type_filters", "filters", "ilvl", {});
      setQuery(
        "query",
        "filters",
        "type_filters",
        "filters",
        "ilvl",
        "min",
        item.ilvl.value,
      );
    }

    if (!item.quality.disabled) {
      setQuery("query", "filters", "type_filters", "filters", "quality", {});
      setQuery(
        "query",
        "filters",
        "type_filters",
        "filters",
        "quality",
        "min",
        item.quality.value,
      );
    }

    // Equipment Filters
    if (!item.sockets.disabled) {
      setQuery(
        "query",
        "filters",
        "equipment_filters",
        "disabled",
        item.sockets.disabled,
      );
      setQuery(
        "query",
        "filters",
        "equipment_filters",
        "filters",
        "total_augment_sockets",
        {},
      );
      setQuery(
        "query",
        "filters",
        "equipment_filters",
        "filters",
        "total_augment_sockets",
        "min",
        item.sockets.value,
      );
    }

    // Requirements
    if (!item.requires.disabled) {
      setQuery(
        "query",
        "filters",
        "req_filters",
        "disabled",
        item.requires.disabled,
      );

      setQuery("query", "filters", "req_filters", "filters", "lvl", {});
      setQuery(
        "query",
        "filters",
        "req_filters",
        "filters",
        "lvl",
        "min",
        item.requires.value.level?.min,
      );
      setQuery(
        "query",
        "filters",
        "req_filters",
        "filters",
        "lvl",
        "max",
        item.requires.value.level?.max,
      );

      setQuery("query", "filters", "req_filters", "filters", "str", {});
      setQuery(
        "query",
        "filters",
        "req_filters",
        "filters",
        "str",
        "min",
        item.requires.value.str?.min,
      );
      setQuery(
        "query",
        "filters",
        "req_filters",
        "filters",
        "str",
        "max",
        item.requires.value.str?.max,
      );

      setQuery("query", "filters", "req_filters", "filters", "dex", {});
      setQuery(
        "query",
        "filters",
        "req_filters",
        "filters",
        "dex",
        "min",
        item.requires.value.dex?.min,
      );
      setQuery(
        "query",
        "filters",
        "req_filters",
        "filters",
        "dex",
        "max",
        item.requires.value.dex?.max,
      );

      setQuery("query", "filters", "req_filters", "filters", "int", {});
      setQuery(
        "query",
        "filters",
        "req_filters",
        "filters",
        "int",
        "min",
        item.requires.value.int?.min,
      );
      setQuery(
        "query",
        "filters",
        "req_filters",
        "filters",
        "int",
        "max",
        item.requires.value.int?.max,
      );
    }

    // Miscellaneous
    if (item.corrupted != undefined && !item.corrupted.disabled) {
      setQuery(
        "query",
        "filters",
        "misc_filters",
        "disabled",
        item.corrupted?.disabled,
      );
      setQuery("query", "filters", "misc_filters", "filters", "corrupted", {});
      setQuery(
        "query",
        "filters",
        "misc_filters",
        "filters",
        "corrupted",
        "option",
        item.corrupted?.value,
      );
    }

    if (item.sanctified != undefined && !item.sanctified.disabled) {
      setQuery(
        "query",
        "filters",
        "misc_filters",
        "disabled",
        item.sanctified?.disabled,
      );
      setQuery("query", "filters", "misc_filters", "filters", "sanctified", {});
      setQuery(
        "query",
        "filters",
        "misc_filters",
        "filters",
        "sanctified",
        "option",
        item.sanctified?.value,
      );
    }

    if (item.mirrored != undefined && !item.mirrored.disabled) {
      setQuery(
        "query",
        "filters",
        "misc_filters",
        "disabled",
        item.mirrored?.disabled,
      );
      setQuery("query", "filters", "misc_filters", "filters", "mirrored", {});
      setQuery(
        "query",
        "filters",
        "misc_filters",
        "filters",
        "mirrored",
        "option",
        item.mirrored?.value,
      );
    }
  };

  onMount(() => {
    createFilters();
    createQuery();
  });

  return query;
};
