import { passthrough } from "@/lib/Passthrough";
import { Accessor, createSignal, For, onSettled, Setter, Show } from "solid-js";
import { RTL } from "../Settings/Settings";
import {
  addIcon,
  removeIcon,
  changeDefaultLayout,
  changeLayout,
  changeLayoutName,
  copyLayout,
  addEmptyLayout,
  deleteLayout,
  deleteLines,
  layoutZone,
  saveLayouts,
  setLayouts,
  ZoneLayout,
} from "./LayoutState";
import { towns } from "../Zone/utils/Towns";
import { Chevron, pct } from "./Layout";

export const [openLayoutEditor, setOpenLayoutEditor] = createSignal(true);

const ICONS = [
  "waypoint",
  "boss",
  "campsite",
  "entrance",
  "checkpoint",
  "myplayer",
  "rustobelisk",
  "runes",
  "reward generic",
  "labyrinth door",
  "dryadic ritual",
  "ritual",
  "lute",
  "crop circle",
  "tools",
  "raided camp",
  "map device",
  "empty",
  "abyss",
  "rune stone 1",
  "rune stone 2",
  "rune stone 3",
  "ancient seal",
  "quest",
  "runestone 4",
  "stone altar",
  "generator",
  "incursion vault",
  "corpse",
  "rare monster",
  "chapel",
  "kaom trial",
  "rakiata trial",
  "maata trial",
  "tawhoa test",
  "tasalio test",
  "ngamahu test",
  "ascendancy altar",
  "vaal beacon",
  "spirit",
  "essence",
  "expedition",
  "seven",
  "strongbox",
  "megalith",
  "dark omen",
];

type Drag = { i: number; x: number; y: number };

export function LayoutEditor(props: {
  layoutIndex: Accessor<number>;
  setLayoutIndex: Setter<number>;
  layout: () => ZoneLayout;
  zoneLayouts: () => ZoneLayout[];
  count: () => number;
  step: (delta: number) => void;
}) {
  let box: HTMLDivElement | undefined; // the h-60 w-60 box, not the outer container
  let grab: { dx: number; dy: number } | undefined;
  let last: Drag | undefined;
  let frame = 0;

  const [drag, setDrag] = createSignal<Drag>();

  const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

  const toFraction = (e: PointerEvent) => {
    const r = box!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
  };

  const posOf = (i: number, icon: { x: number; y: number }) => {
    const d = drag();
    return d && d.i === i ? d : icon;
  };

  const onStart = (e: PointerEvent, i: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const icon = props.layout().icons[i];
    const p = toFraction(e);
    grab = { dx: p.x - icon.x, dy: p.y - icon.y };
    last = { i, x: icon.x, y: icon.y };
    setDrag(last);
  };

  const onMove = (e: PointerEvent) => {
    if (!grab || !last) return;
    const p = toFraction(e);
    last = { i: last.i, x: clamp01(p.x - grab.dx), y: clamp01(p.y - grab.dy) };

    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (last) setDrag(last);
      });
    }
  };

  const onEnd = () => {
    if (!grab || !last) return;
    cancelAnimationFrame(frame);
    frame = 0;
    const { i, x, y } = last;
    grab = undefined;
    last = undefined;
    setDrag(undefined);
    setLayouts((s) => {
      const icon = s[layoutZone()][props.layoutIndex()].icons[i];
      icon.x = x;
      icon.y = y;
    });
  };

  onSettled(() => {
    return cancelAnimationFrame(frame);
  });

  return (
    <Show when={openLayoutEditor()}>
      <div
        class={{
          hidden: passthrough(),
        }}
      >
        <div class="px-4 py-3 max-h-200 overflow-y-auto flex flex-col gap-4">
          <div class="sticky top-0 z-10 backdrop-blur-md flex gap-4 items-center justify-between px-2 py-1">
            <div class="flex flex-col">
              <span class="text-sm font-semibold truncate">
                {towns[layoutZone()]}
              </span>
              <span class="text-xs text-base-content/50 font-mono">
                {layoutZone()}
              </span>
            </div>

            <div class="form-control w-full px-1 py-2">
              <input
                type="text"
                list="towns"
                placeholder="Select Zone..."
                class="input input-sm input-bordered w-full max-w-xs"
                onChange={(e) => changeLayout(e.currentTarget.value)}
              />

              <datalist id="towns">
                <For each={Object.entries(towns)}>
                  {([tc, tn]) => <option value={tc}>{tn}</option>}
                </For>
              </datalist>
            </div>
          </div>

          <div
            ref={(el) => (box = el)}
            class="relative mx-auto h-60 w-60 overflow-hidden border border-base-content/15"
          >
            <svg
              class="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <For each={props.layout()?.lines} keyed={false}>
                {(line) => {
                  const ends = () => {
                    const icons = props.layout()?.icons;
                    const f = icons?.[line().fromIconId];
                    const t = icons?.[line().toIconId];
                    if (!f || !t) return;
                    return {
                      from: posOf(line().fromIconId, f),
                      to: posOf(line().toIconId, t),
                    };
                  };
                  return (
                    <Show when={ends()}>
                      {(e) => (
                        <line
                          x1={pct(e().from.x)}
                          y1={pct(e().from.y)}
                          x2={pct(e().to.x)}
                          y2={pct(e().to.y)}
                          stroke="rgba(255,255,255,0.45)"
                          stroke-width="1"
                          stroke-linecap="round"
                        />
                      )}
                    </Show>
                  );
                }}
              </For>
            </svg>

            <For each={props.layout()?.icons} keyed={false}>
              {(icon, i) => {
                const p = () => posOf(i, icon());
                return (
                  <div
                    class="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: pct(p().x), top: pct(p().y) }}
                    onPointerDown={(e) => onStart(e, i)}
                    onPointerMove={onMove}
                    onPointerUp={onEnd}
                    onPointerCancel={onEnd}
                  >
                    <div class="relative">
                      <img
                        src={
                          new URL(
                            `../../assets/icons/${icon().id}.webp`,
                            import.meta.url,
                          ).href
                        }
                        alt={icon().label ?? ""}
                        title={icon().label}
                        draggable={false}
                        class="pointer-events-auto h-5 w-5 cursor-grab touch-none drop-shadow-md"
                      />
                      <Show when={icon().label}>
                        <span class="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium text-white/80 select-none [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
                          {icon().label}
                        </span>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>

          <Show when={props.count() > 1}>
            <div class="flex items-center gap-1 rounded-full bg-base-200/50 p-0.5 ring-1 ring-inset ring-base-content/15">
              <button
                type="button"
                aria-label="Previous layout"
                class="grid h-6 w-6 place-items-center rounded-full text-base-content/70 transition hover:bg-base-content/15 hover:text-base-content active:scale-90"
                onClick={() => props.step(-1)}
              >
                <Chevron dir="left" />
              </button>
              <span class="min-w-10 text-center text-[11px] font-medium tabular-nums text-base-content/80 select-none">
                {props.layoutIndex() + 1} / {props.count()}
              </span>
              <button
                type="button"
                aria-label="Next layout"
                class="grid h-6 w-6 place-items-center rounded-full text-base-content/70 transition hover:bg-base-content/15 hover:text-text-base-content active:scale-90"
                onClick={() => props.step(1)}
              >
                <Chevron dir="right" />
              </button>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

export function LayoutEditorSettings() {
  return (
    <Show when={!passthrough()}>
      <div
        class={[
          "absolute top-1 h-5 w-1 cursor-pointer p-1 text-base-content/50 hover:text-base-content transition-colors z-11",
          { "right-7": !RTL() },
          { "left-1": RTL() },
        ]}
        onMouseDown={() => setOpenLayoutEditor((s) => !s)}
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
