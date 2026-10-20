import { store } from "@/lib/Store";
import { createSignal, onMount } from "solid-js";

export const [autoUpdate, setAutoUpdate] = createSignal(true);

export function UpdaterSettings() {
  onMount(async () =>
    setAutoUpdate((await store.get("autoUpdate")) ?? autoUpdate()),
  );

  return (
    <div class="flex items-center justify-between">
      <span
        class="cursor-pointer text-sm"
        onClick={async () => {
          const isEnabled = !autoUpdate();
          setAutoUpdate(isEnabled);
          await store.set("autoUpdate", isEnabled);
          await store.save();
        }}
      >
        Auto Update
      </span>
      <input
        type="checkbox"
        checked={autoUpdate()}
        onClick={async () => {
          const isEnabled = !autoUpdate();
          setAutoUpdate(isEnabled);
          await store.set("autoUpdate", isEnabled);
          await store.save();
        }}
        class="toggle toggle-sm toggle-success"
      />
    </div>
  );
}
