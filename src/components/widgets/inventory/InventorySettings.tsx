import { createSignal, onMount } from "solid-js";
import { store } from "@/lib/Store";

const [showInventory, setShowInventory] = createSignal(false);

function InventorySettings() {
  onMount(async () =>
    setShowInventory((await store.get("showInventory")) ?? showInventory()),
  );

  return (
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
  );
}

export { InventorySettings, showInventory };
