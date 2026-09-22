import { createSignal, JSX, onCleanup, onMount, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { info } from "@tauri-apps/plugin-log";
import { store } from "@/lib/Store";
import { passthrough } from "@/lib/Passthrough";

function BaseWidget(props: {
  name: string;
  children?: JSX.Element;
  defaultPos: { x: number; y: number };
  defaultWidth: { w: number };
  defaultTransparency: number;
  transparencySlider?: boolean;
}) {
  let offset = { x: 0, y: 0 };
  let start = { w: 0, h: 0, x: 0, y: 0 };

  const [pos, setPos] = createSignal(props.defaultPos);
  const [width, setWidth] = createSignal(props.defaultWidth);
  const [transparency, setTransparency] = createSignal(
    props.defaultTransparency,
  );

  const savePosition = async (name: string) => {
    await store.set(`${name}Pos`, pos());
    await store.save();
  };

  const saveWidth = async (name: string) => {
    await store.set(`${name}Width`, width());
    await store.save();
  };

  const saveTransparency = async (name: string) => {
    await store.set(`${name}Transparency`, transparency());
    await store.save();
  };

  const loadState = async (name: string) => {
    setPos((await store.get(`${name}Pos`)) ?? pos());
    console.log(`${name}Pos: ` + JSON.stringify(pos()));
    setWidth((await store.get(`${name}Width`)) ?? width());
    setTransparency((await store.get(`${name}Transparency`)) ?? transparency());
  };

  const cleanUp = (name: string) => {
    savePosition(name);
    saveWidth(name);
    saveTransparency(name);
  };

  const onMove = (e: MouseEvent) => {
    setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    savePosition(props.name);
  };

  const onDown = (e: MouseEvent) => {
    offset = { x: e.clientX - pos().x, y: e.clientY - pos().y };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onResizeMove = (e: MouseEvent) => {
    setWidth({
      w: start.w + (e.clientX - start.x),
    });
  };

  const onResizeUp = () => {
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", onResizeUp);
    saveWidth(props.name);
  };

  const onResizeDown = (e: MouseEvent) => {
    e.stopPropagation();
    start.w = width().w;
    start.x = e.clientX;

    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeUp);
  };

  onMount(async () => {
    loadState(props.name);
    info("loaded widget: " + props.name);

    const unlisten = await getCurrentWindow().onCloseRequested(async () => {
      cleanUp(props.name);
    });
    return () => unlisten();
  });

  onCleanup(() => cleanUp(props.name));

  return (
    <div class="flex">
      <div
        class={`absolute h-auto backdrop-blur-md rounded-2xl ring-1 ring-base-content/5`}
        style={{
          left: `${pos().x}px`,
          top: `${pos().y}px`,
          "background-color": `color-mix(in oklch, var(--color-base-300) ${transparency()}%, transparent)`,
        }}
      >
        <Show when={!passthrough()}>
          <div class="cursor-move h-1 select-none" onMouseDown={onDown}></div>
        </Show>

        <div class="min-h-0 overflow-x-auto flex-1 max-h-230">
          {props.children}
        </div>

        <Show when={false}>
          <div
            class="absolute top-1/2 -translate-y-1/2 right-1.5 cursor-e-resize text-base-content/50 hover:text-base-content transition-colors"
            onMouseDown={onResizeDown}
          >
            <svg viewBox="0 0 8 60" class="w-1" fill="currentColor">
              <rect x="0" y="0" width="8" height="60" rx="4" />
            </svg>
          </div>
        </Show>

        <Show when={!passthrough()}>
          <Show when={props.transparencySlider}>
            <div class="flex gap-0.5 bg-base-300/30 rounded-b-2xl border-t border-base-content/5">
              <div class="flex items-center gap-2 px-5 py-3 w-65 justify-end">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 text-base-content/40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v20" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={transparency()}
                  class="range range-xs"
                  step={1}
                  onInput={(e) => {
                    setTransparency(Number(e.currentTarget.value));
                    saveTransparency(props.name);
                  }}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 text-base-content/80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
}

export { BaseWidget };
