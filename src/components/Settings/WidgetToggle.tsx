import { store } from "@/lib/Store";
import { Accessor, Setter } from "solid-js";

export function WidgetToggle(props: {
  label: string;
  description: string;
  defaultState: boolean;
  show: Accessor<boolean>;
  setShow: Setter<boolean>;
}) {
  const toggle = async () => {
    const isEnabled = !props.show();
    props.setShow(isEnabled);
    await store.set(`show${props.label}`, isEnabled);
    await store.save();
  };

  return (
    <div class="flex gap-4 items-center justify-between">
      <span class="cursor-pointer text-sm" onClick={toggle}>
        <div class="flex flex-col">
          <span class="text-sm font-medium">{props.label}</span>
          <span class="text-xs text-base-content/50">{props.description}</span>
        </div>
      </span>
      <input
        type="checkbox"
        checked={props.show()}
        onClick={toggle}
        class="toggle toggle-sm toggle-success"
      />
    </div>
  );
}
