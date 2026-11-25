import { overviews } from "@/lib/Overviews";
import { store } from "@/lib/Store";
import { invoke } from "@tauri-apps/api/core";
import { error, info } from "@tauri-apps/plugin-log";
import { createMemo, createStore, snapshot } from "solid-js";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { togglePassthrough } from "@/lib/Passthrough";

type inventoryRecord = Record<string, number>;

export const [inventory, setInventory] = createStore<inventoryRecord>({});

export const filtered = createMemo(() =>
  Object.entries(inventory).filter((el) => overviews[el[0]]),
);

const sorted = () =>
  filtered().sort(
    (a, b) =>
      b[1] * overviews[b[0]]?.prices.divine -
      a[1] * overviews[a[0]]?.prices.divine,
  );

export const inventoryTopTen = () => sorted().slice(0, 10);

export const inventoryTotal = createMemo(() => {
  const totals: Record<string, number> = { exalted: 0, chaos: 0, divine: 0 };

  for (const [key, quantity] of filtered()) {
    const item = overviews[key];
    const maxCurr = item.maxVolumeCurrency;

    const basePrice =
      item.prices[
        maxCurr == "exalted"
          ? "exalted"
          : maxCurr == "chaos"
            ? "chaos"
            : "divine"
      ] ?? 0;

    totals[maxCurr] += quantity * basePrice;
  }

  return {
    exalted: Number(totals.exalted.toFixed(2)),
    chaos: Number(totals.chaos.toFixed(2)),
    divine: Number(totals.divine.toFixed(2)),
  };
});

export const addItem = (item: { name: string; quantity: number }) => {
  if (!overviews[item.name].prices) return;
  setInventory((s) => {
    s[item.name] = item.quantity;
  });
};

export const removeItem = (name: string) => {
  setInventory((s) => {
    delete s[name];
  });
};

export const clearInventory = async () => {
  await store.delete("inventory");
  setInventory(() => ({}));
};

export const saveInventory = async () => {
  await store.set("inventory", snapshot(inventory));
  await store.save();
  info("inventory saved");
};

export const loadInventory = async () => {
  const inv = await store.get<inventoryRecord>("inventory");
  if (inv) setInventory(() => inv);
};

const simpleParseItem = (itemString: string) => {
  const lines = itemString
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const item = {
    name: "",
    quantity: 1,
  };

  item.name = lines[2];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("Stack Size: ")) {
      const match = line.match(/Stack Size:\s*([\d,]+)/);
      if (match) {
        item.quantity = parseInt(match[1].replace(/,/g, ""), 10);
      }

      break;
    }
  }

  return item;
};

export const scanAndAdd = async () => {
  try {
    const itemCopy: string = await invoke("os_copy");
    const item = simpleParseItem(itemCopy);
    addItem(item);
  } catch (e) {
    error(`failed to add item: ${e}`);
  }
};

export const copyName = async (name: string) => {
  await writeText(name);
  togglePassthrough();
};
