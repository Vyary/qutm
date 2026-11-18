import { store } from "@/lib/Store";
import { Accessor, onSettled, Setter } from "solid-js";

export function SettingsToggle(
  label: string,
  description: string,
  defaultState: boolean,
  show: Accessor<boolean>,
  setShow: Setter<boolean>,
) {
  onSettled(() => {
    async () => setShow((await store.get(`show${label}`)) ?? defaultState);
  });

  const toggle = async () => {
    const isEnabled = !show();
    setShow(isEnabled);
    await store.set(`show${label}`, isEnabled);
    await store.save();
  };

  return (
    <div class="flex gap-4 items-center justify-between">
      <span class="cursor-pointer text-sm" onClick={toggle}>
        <div class="flex flex-col">
          <span class="text-sm font-medium">{label}</span>
          <span class="text-xs text-base-content/50">{description}</span>
        </div>
      </span>
      <input
        type="checkbox"
        checked={show()}
        onClick={toggle}
        class="toggle toggle-sm toggle-success"
      />
    </div>
  );
}
