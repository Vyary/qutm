import { invoke } from "@tauri-apps/api/core";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { For, onCleanup, onMount, Show } from "solid-js";
import { fetch } from "@tauri-apps/plugin-http";
import { createStore, reconcile } from "solid-js/store";
import { error, info } from "@tauri-apps/plugin-log";
import { store } from "@/lib/Store";
import { BaseWidget } from "../BaseWidget";

interface ItemInfo {
  id: string;
  name: string;
  image: string;
  category: string;
  detailsId: string;
}

export interface CurrencyResponse {
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

const parseItem = async () => {
  const itemString = await readText();

  const lines = itemString
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const item = {
    name: "",
    base: "",
    class: "",
    rarity: "",
    quantity: 1,
  };

  item.name = lines[2];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // if (i == 3 && line.includes("--------")) {
    //   item.base = line;
    // }
    //
    // if (line.startsWith("Item Class: ")) {
    //   item.class = line.substring(12).trim();
    // }
    //
    // if (line.startsWith("Rarity: ")) {
    //   item.rarity = line.substring(8).trim();
    // }

    if (line.startsWith("Stack Size: ")) {
      const match = line.match(/Stack Size:\s*([\d,]+)/);
      if (match) {
        item.quantity = parseInt(match[1].replace(/,/g, ""), 10);
      }
    }
  }

  return item;
};

function InventoryWidget(props: { shortcut: string }) {
  const [overviews, setOverviews] = createStore<ExchangePrices>();
  const [inventory, setInventory] = createStore<Record<string, number>>();

  const addToInventory = async (item: { name: string; quantity: number }) => {
    setInventory(item.name, item.quantity);
    info("added item: " + JSON.stringify(item));
    await store.set("inventory", inventory);
    await store.save();
  };

  const sorted = () =>
    Object.entries(inventory)
      .filter((el) => overviews[el[0]])
      .sort(
        (a, b) =>
          b[1] * overviews[b[0]]?.prices.divine -
          a[1] * overviews[a[0]]?.prices.divine,
      );

  const sliced = () => {
    const sliced = sorted().slice(0, 10);

    return sliced;
  };

  const refreshOverview = async () => {
    const o = await fetchOverviews();
    setOverviews(o);
    store.set("overviews", o);
    store.set("timestamp", Date.now());
    store.save();
  };

  onMount(async () => {
    try {
      await register(props.shortcut, async (e) => {
        if (e.state === "Pressed") {
          await invoke("os_copy");
          const item = await parseItem();
          addToInventory(item);
        }
      });
    } catch (e) {
      error("failed to register copy shortcut: " + e);
    }

    const inv = await store.get<Record<string, number>>("inventory");
    if (inv) setInventory(inv);

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
  });

  onCleanup(() => unregister(props.shortcut));

  return (
    <BaseWidget
      name="inventory"
      defaultPos={{ x: 545, y: 15 }}
      defaultWidth={{ w: 430 }}
      defaultTransparency={90}
    >
      <table class="table py-3 px-5">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Quantity</th>
            <th>Category</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <For each={sliced()}>
            {(item, i) => {
              const itemz = overviews[item[0]];

              return (
                <tr>
                  <th>{i() + 1}</th>
                  <td>
                    <div class="inline-flex gap-1 items-center justufy-center">
                      <img
                        src={`https://web.poecdn.com/${overviews[item[0]]?.image}`}
                        class="w-6 h-6 object-contain"
                      />
                      <span>{overviews[item[0]]?.name}</span>
                    </div>
                  </td>
                  <td>{item[1]}</td>
                  <td>{overviews[item[0]]?.category}</td>
                  <td class="font-bold">
                    {(
                      item[1] *
                      itemz.prices[
                        itemz.maxVolumeCurrency == "exalted"
                          ? "exalted"
                          : itemz.maxVolumeCurrency == "chaos"
                            ? "chaos"
                            : "divine"
                      ]
                    ).toFixed(2)}{" "}
                    {itemz.maxVolumeCurrency}
                  </td>
                </tr>
              );
            }}
          </For>
          <Show when={!sliced().length}>
            <tr>
              <td colspan="5" class="text-center py-4">
                No data found. Scan an in-game item by pressing{" "}
                <strong>{props.shortcut}</strong>
              </td>
            </tr>
          </Show>
        </tbody>
      </table>
    </BaseWidget>
  );
}

export { InventoryWidget };
