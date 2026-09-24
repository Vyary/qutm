import { invoke } from "@tauri-apps/api/core";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { error } from "@tauri-apps/plugin-log";
import { BaseWidget } from "../BaseWidget";
import { loadOverviews, overviews } from "./Overviews";
import {
  addToInventory,
  inventory,
  loadInventory,
  saveInventory,
} from "./InventoryState";
import { loadStashArea, saveStashArea, stashArea } from "./StashScanner";

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

  onMount(async () => {
    loadOverviews();
    loadInventory();
    loadStashArea();

    try {
      await register(props.shortcut, async (e) => {
        if (e.state === "Pressed") {
          await invoke("os_copy");
          const itemString = await readText();
          const item = await parseItem(itemString);
          addToInventory(item);
        }
      });
    } catch (e) {
      error("failed to register copy shortcut: " + e);
    }

    try {
      await register("Alt+D", async (e) => {
        if (e.state === "Pressed") {
          if (scanning()) {
            setScanning(false);
            return;
          }

          setScanning(true);

          const blockW = () => (stashArea().endX - stashArea().startX) / 12;
          const blockH = () => (stashArea().endY - stashArea().startY) / 12;
          const halfBlockW = () => blockW() / 2;
          const halfBlockH = () => blockH() / 2;

          const gridWidth = 12;
          const gridHeight = 12;

          for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
              if (!scanning()) break;

              const targetX = Math.round(
                stashArea().startX + halfBlockW() + col * blockW(),
              );
              const targetY = Math.round(
                stashArea().startY + halfBlockH() + row * blockH(),
              );

              await invoke("os_move_mouse", { x: targetX, y: targetY });
            }
          }
        }
      });
    } catch (e) {
      error("failed to register copy shortcut: " + e);
    }
  });

  onCleanup(() => {
    saveInventory();
    saveStashArea();
    unregister(props.shortcut);
    unregister("Alt+D");
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
          </tr>
        </tfoot>
      </table>
    </BaseWidget>
  );
}

export { InventoryWidget };
