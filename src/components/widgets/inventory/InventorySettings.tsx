import { createSignal, onMount, Show } from "solid-js";
import { store } from "@/lib/Store";
import { setActiveSelect } from "@/components/widgets/inventory/SnipSelect";
import { invoke } from "@tauri-apps/api/core";

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
          class="btn btn-soft btn-sm"
          onClick={() => setActiveSelect(true)}
        >
          Select Stash Area
        </button>
        <button
          class="btn btn-soft btn-sm"
          onClick={async () =>
            await invoke("os_move_mouse", { x: 300, y: 300 })
          }
        >
          Test Mouse
        </button>
      </Show>
    </>
  );
}

export { InventorySettings, showInventory, setShowInventory };
