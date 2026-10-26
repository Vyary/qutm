import { error, info, warn } from "@tauri-apps/plugin-log";
import { createStore, produce } from "solid-js/store";
import { onMount } from "solid-js";
import { mods } from "./Mods";
import {
  CLASSES,
  Item,
  ItemMod,
  MinMax,
  PoeStatGroup,
  PoeTradeQueryPayload,
  Toggleable,
} from "./Types";

const convertToCategory = (itemClass: string) => {
  const c = CLASSES[itemClass];
  if (c) return c.id;

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

// Item key -> trade API key, for filter groups whose names differ.
const MAP_KEYS: Record<string, string> = {
  bonus: "map_bonus",
  iir: "map_iir",
  magicMonsters: "map_magic_monsters",
  packsize: "map_packsize",
  rareMonsters: "map_rare_monsters",
  revives: "map_revives",
  tier: "map_tier",
};

const MISC_KEYS: Record<string, string> = {
  areaLevel: "area_level",
  corrupted: "corrupted",
  crafted: "crafted",
  desecrated: "desecrated",
  foreseeing: "foreseeing",
  fractured: "fractured_item",
  gemLevel: "gem_level",
  gemSockets: "gem_sockets",
  identified: "identified",
  mirrored: "mirrored",
  mutated: "mutated",
  sanctified: "sanctified",
  sanctumGold: "sanctum_gold",
  stackSize: "stack_size",
  twiceCorrupted: "twice_corrupted",
  unidentifiedTier: "unidentified_tier",
  veiled: "veiled",
};

const EQ_KEYS: Record<string, string> = {
  reloadTime: "reload_time",
  sockets: "total_augment_sockets",
};

const isEnabled = <T>(t?: Toggleable<T>): t is Toggleable<T> =>
  t !== undefined && !t.disabled;

const toRange = (v: MinMax): MinMax => ({ min: v.min, max: v.max });

const applyFilters = (
  target: { filters: Record<string, unknown> },
  source: Record<string, Toggleable<MinMax | boolean | string> | undefined>,
  keyMap: Record<string, string> = {},
): boolean => {
  let any = false;

  for (const [key, t] of Object.entries(source)) {
    if (!isEnabled(t)) continue;

    const apiKey = keyMap[key] ?? key;
    const value = t.value;

    target.filters[apiKey] =
      typeof value === "object" ? toRange(value) : { option: value };
    any = true;
  }

  return any;
};

const toStatFilter = (mod: ItemMod, id: string) => ({
  disabled: mod.disabled,
  id,
  value: { min: mod.min, max: mod.max },
});

export const createQuery = (item: Item) => {
  const [query, setQuery] = createStore<PoeTradeQueryPayload>({
    query: {
      filters: {
        equipment_filters: { disabled: true, filters: {} },
        misc_filters: { disabled: true, filters: {} },
        req_filters: { disabled: true, filters: {} },
        type_filters: { filters: {} },
        map_filters: { disabled: true, filters: {} },
      },
      status: { option: "securable" },
    },
    sort: { price: "asc" },
  });

  const [stats, setStats] = createStore<PoeStatGroup[]>([
    { filters: [], type: "and" },
    { filters: [], type: "and" },
  ]);

  const category = item.TypeFilters.filters.category.value;

  const createFilters = () => {
    const pushStats = (
      group: number,
      filters: ReturnType<typeof toStatFilter>[],
    ) => setStats(group, "filters", (prev) => [...prev, ...filters]);

    pushStats(
      0,
      item.skill.map((m) => toStatFilter(m, modIdExceptions(m.id, category))),
    );

    pushStats(
      0,
      item.enhancement.map((m) => toStatFilter(m, m.id)),
    );

    pushStats(
      0,
      item.implicit.map((m) => toStatFilter(m, m.id)),
    );

    pushStats(
      1,
      item.explicit.map((m) => {
        let id = modIdExceptions(m.id, category);

        if (m.fractured && !m.fractured.disabled) {
          id = findModId("fractured", m.mod) ?? id;
        }

        return toStatFilter(m, id);
      }),
    );
  };

  const buildQuery = () => {
    setQuery(
      produce((q) => {
        const query = q.query!;
        const filters = query.filters!;

        // Name / type / term
        const rarity = item.TypeFilters.filters.rarity;
        const rarityValue = rarity?.value;

        if (isEnabled(item.name)) {
          if (rarityValue == "Unique") {
            query.name = item.name.value;
          } else if (rarityValue != "Rare") {
            query.term = item.name.value;
          }
        }

        if (isEnabled(item.type) && item.type.value != "") {
          query.type = item.type.value;
        }

        query.stats = stats;

        // Type filters
        const typeFilters = filters.type_filters!.filters;
        const { ilvl, quality } = item.TypeFilters.filters;

        typeFilters.category = { option: convertToCategory(category) };

        if (isEnabled(rarity)) {
          typeFilters.rarity = { option: rarity.value.toLowerCase() };
        }
        if (isEnabled(ilvl)) typeFilters.ilvl = toRange(ilvl.value);
        if (isEnabled(quality)) typeFilters.quality = toRange(quality.value);

        // Equipment filters
        if (
          !item.EquipmentFilters.disabled &&
          applyFilters(
            filters.equipment_filters!,
            item.EquipmentFilters.filters,
            EQ_KEYS,
          )
        ) {
          filters.equipment_filters!.disabled = false;
        }

        // Requirements
        if (
          !item.ReqFilters.disabled &&
          applyFilters(filters.req_filters!, item.ReqFilters.filters)
        ) {
          filters.req_filters!.disabled = false;
        }

        // Map filters (waystones etc.)
        if (
          !item.MapFilters.disabled &&
          applyFilters(filters.map_filters!, item.MapFilters.filters, MAP_KEYS)
        ) {
          filters.map_filters!.disabled = false;
        }

        // Miscellaneous
        if (
          !item.MiscFilters.disabled &&
          applyFilters(
            filters.misc_filters!,
            item.MiscFilters.filters,
            MISC_KEYS,
          )
        ) {
          filters.misc_filters!.disabled = false;
        }
      }),
    );
  };

  onMount(() => {
    createFilters();
    buildQuery();
  });

  return query;
};
