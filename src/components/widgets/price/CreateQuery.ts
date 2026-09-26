import { error, info } from "@tauri-apps/plugin-log";
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
  if (itemClass.includes("Belt")) return "accessory.belt";
  if (itemClass.includes("Amulet")) return "accessory.amulet";
  if (itemClass.includes("Rings")) return "accessory.ring";
  if (itemClass.includes("Boots")) return "armour.boots";

  if (itemClass.includes("Wand")) return "weapon.wand";
  if (itemClass.includes("Sceptre")) return "weapon.sceptre";
  if (itemClass.includes("Talisman")) return "weapon.talisman";

  if (itemClass.includes("Foci")) return "armour.focus";
  if (itemClass.includes("Shield")) return "armour.shield";
  if (itemClass.includes("Quiver")) return "armour.quiver";

  if (itemClass.includes("Staff")) return "weapon.staff";
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

  error("no category found for: " + itemClass);
  return "";
};

const findModId = (modType: string, modText: string) => {
  // edge cases
  if (modText.includes("Charm Slots"))
    modText = modText.replace("Slots", "Slot");

  const id = mods[modType][modText];
  if (id) return id;

  info("couldnt find id for mod: " + modText);
};

export const createQuery = (item: Item) => {
  const [stats, setStats] = createStore<StatGroup[]>([
    {
      filters: [],
      type: "and",
    },
    {
      filters: [],
      type: "and",
    },
    {
      filters: [],
      type: "count",
      value: {
        min: 1,
      },
    },
  ]);

  const createFilters = () => {
    for (let i = 0; i < item.implicit.length; i++) {
      const id = findModId("implicit", item.implicit[i].mod) || "";
      if (id == "") continue;

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
      let id = findModId("explicit", item.explicit[i].mod) || "";
      if (id == "") continue;
      if (id == "explicit.stat_2704225257") id = "explicit.stat_3981240776";

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

  onMount(() => createFilters());

  return {
    query: {
      filters: {
        req_filters: {
          disabled: item.requires.disabled,
          filters: {
            lvl: {
              min: item.requires.value.level?.min,
              max: item.requires.value.level?.max,
            },
            str: {
              min: item.requires.value.str?.min,
              max: item.requires.value.str?.max,
            },
            dex: {
              min: item.requires.value.dex?.min,
              max: item.requires.value.dex?.max,
            },
            int: {
              min: item.requires.value.int?.min,
              max: item.requires.value.int?.max,
            },
          },
        },
        type_filters: {
          filters: {
            category: {
              option: convertToCategory(item.category),
            },
            ilvl: {
              min: item.ilvl?.value,
            },
            // quality: {
            //   min: 0,
            // },
            rarity: {
              option: item.rarity.toLowerCase(),
            },
          },
        },
      },
      name:
        !item.name.disabled && item.rarity == "Unique"
          ? item.name.value
          : undefined,
      stats: stats,
      status: {
        option: "securable",
      },
      type: !item.type.disabled ? item.type.value : undefined,
    },
  };
};
