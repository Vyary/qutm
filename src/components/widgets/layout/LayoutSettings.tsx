import { store } from "@/lib/Store";
import { createSignal, onMount } from "solid-js";

const [showLayout, setShowLayout] = createSignal(true);

function LayoutSettings() {
  onMount(async () =>
    setShowLayout((await store.get("showLayout")) ?? showLayout()),
  );

  return (
    <div class="flex items-center justify-between">
      <span
        class="cursor-pointer text-sm"
        onClick={async () => {
          const isEnabled = !showLayout();
          setShowLayout(isEnabled);
          await store.set("showLayout", isEnabled);
          await store.save();
        }}
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium">Layout</span>
          <span class="text-xs text-base-content/50">
            Layout Widget showing points of interest
          </span>
        </div>
      </span>
      <input
        type="checkbox"
        checked={showLayout()}
        onClick={async () => {
          const isEnabled = !showLayout();
          setShowLayout(isEnabled);
          await store.set("showLayout", isEnabled);
          await store.save();
        }}
        class="toggle toggle-sm toggle-success"
      />
    </div>
  );
}

export { LayoutSettings, showLayout };
