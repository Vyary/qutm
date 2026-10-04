import { createSignal, onMount } from "solid-js";
import { store } from "@/lib/Store";

const [showZone, setShowZone] = createSignal(false);

function ZoneSettings() {
  onMount(async () => setShowZone((await store.get("showZone")) ?? true));

  return (
    <div class="flex items-center justify-between">
      <span
        class="cursor-pointer text-sm"
        onClick={async () => {
          const isEnabled = !showZone();
          setShowZone(isEnabled);
          await store.set("showZone", isEnabled);
          await store.save();
        }}
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium">Zone</span>
          <span class="text-xs text-base-content/50">
            Zone Widget showing text guide for act progression
          </span>
        </div>
      </span>
      <input
        type="checkbox"
        checked={showZone()}
        onClick={async () => {
          const isEnabled = !showZone();
          setShowZone(isEnabled);
          await store.set("showZone", isEnabled);
          await store.save();
        }}
        class="toggle toggle-sm toggle-success"
      />
    </div>
  );
}

export { ZoneSettings, showZone };
