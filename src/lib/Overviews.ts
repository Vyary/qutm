import { store } from "@/lib/Store";
import { info } from "@tauri-apps/plugin-log";
import { createStore, reconcile } from "solid-js/store";
import { fetch } from "@tauri-apps/plugin-http";

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

type ExchangePrices = Record<
  string,
  {
    id: string;
    name: string;
    image: string;
    category: string;
    detailsId: string;
    maxVolumeCurrency: string;
    prices: {
      exalted: number;
      chaos: number;
      divine: number;
    };
  }
>;

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

const [overviews, setOverviews] = createStore<ExchangePrices>();

const fetchOverviews = async () => {
  const currencyCategories = [
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

  const ep: ExchangePrices = {};

  for (const cat of currencyCategories) {
    const response = await fetch(
      `https://poe.ninja/poe2/api/economy/exchange/current/overview?league=Forbidden+Rites&type=${cat}`,
      {
        method: "GET",
      },
    );

    info("fetched: " + cat);

    const data: CurrencyResponse = await response.json();

    const exaltedPrice = data.core.rates["exalted"];
    const chaosPrice = data.core.rates["chaos"];

    for (const item of data.items) {
      ep[item.name] = {
        id: item.id,
        name: item.name,
        image: item.image,
        category: item.category,
        detailsId: item.detailsId,
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

  return ep;
};

const refreshOverview = async () => {
  setOverviews(await fetchOverviews());
  saveOverviews();
};

const loadOverviews = async () => {
  if (
    Date.now() - ((await store.get<number>("timestamp")) ?? TWELVE_HOURS) >=
    TWELVE_HOURS
  ) {
    refreshOverview();
    return;
  }

  const overviews = await store.get<ExchangePrices>("overviews");
  if (overviews) setOverviews(reconcile(overviews));
  if (!overviews) {
    refreshOverview();
  }
};

const saveOverviews = async () => {
  store.set("overviews", overviews);
  store.set("timestamp", Date.now());
  store.save();
};

export { overviews, loadOverviews };
