import { createMemo, createSignal, For, onSettled } from "solid-js";
import { WidgetBase } from "../WidgetBase";
import {
  addMouseClick,
  addStep,
  autoScan,
  copyName,
  inventoryTopTen,
  inventoryTotal,
  loadInventory,
  removeItem,
  saveInventory,
} from "./InventoryState";
import { createShortcut } from "@/lib/Shortcut";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { setLeague } from "../Settings";
import { checkOverviews, overviews } from "@/lib/Overviews";

export const [showInventory, setShowInventory] = createSignal(false);

export function Inventory() {
  createShortcut("autoScan", "F5", false, autoScan);
  createShortcut("addStep", "F6", false, addStep);
  createShortcut("addMouseClick", "F7", false, addMouseClick);

  const onLoad = () => {
    loadInventory();
  };

  const cleanUp = async () => {
    await saveInventory();
  };

  onSettled(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    onLoad();

    getCurrentWindow()
      .onCloseRequested(async () => await cleanUp())
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch((e) => error(String(e)));

    return () => {
      cleanUp();
      disposed = true;
      unlisten?.();
    };
  });

  return (
    <WidgetBase
      name="inventory"
      defaultPos={{ x: 545, y: 15 }}
      defaultTransparency={90}
      transparencySlider
    >
      <div class="p-3 overflow-x-auto">
        <table class="table table-sm bg-transparent">
          <thead>
            <tr class="border-b border-base-content/10">
              <th class="w-8"></th>
              <th class="text-xs font-medium uppercase tracking-wider text-base-content/50">
                Name
              </th>
              <th class="text-right text-xs font-medium uppercase tracking-wider text-base-content/50">
                Qty
              </th>
              <th class="text-xs font-medium uppercase tracking-wider text-base-content/50">
                Category
              </th>
              <th class="text-right text-xs font-medium uppercase tracking-wider text-base-content/50">
                Value
              </th>
              <th class="w-8"></th>
            </tr>
          </thead>

          <tbody>
            <For
              each={inventoryTopTen()}
              keyed={(item) => item}
              fallback={
                <tr>
                  <td
                    colspan="6"
                    class="py-8 text-center text-sm text-base-content/50"
                  >
                    No data found. Scan an in-game item.
                  </td>
                </tr>
              }
            >
              {(item, i) => {
                const name = createMemo(() => item()[0]);
                const ovItem = createMemo(() => overviews[name()]);
                const maxC = createMemo(
                  () =>
                    ovItem().maxVolumeCurrency as
                      "exalted" | "divine" | "chaos",
                );
                const price = createMemo(() => ovItem().prices[maxC()]);

                return (
                  <tr class="border-b border-base-content/5 transition-colors hover:bg-base-content/5">
                    <th class="w-8 font-normal tabular-nums text-base-content/40">
                      {i() + 1}
                    </th>

                    <td>
                      <div class="flex items-center gap-2">
                        <div class="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-base-content/5">
                          <img
                            src={`https://web.poecdn.com/${ovItem().image}`}
                            alt=""
                            class="h-6 w-6 object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          title="Click to copy name"
                          onClick={() => copyName(name())}
                          class="max-w-48 cursor-pointer truncate text-left font-medium transition-colors hover:text-primary"
                        >
                          {name()}
                        </button>
                      </div>
                    </td>

                    <td class="text-right tabular-nums">{item()[1]}</td>

                    <td>
                      <span class="badge badge-ghost badge-sm whitespace-nowrap">
                        {ovItem().category}
                      </span>
                    </td>

                    <td class="text-right whitespace-nowrap">
                      <span class="font-semibold tabular-nums">
                        {price().toFixed(2)}
                      </span>{" "}
                      <span class="text-xs text-base-content/50">{maxC()}</span>
                    </td>

                    <td class="w-8">
                      <button
                        type="button"
                        onClick={() => removeItem(name())}
                        aria-label="Remove item"
                        class="btn btn-ghost btn-xs btn-square text-base-content/30 hover:bg-error/10 hover:text-error"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              }}
            </For>
          </tbody>

          <tfoot>
            <tr class="border-t border-base-content/10">
              <th
                colspan="2"
                class="text-xs font-medium uppercase tracking-wider text-base-content/50"
              >
                Total value
              </th>
              <td colspan="4">
                <div class="flex items-baseline justify-end gap-4 font-mono tabular-nums">
                  <span title="Divine">
                    <span class="font-semibold">
                      {inventoryTotal()["divine"]}
                    </span>
                    <span class="ml-0.5 text-xs text-base-content/50">d</span>
                  </span>
                  <span title="Chaos">
                    <span class="font-semibold">
                      {inventoryTotal()["chaos"]}
                    </span>
                    <span class="ml-0.5 text-xs text-base-content/50">c</span>
                  </span>
                  <span title="Exalted">
                    <span class="font-semibold">
                      {inventoryTotal()["exalted"]}
                    </span>
                    <span class="ml-0.5 text-xs text-base-content/50">ex</span>
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
        <button
          class="btn"
          onClick={async () => {
            setLeague("Runes of Aldur");
            await new Promise((r) => setTimeout(r, 3000));
            checkOverviews();
          }}
        >
          Change League
        </button>
      </div>
    </WidgetBase>
  );
}
