import { info } from "@tauri-apps/plugin-log";
import { mods } from "./Mods";
import { Item } from "./ParseItem";
import { createStore } from "solid-js/store";
import { onMount } from "solid-js";

interface RangeValue {
  min: number;
  max: number;
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

const findModId = (modType: string, modText: string) => {
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
            min: item.implicit[i].value,
            max: 1000,
          },
        },
      ]);
    }

    for (let i = 0; i < item.explicit.length; i++) {
      const id = findModId("explicit", item.explicit[i].mod) || "";
      if (id == "") continue;

      setStats(1, "filters", (filters) => [
        ...filters,
        {
          disabled: item.explicit[i].disabled,
          id: id,
          value: {
            min: item.explicit[i].value,
            max: 1000,
          },
        },
      ]);
    }
  };

  onMount(() => createFilters());

  return {
    query: {
      filters: {
        type_filters: {
          filters: {
            category: {
              option: item.category,
            },
            ilvl: {
              min: item.ilvl.disabled ? item.ilvl.value : 0,
            },
          },
        },
      },
      stats: JSON.stringify(stats),
      status: {
        option: "securable",
      },
    },
  };
};
