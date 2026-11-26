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
  setLayouts,
  ZoneLayout,
  addLine,
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

  const [iconType, setIconType] = createSignal(ICONS[0]);
  const [iconLabel, setIconLabel] = createSignal("");
  const [iconToRemove, setIconToRemove] = createSignal("");
  const [lineFrom, setLineFrom] = createSignal("");
  const [lineTo, setLineTo] = createSignal("");
  const [confirmDelete, setConfirmDelete] = createSignal(false);

  const resetSelections = () => {
    setConfirmDelete(false);
    setIconToRemove("");
    setLineFrom("");
    setLineTo("");
  };

  const handleAddLayout = () => {
    if (!layoutZone()) return;

    addEmptyLayout();
    props.setLayoutIndex(props.count());
    resetSelections();
  };

  const handleCopyLayout = () => {
    if (!props.layout()) return;

    copyLayout(props.layoutIndex());
    props.setLayoutIndex(props.count());
    resetSelections();
  };

  const handleMakePrimary = () => {
    if (!props.layout() || props.layoutIndex() === 0) return;

    changeDefaultLayout(props.layoutIndex());
    props.setLayoutIndex(0);
    resetSelections();
  };

  const handleDeleteLayout = () => {
    if (!props.layout()) return;

    const index = props.layoutIndex();
    const remaining = Math.max(props.count() - 1, 1);

    deleteLayout(index);
    props.setLayoutIndex(Math.min(index, remaining - 1));
    resetSelections();
  };

  const handleAddIcon = () => {
    if (!props.layout()) return;

    addIcon(props.layoutIndex(), iconType(), iconLabel().trim());
    setIconLabel("");
  };

  const handleRemoveIcon = () => {
    const icons = props.layout()?.icons;
    const index = Number(iconToRemove());

    if (!icons || iconToRemove() === "" || !Number.isInteger(index)) return;
    if (!icons[index]) return;

    removeIcon(props.layoutIndex(), index);
    setIconToRemove("");
    setLineFrom("");
    setLineTo("");
  };

  const handleAddLine = () => {
    const icons = props.layout()?.icons;
    const from = Number(lineFrom());
    const to = Number(lineTo());

    if (!icons || lineFrom() === "" || lineTo() === "") return;
    if (!Number.isInteger(from) || !Number.isInteger(to)) return;
    if (!icons[from] || !icons[to]) return;

    addLine(props.layoutIndex(), from, to);
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

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Layout name..."
                class="input input-xs input-bordered min-w-0 flex-1"
                disabled={!props.layout()}
                value={props.layout()?.name ?? ""}
                onInput={(e) => {
                  if (!props.layout()) return;
                  changeLayoutName(props.layoutIndex(), e.currentTarget.value);
                }}
              />
              <Show when={props.count() > 0}>
                <span class="shrink-0 text-[10px] font-medium tabular-nums text-base-content/50">
                  {props.layoutIndex() + 1} / {props.count()}
                </span>
              </Show>
            </div>

            <div class="flex flex-wrap items-center gap-1">
              <button
                type="button"
                class="btn btn-xs btn-soft"
                disabled={!layoutZone()}
                onClick={handleAddLayout}
              >
                + New
              </button>
              <button
                type="button"
                class="btn btn-xs btn-soft"
                disabled={!props.layout()}
                onClick={handleCopyLayout}
              >
                Copy
              </button>
              <button
                type="button"
                class="btn btn-xs btn-soft"
                disabled={!props.layout() || props.layoutIndex() === 0}
                onClick={handleMakePrimary}
              >
                Make Primary
              </button>
              <Show
                when={confirmDelete()}
                fallback={
                  <button
                    type="button"
                    class="btn btn-xs btn-error"
                    disabled={!props.layout()}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete
                  </button>
                }
              >
                <button
                  type="button"
                  class="btn btn-xs btn-error"
                  onClick={handleDeleteLayout}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </Show>
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
                  const fromIcon = () =>
                    props.layout()?.icons[line().fromIconId];
                  const toIcon = () => props.layout()?.icons[line().toIconId];
                  const valid = () => !!fromIcon() && !!toIcon();
                  const from = () => {
                    const icon = fromIcon();
                    return icon ? posOf(line().fromIconId, icon) : undefined;
                  };
                  const to = () => {
                    const icon = toIcon();
                    return icon ? posOf(line().toIconId, icon) : undefined;
                  };

                  return (
                    <Show when={valid()}>
                      <line
                        x1={pct(from()!.x)}
                        y1={pct(from()!.y)}
                        x2={pct(to()!.x)}
                        y2={pct(to()!.y)}
                        stroke="rgba(255,255,255,0.45)"
                        stroke-width="1"
                        stroke-linecap="round"
                      />
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
            <div
              id="layout-changer"
              class="mx-auto flex items-center gap-1 rounded-full bg-base-200/50 p-0.5 ring-1 ring-inset ring-base-content/15"
            >
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

          <div class="flex flex-wrap items-center gap-1">
            <select
              class="select select-xs select-bordered min-w-28 flex-1 bg-base-200"
              value={iconType()}
              onChange={(e) => setIconType(e.currentTarget.value)}
            >
              <For each={ICONS}>
                {(icon) => <option value={icon}>{icon}</option>}
              </For>
            </select>
            <input
              type="text"
              placeholder="Label"
              class="input input-xs input-bordered min-w-24 flex-1"
              value={iconLabel()}
              onInput={(e) => setIconLabel(e.currentTarget.value)}
            />
            <button
              type="button"
              class="btn btn-xs btn-soft"
              onClick={handleAddIcon}
            >
              + Icon
            </button>
          </div>

          <Show when={(props.layout()?.icons.length ?? 0) > 0}>
            <div class="flex flex-wrap items-center gap-1">
              <select
                class="select select-xs select-bordered min-w-28 flex-1 bg-base-200"
                value={iconToRemove()}
                onChange={(e) => setIconToRemove(e.currentTarget.value)}
              >
                <option value="">Remove icon...</option>
                <For each={props.layout()?.icons ?? []} keyed={false}>
                  {(icon, i) => (
                    <option value={String(i)}>
                      {i + 1}. {icon().label || icon().id}
                    </option>
                  )}
                </For>
              </select>
              <button
                type="button"
                class="btn btn-xs btn-ghost text-error"
                disabled={iconToRemove() === ""}
                onClick={handleRemoveIcon}
              >
                Remove
              </button>
            </div>
          </Show>

          <div class="flex flex-wrap items-center gap-1">
            <select
              class="select select-xs select-bordered min-w-24 flex-1 bg-base-200"
              value={lineFrom()}
              onChange={(e) => setLineFrom(e.currentTarget.value)}
            >
              <option value="">From...</option>
              <For each={props.layout()?.icons ?? []} keyed={false}>
                {(icon, i) => (
                  <option value={String(i)}>
                    {i + 1}. {icon().label || icon().id}
                  </option>
                )}
              </For>
            </select>
            <select
              class="select select-xs select-bordered min-w-24 flex-1 bg-base-200"
              value={lineTo()}
              onChange={(e) => setLineTo(e.currentTarget.value)}
            >
              <option value="">To...</option>
              <For each={props.layout()?.icons ?? []} keyed={false}>
                {(icon, i) => (
                  <option value={String(i)}>
                    {i + 1}. {icon().label || icon().id}
                  </option>
                )}
              </For>
            </select>
            <button
              type="button"
              class="btn btn-xs btn-soft"
              disabled={
                lineFrom() === "" || lineTo() === "" || lineFrom() === lineTo()
              }
              onClick={handleAddLine}
            >
              + Line
            </button>
            <button
              type="button"
              class="btn btn-xs btn-ghost text-error"
              disabled={(props.layout()?.lines.length ?? 0) === 0}
              onClick={() => deleteLines(props.layoutIndex())}
            >
              Clear lines
            </button>
          </div>
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
