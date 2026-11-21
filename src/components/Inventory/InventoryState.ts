import { overviews } from "@/lib/Overviews";
import { store } from "@/lib/Store";
import { invoke } from "@tauri-apps/api/core";
import { error, info } from "@tauri-apps/plugin-log";
import { createMemo, createSignal, createStore, snapshot } from "solid-js";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { disablePassthrough, togglePassthrough } from "@/lib/Passthrough";

interface Place {
  x: number;
  y: number;
  click: boolean;
}

type inventoryRecord = Record<string, number>;

export const [inventory, setInventory] = createStore<inventoryRecord>({});
export const [places, setPlaces] = createSignal<Place[]>([]);
let scanning = false;

const filtered = createMemo(() =>
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
  setInventory((s) => (s = {}));
};

export const clearRecording = async () => {
  await store.delete("places");
  setPlaces(() => []);
};

export const saveInventory = async () => {
  await store.set("inventory", snapshot(inventory));
  await store.set("places", snapshot(places()));
  await store.save();
  info("inventory saved");
};

export const loadInventory = async () => {
  const [inv, pls] = await Promise.all([
    store.get<inventoryRecord>("inventory"),
    store.get<Place[]>("places"),
  ]);
  if (inv) setInventory(() => inv);
  if (pls) setPlaces(() => pls);
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

const scanItem = async () => {
  try {
    const itemCopy: string = await invoke("os_copy");
    const item = simpleParseItem(itemCopy);
    addItem(item);
  } catch (e) {
    error(`failed to add item: ${e}`);
  }
};

export const addStep = async () => {
  const loc: number[] = await invoke("get_global_mouse_position");
  setPlaces([...places(), { x: loc[0], y: loc[1], click: false }]);
  await scanItem();
};

export const addMouseClick = async () => {
  const loc: number[] = await invoke("get_global_mouse_position");
  setPlaces([...places(), { x: loc[0], y: loc[1], click: true }]);
  await invoke("mouse_move", { x: loc[0], y: loc[1] });
  await invoke("mouse_click");
};

export const copyName = async (name: string) => {
  await writeText(name);
  togglePassthrough();
};

export const autoScan = async () => {
  scanning = !scanning;

  for (const p of places()) {
    if (!scanning) {
      break;
    }

    if (p.click) {
      await invoke("mouse_move", { x: p.x, y: p.y });
      await invoke("mouse_click");
      await new Promise((r) => setTimeout(r, 60));
      continue;
    }

    await invoke("mouse_move", { x: p.x, y: p.y });
    await scanItem();
  }

  scanning = false;
  disablePassthrough();
};
