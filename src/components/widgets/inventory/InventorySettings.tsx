import { createSignal, onMount, Show } from "solid-js";
import { store } from "@/lib/Store";
import { clearInventory } from "./InventoryState";
import {
  addMouseClickAction,
  addStepAction,
  autoScanAction,
  inventoryAction,
  setPlaces,
} from "./InventoryWidget";
import { Shortcut } from "@/components/Shortcut";

const [showInventory, setShowInventory] = createSignal(false);

function InventorySettings() {
  onMount(async () =>
    setShowInventory((await store.get("showInventory")) ?? showInventory()),
  );

  return (
    <>
      <div class="flex items-center justify-between">
        <span
          class="cursor-pointer text-sm"
          onClick={async () => {
            const isEnabled = !showInventory();
            setShowInventory(isEnabled);
            await store.set("showInventory", isEnabled);
            await store.save();
          }}
        >
          <div class="flex flex-col">
            <span class="text-sm font-medium">Inventory</span>
            <span class="text-xs text-base-content/50">
              Scan and View inventory prices
            </span>
          </div>
        </span>
        <input
          type="checkbox"
          checked={showInventory()}
          onClick={async () => {
            const isEnabled = !showInventory();
            setShowInventory(isEnabled);
            await store.set("showInventory", isEnabled);
            await store.save();
          }}
          class="toggle toggle-sm toggle-success"
        />
      </div>
      <Show when={showInventory()}>
        <button
          class="btn btn-soft btn-sm w-full mt-1"
          onClick={() => clearInventory()}
        >
          Clear Inventory
        </button>
        <button
          class="btn btn-soft btn-sm w-full mt-1"
          onClick={() => {
            setPlaces([]);
          }}
        >
          Clear Recording
        </button>
        <Shortcut
          name="Inventory Auto Scan Shortcut"
          action={autoScanAction()}
          defaultKey="F2"
        />
        <Shortcut
          name="Inventory Scan Step Shortcut"
          action={addStepAction()}
          defaultKey="F5"
        />
        <Shortcut
          name="Inventory Scan Mouse Click Shortcut"
          action={addMouseClickAction()}
          defaultKey="F6"
        />
      </Show>
    </>
  );
}

export { InventorySettings, showInventory, setShowInventory };
