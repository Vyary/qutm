import { store } from "@/lib/Store";
import { info } from "@tauri-apps/plugin-log";
import { createStore, reconcile } from "solid-js/store";
import { fetch } from "@tauri-apps/plugin-http";
import { createSignal } from "solid-js";

interface ItemInfo {
  id: string;
  name: string;
  image: string;
  category: string;
  detailsId: string;
}

interface CurrencyResponse {
  core: {
    primary: string;
    secondary: string;
    rates: Record<string, number>;
    items: ItemInfo[];
  };
  lines: {
    id: string;
    primaryValue: number;
    maxVolumeCurrency: string;
  }[];
  items: ItemInfo[];
}

interface UniqueResponse {
  core: {
    primary: string;
    secondary: string;
    rates: Record<string, number>;
    items: ItemInfo[];
  };
  lines: {
    itemId: string;
    name: string;
    baseType: string;
    icon: string;
    category: string;
    primaryValue: number;
  }[];
}

type ExchangePrices = Record<
  string,
  {
    id: string;
    name: string;
    base: string;
    image: string;
    category: string;
    maxVolumeCurrency: string;
    prices: {
      exalted: number;
      chaos: number;
      divine: number;
    };
  }
>;

const EXCHANGE_CATEGORIES = [
  "Currency",
  "Fragments",
  "Abyss",
  "UncutGems",
  "LineageSupportGems",
  "Essences",
  "SoulCores",
  "Idols",
  "Runes",
  "Ritual",
  "Expedition",
  "Delirium",
  "Breach",
  "Verisium",
];
const UNIQUE_CATEGORIES = [
  "UniqueWeapons",
  "UniqueArmours",
  "UniqueAccessories",
  "UniqueFlasks",
  "UniqueCharms",
  "UniqueJewels",
  "UniqueSanctumRelics",
];
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const LEAGUE = "Forbidden Rites";

export const [overviews, setOverviews] = createStore<ExchangePrices>();
export const [ts, setTs] = createSignal<number>(0);
const isStale = (t?: number) => !t || Date.now() - t >= TWELVE_HOURS;
let inflight: Promise<void> | null = null;

const fetchExchange = async (category: string) => {
  const response = await fetch(
    `https://poe.ninja/poe2/api/economy/exchange/current/overview?league=${LEAGUE}&type=${category}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) throw new Error(`${category}: HTTP ${response.status}`);
  info("fetched: " + category);

  return await response.json();
};

const fetchUnique = async (category: string) => {
  const response = await fetch(
    `https://poe.ninja/poe2/api/economy/stash/current/item/overview?league=${LEAGUE}&type=${category}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) throw new Error(`${category}: HTTP ${response.status}`);
  info("fetched: " + category);

  return await response.json();
};

const fetchOverviews = async () => {
  const [exchanges, uniques]: [CurrencyResponse[], UniqueResponse[]] =
    await Promise.all([
      Promise.all(EXCHANGE_CATEGORIES.map((c) => fetchExchange(c))),
      Promise.all(UNIQUE_CATEGORIES.map((c) => fetchUnique(c))),
    ]);

  const ep: ExchangePrices = {};

  for (const data of exchanges) {
    const exaltedPrice = data.core.rates["exalted"];
    const chaosPrice = data.core.rates["chaos"];

    for (const item of data.items) {
      ep[item.name] = {
        id: item.id,
        name: item.name,
        base: "",
        image: item.image,
        category: item.category,
        maxVolumeCurrency: "",
        prices: { exalted: 0, chaos: 0, divine: 0 },
      };

      for (const price of data.lines) {
        if (ep[item.name].id == price.id) {
          ep[item.name].prices.exalted = price.primaryValue * exaltedPrice;
          ep[item.name].prices.chaos = price.primaryValue * chaosPrice;
          ep[item.name].prices.divine = price.primaryValue;
          ep[item.name].maxVolumeCurrency = price.maxVolumeCurrency;
        }
      }
    }
  }

  for (const data of uniques) {
    const exaltedPrice = data.core.rates["exalted"];
    const chaosPrice = data.core.rates["chaos"];

    for (const item of data.lines) {
      ep[item.itemId] = {
        id: item.itemId,
        name: item.name,
        base: item.baseType,
        image: item.icon,
        category: item.category.replace("[", "").replace("]", ""),
        maxVolumeCurrency: "divine",
        prices: {
          exalted: item.primaryValue * exaltedPrice,
          chaos: item.primaryValue * chaosPrice,
          divine: item.primaryValue,
        },
      };
    }
  }

  return ep;
};

const saveOverviews = async (data: ExchangePrices) => {
  const now = Date.now();
  await store.set("overviews", data);
  await store.set("timestamp", now);
  await store.save();
  setTs(now);
};

const refreshOverview = () => {
  inflight ??= (async () => {
    try {
      const data = await fetchOverviews();
      setOverviews(reconcile(data));
      await saveOverviews(data);
    } catch (e) {
      console.error("overview refresh failed: ", e);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};

export const loadOverviews = async () => {
  const [ts, cached] = await Promise.all([
    store.get<number>("timestamp"),
    store.get<ExchangePrices>("overviews"),
  ]);
  if (ts) setTs(ts);
  if (cached) setOverviews(reconcile(cached));
  if (!cached || isStale(ts)) await refreshOverview();
};

export const checkOverviews = async () => {
  if (isStale(ts() || 0)) await refreshOverview();
};
