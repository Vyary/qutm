import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { info } from "@tauri-apps/plugin-log";
import { BaseWidget } from "../BaseWidget";
import {
  addToInventory,
  inventory,
  loadInventory,
  removeItem,
  saveInventory,
} from "./InventoryState";
import { togglePassthrough } from "@/lib/Passthrough";
import { loadOverviews, overviews } from "@/lib/Overviews";
import { store } from "@/lib/Store";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";

const parseItem = async (itemString: string) => {
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
    }
  }

  return item;
};

interface place {
  x: number;
  y: number;
  click: boolean;
}

const [places, setPlaces] = createSignal<place[]>([]);

const [autoScanAction, setAutoScanAction] = createSignal<() => Promise<void>>(
  () => Promise.resolve(),
);
const [addStepAction, setAddStepAction] = createSignal<() => Promise<void>>(
  () => Promise.resolve(),
);
const [addMouseClickAction, setAddMouseClickAction] = createSignal<
  () => Promise<void>
>(() => Promise.resolve());

function InventoryWidget(props: { shortcut: string }) {
  const [scanning, setScanning] = createSignal(false);
  const filtered = () =>
    Object.entries(inventory).filter((el) => overviews[el[0]]);

  const sorted = () =>
    filtered().sort(
      (a, b) =>
        b[1] * overviews[b[0]]?.prices.divine -
        a[1] * overviews[a[0]]?.prices.divine,
    );

  const sliced = () => sorted().slice(0, 10);

  const currencyTotals = createMemo(() => {
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

  const copyName = async (name: string) => {
    await writeText(name);
    togglePassthrough();
  };

  const addItem = async () => {
    const itemString: string = await invoke("os_copy");
    const item = await parseItem(itemString);
    addToInventory(item);
  };

  const autoScan = async () => {
    setScanning(!scanning());

    for (const p of places()) {
      if (!scanning()) {
        break;
      }

      if (p.click) {
        await invoke("mouse_move", { x: p.x, y: p.y });
        await invoke("mouse_click");
        continue;
      }

      await invoke("mouse_move", { x: p.x, y: p.y });
      await addItem();
    }

    setScanning(false);
  };

  const addStep = async () => {
    const loc: number[] = await invoke("get_global_mouse_position");
    setPlaces([...places(), { x: loc[0], y: loc[1], click: false }]);
    await addItem();
  };

  const mouseClick = async () => {
    const loc: number[] = await invoke("get_global_mouse_position");
    setPlaces([...places(), { x: loc[0], y: loc[1], click: true }]);
    await invoke("mouse_move", { x: loc[0], y: loc[1] });
    await invoke("mouse_click");
  };

  let unlisten: UnlistenFn = () =>
    info("inventory widget on close unlisten not updated");

  onMount(async () => {
    loadOverviews();
    loadInventory();

    setAutoScanAction(() => autoScan);
    setAddStepAction(() => addStep);
    setAddMouseClickAction(() => mouseClick);

    const p = await store.get<place[]>("places");
    if (p) setPlaces(p);

    unlisten = await getCurrentWindow().onCloseRequested(async () => {
      await store.set("places", places());
      await store.save();
      saveInventory();
    });
  });

  onCleanup(async () => {
    await store.set("places", places());
    await store.save();

    saveInventory();
    unlisten();
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
            <th></th>
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
                      <span onClick={() => copyName(overviews[item[0]].name)}>
                        {overviews[item[0]].name}
                      </span>
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
                  <td>
                    <button
                      onClick={() => removeItem(item[0])}
                      class="btn btn-circle btn-ghost btn-sm text-base-content/40 hover:text-error hover:bg-error/10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-trash preview-icon"
                      >
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
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

        <tfoot>
          <tr>
            <th class="text-primary-content">Total</th>
            <th></th>
            <th class="font-mono text-primary-content">
              {currencyTotals()["divine"]}d
            </th>
            <th class="font-mono text-primary-content">
              {currencyTotals()["chaos"]}c
            </th>
            <th class="font-mono text-primary-content">
              {currencyTotals()["exalted"]}ex
            </th>
            <th></th>
          </tr>
        </tfoot>
      </table>
    </BaseWidget>
  );
}

export {
  InventoryWidget,
  setPlaces,
  autoScanAction,
  addStepAction,
  addMouseClickAction,
};
