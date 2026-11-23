import { passthrough } from "@/lib/Passthrough";
import { store } from "@/lib/Store";
import { JSX } from "@solidjs/web/jsx-runtime";
import { info } from "@tauri-apps/plugin-log";
import { createSignal, onSettled, Show, untrack } from "solid-js";

type Pos = { x: number; y: number };

export function WidgetBase(props: {
  name: string;
  defaultPos: Pos;
  defaultTransparency: number;
  children: JSX.Element;
  transparencySlider?: boolean;
  extraPanel?: boolean;
  extraChildren?: JSX.Element;
  id?: string;
}) {
  const [pos, setPos] = createSignal<Pos>(untrack(() => props.defaultPos));
  const [transparency, setTransparency] = createSignal(
    untrack(() => props.defaultTransparency),
  );
  let offset: { x: number; y: number; last: Pos } | undefined;
  let container: HTMLDivElement | undefined;
  let frame = 0;

  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), Math.max(min, max));

  const keepInView = (p: Pos): Pos => ({
    x: clamp(p.x, 0, window.innerWidth - (container?.offsetWidth ?? 0)),
    y: clamp(p.y, 0, window.innerHeight - (container?.offsetHeight ?? 0)),
  });

  const onStart = (e: PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    offset = { x: e.clientX - pos().x, y: e.clientY - pos().y, last: pos() };
  };

  const onMove = (e: PointerEvent) => {
    if (!offset) return;
    offset.last = keepInView({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });

    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (offset) setPos(offset.last);
      });
    }
  };

  const onEnd = () => {
    if (!offset) return;
    const last = offset.last;
    offset = undefined;
    void save("Pos", last);
  };

  const updateTransparency = (value: number) => {
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        setTransparency(value);
      });
    }
  };

  const save = async (suffix: "Pos" | "Transparency", value: unknown) => {
    await store.set(`${props.name}${suffix}`, value);
    await store.save();
  };

  const load = async () => {
    const [savedP, savedT] = await Promise.all([
      store.get<Pos>(`${props.name}Pos`),
      store.get<number>(`${props.name}Transparency`),
    ]);

    info(`${props.name} loaded pos: ${JSON.stringify(savedP)}`);

    if (savedP) setPos(savedP);
    if (savedT) setTransparency(savedT);
  };

  onSettled(() => void load());

  return (
    <div
      ref={(el) => (container = el)}
      class="absolute flex items-start gap-2"
      style={{ left: `${pos().x}px`, top: `${pos().y}px` }}
    >
      <div
        id={props.id}
        class="relative h-auto backdrop-blur-md rounded-2xl ring-1 ring-base-content/5"
        style={{
          "background-color": `color-mix(in oklch, var(--color-base-200) ${transparency()}%, transparent)`,
        }}
      >
        <Show when={!passthrough()}>
          <div
            class="relative cursor-move h-5 -mb-5 z-10 select-none text-base-100 hover:text-base-content/40 flex items-center justify-center"
            onPointerDown={onStart}
            onPointerMove={onMove}
            onPointerUp={onEnd}
            onPointerCancel={onEnd}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
            >
              <circle cx="12" cy="9" r="1" />
              <circle cx="19" cy="9" r="1" />
              <circle cx="5" cy="9" r="1" />
              <circle cx="12" cy="15" r="1" />
              <circle cx="19" cy="15" r="1" />
              <circle cx="5" cy="15" r="1" />
            </svg>
          </div>
        </Show>

        <div class="min-h-0 overflow-x-auto flex-1 max-h-230">
          {props.children}
        </div>

        <Show when={!passthrough() && props.transparencySlider}>
          <TransparencySlider
            value={transparency()}
            onInput={(v) => updateTransparency(v)}
            onChange={(v) => save("Transparency", v)}
          />
        </Show>
      </div>

      <Show when={props.extraPanel}>
        <div
          class="relative h-auto backdrop-blur-md rounded-2xl ring-1 ring-base-content/5"
          style={{
            "background-color": `color-mix(in oklch, var(--color-base-200) ${transparency()}%, transparent)`,
          }}
        >
          {props.extraChildren}
        </div>
      </Show>
    </div>
  );
}

function TransparencySlider(props: {
  value: number;
  onInput: (v: number) => void;
  onChange: (v: number) => void;
}) {
  return (
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
          value={props.value}
          class="range range-xs"
          step={1}
          onInput={(e) => props.onInput(Number(e.currentTarget.value))}
          onChange={(e) => props.onChange(Number(e.currentTarget.value))}
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
  );
}
