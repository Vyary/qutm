import { invoke } from "@tauri-apps/api/core";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { For, onMount, Show } from "solid-js";
import { fetch } from "@tauri-apps/plugin-http";
import { ItemInfo, ItemRecord, ItemsRecord } from "./itemsRecord.ts";
import { BaseWidget } from "./BaseWidget.tsx";
import { createStore } from "solid-js/store";
import { store } from "../../state/Store.ts";
import { error, info } from "@tauri-apps/plugin-log";

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
  }[];
  items: ItemInfo[];
}

const fetchOverview = async () => {
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

  const ItemsRecord: ItemRecord = {};

  for (const cat of currencyCategories) {
    const response = await fetch(
      `https://poe.ninja/poe2/api/economy/exchange/current/overview?league=Forbidden+Rites&type=${cat}`,
      {
        method: "GET",
      },
    );
    const data: CurrencyResponse = await response.json();

    for (const item of data.items) {
      ItemsRecord[item.name] = item;
    }
  }
};

const fetchItemData = async (league: string, type: string, id: string) => {
  const response = await fetch(
    `https://poe.ninja/poe2/api/economy/exchange/current/details?league=${league}&type=${type}&id=${id}`,
    {
      method: "GET",
    },
  );
  info(
    `fetchItemData link: https://poe.ninja/poe2/api/economy/exchange/current/details?league=${league}&type=${type}&id=${id}`,
  );

  const data = await response.json();

  return data;
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

    if (i == 3 && line.includes("--------")) {
      item.base = line;
    }

    if (line.startsWith("Item Class: ")) {
      item.class = line.substring(12).trim();
    }

    if (line.startsWith("Rarity: ")) {
      item.rarity = line.substring(8).trim();
    }

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
  const [inventory, setInventory] = createStore<ItemRecord>({});

  const sorted = () => {
    const items = Object.values(inventory);
    return items.sort(
      (a, b) => b.prices?.divine * b.quantity - a.prices?.divine * a.quantity,
    );
  };

  const sliced = () => sorted().slice(0, 10);

  const addToInventory = async () => {
    const sItem = await parseItem();
    const dItem = ItemsRecord[sItem.name];
    dItem.quantity = sItem.quantity;
    const details = await fetchItemData(
      "Forbidden+Rites",
      dItem.category,
      dItem.detailsId,
    );
    if (!dItem.prices) {
      dItem.prices = { divine: 0, exalted: 0, chaos: 0 };
    }
    const dPrice = details["pairs"].filter((i: any) => i.id == "divine")[0][
      "history"
    ][0]["rate"];
    dItem.prices.divine = dPrice;

    setInventory(dItem.id, dItem);
    setInventory(dItem.id, "quantity", dItem.quantity);
    setInventory(dItem.id, "prices", "divine", dItem.prices.divine);

    await store.set("inventory", inventory);
    await store.save();
  };

  onMount(async () => {
    try {
      await register(props.shortcut, async (e) => {
        if (e.state === "Pressed") {
          await invoke("os_copy");
          await new Promise((resolve) => setTimeout(resolve, 100));
          addToInventory();
        }
      });
    } catch (e) {
      error("failed to register copy shortcut: " + e);
    }

    const inv = (await store.get("inventory")) as ItemRecord;
    if (inv) {
      setInventory(inv);
    }
  });

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
            {(item, i) => (
              <tr>
                <th>{i() + 1}</th>
                <td>
                  <div class="inline-flex gap-1 items-center justufy-center">
                    <img
                      src={`https://web.poecdn.com/${item.image}`}
                      class="w-6 h-6 object-contain"
                    />
                    <span>{item.name}</span>
                  </div>
                </td>
                <td>{item.quantity}</td>
                <td>{item.category}</td>
                <td class="font-bold">
                  {(item.quantity * item.prices?.divine).toFixed(2)}d
                </td>
              </tr>
            )}
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

export { InventoryWidget as Inventory };
