import { store } from "@/lib/Store";
import { createSignal, onSettled } from "solid-js";

export const [autoUpdate, setAutoUpdate] = createSignal(false);

export function UpdaterSettings() {
  onSettled(() => {
    (async () => {
      setAutoUpdate((await store.get("autoUpdate")) ?? true);
    })();
  });

  const toggle = async () => {
    const isEnabled = !autoUpdate();
    setAutoUpdate(isEnabled);
    await store.set("autoUpdate", isEnabled);
    await store.save();
  };

  return (
    <div class="flex items-center justify-between">
      <span class="cursor-pointer text-sm" onClick={toggle}>
        Auto Update
      </span>
      <input
        type="checkbox"
        checked={autoUpdate()}
        onClick={toggle}
        class="toggle toggle-sm toggle-success"
      />
    </div>
  );
}
