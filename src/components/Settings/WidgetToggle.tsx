import { Accessor } from "solid-js";

export function WidgetToggle(props: {
  label: string;
  description: string;
  show: Accessor<boolean>;
  setShow: (value: any) => void;
}) {
  return (
    <div class="flex gap-4 items-center justify-between">
      <span
        class="cursor-pointer text-sm"
        onClick={() => props.setShow(!props.show())}
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium">{props.label}</span>
          <span class="text-xs text-base-content/50">{props.description}</span>
        </div>
      </span>
      <input
        type="checkbox"
        checked={props.show()}
        onClick={() => props.setShow(!props.show())}
        class="toggle toggle-sm toggle-success"
      />
    </div>
  );
}
