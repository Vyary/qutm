import { passthrough } from "@/lib/Passthrough";
import { createSignal, Show } from "solid-js";
import { RTL } from "./Zone";

export const [openEditor, setOpenEditor] = createSignal(false);

export function ZoneEditorSettings() {
  return (
    <Show when={!passthrough()}>
      <div
        class={[
          "absolute top-1 h-5 w-1 cursor-pointer p-1 text-base-content/50 hover:text-base-content transition-colors z-11",
          { "right-7": !RTL() },
          { "left-1": RTL() },
        ]}
        onMouseDown={() => setOpenEditor((s) => !s)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-square-pen-icon lucide-square-pen"
        >
          <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
        </svg>
      </div>
    </Show>
  );
}
