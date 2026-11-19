import { error, info } from "@tauri-apps/plugin-log";
import { createSignal, createStore } from "solid-js";
import { store } from "./Store";
import { fetch } from "@tauri-apps/plugin-http";
import { league } from "@/components/Settings";

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

export const [overviews, setOverviews] = createStore<ExchangePrices>({});
export const [ts, setTs] = createSignal<number>(0);
const [overviewsLeague, setOverviewsLeague] = createSignal("");
const isStale = (t?: number) => !t || Date.now() - t >= TWELVE_HOURS;
let inflight: Promise<void> | null = null;
let inflightLeague = "";

const fetchExchange = async (category: string, league: string) => {
  const response = await fetch(
    `https://poe.ninja/poe2/api/economy/exchange/current/overview?league=${league}&type=${category}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) throw new Error(`${category}: HTTP ${response.status}`);
  info("fetched: " + category);

  return await response.json();
};

const fetchUnique = async (category: string, league: string) => {
  const response = await fetch(
    `https://poe.ninja/poe2/api/economy/stash/current/item/overview?league=${league}&type=${category}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) throw new Error(`${category}: HTTP ${response.status}`);
  info("fetched: " + category);

  return await response.json();
};

const fetchOverviews = async (league: string) => {
  const [exchanges, uniques]: [CurrencyResponse[], UniqueResponse[]] =
    await Promise.all([
      Promise.all(EXCHANGE_CATEGORIES.map((c) => fetchExchange(c, league))),
      Promise.all(UNIQUE_CATEGORIES.map((c) => fetchUnique(c, league))),
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

const saveOverviews = async (data: ExchangePrices, league: string) => {
  const now = Date.now();
  await store.set("overviews", data);
  await store.set("timestamp", now);
  await store.set("overviewLeague", league);
  await store.save();
  setTs(now);
};

const refreshOverview = async () => {
  const lg = league();

  while (inflight) {
    if (inflightLeague === lg) return inflight;
    await inflight;
  }

  inflightLeague = lg;
  inflight = (async () => {
    try {
      const data = await fetchOverviews(lg);
      setOverviews(() => data);
      setOverviewsLeague(lg);
      await saveOverviews(data, lg);
    } catch (e) {
      error(`overview refresh failed: ${e}`);
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

export const loadOverviews = async () => {
  const [savedTs, cached, savedLeague] = await Promise.all([
    store.get<number>("timestamp"),
    store.get<ExchangePrices>("overviews"),
    store.get<string>("overviewLeague"),
  ]);

  if (savedTs) setTs(savedTs);
  if (savedLeague) setOverviewsLeague(savedLeague);
  if (cached) setOverviews(() => cached);

  if (!cached || isStale(savedTs) || savedLeague !== league())
    await refreshOverview();
};

export const checkOverviews = async () => {
  info(`overviews league: ${overviewsLeague()}, league: ${league()}`);
  if (isStale(ts() || 0) || overviewsLeague() != league()) {
    await refreshOverview();
  }
};
