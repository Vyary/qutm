import { createMemo, createSignal, For, onSettled, Show } from "solid-js";
import { error } from "@tauri-apps/plugin-log";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WidgetBase } from "../WidgetBase";
import {
  initLayoutTracker,
  layouts,
  layoutZone,
  stopLayoutTracker,
} from "./LayoutState";

export const [showLayout, setShowLayout] = createSignal(true);

const report = (e: unknown) => error(String(e));
const pct = (n: number) => `${n * 100}%`;
const iconSrc = (id: string | number) =>
  new URL(`../../assets/${id}.webp`, import.meta.url).href;

function Chevron(props: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      class="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        d={
          props.dir === "left"
            ? "M10 3.5 5.5 8l4.5 4.5"
            : "M6 3.5 10.5 8 6 12.5"
        }
      />
    </svg>
  );
}

export function Layout() {
  onSettled(() => {
    let disposed = false;
    let stopping: Promise<void> | undefined;
    let unlisten: (() => void) | undefined;

    // Idempotent: the close handler and the disposer may both ask to stop.
    const stop = () =>
      (stopping ??= Promise.resolve(stopLayoutTracker()).catch(report));

    Promise.resolve(initLayoutTracker()).catch(report);

    getCurrentWindow()
      .onCloseRequested(async () => {
        await stop();
      })
      .then((fn) => {
        // The component may have been disposed while we were subscribing.
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch(report);

    return () => {
      disposed = true;
      unlisten?.();
      void stop();
    };
  });

  const [rawIndex, setRawIndex] = createSignal(0);
  const zoneLayouts = createMemo(() => layouts[layoutZone()]);
  const count = createMemo(() => zoneLayouts()?.length ?? 0);
  // Clamp instead of writing back from an effect.
  const index = createMemo(() =>
    Math.min(rawIndex(), Math.max(count() - 1, 0)),
  );
  // Plain selector: keeps store proxies out of memo values.
  const layout = () => zoneLayouts()?.[index()];

  const step = (delta: number) => {
    const n = count();
    if (n > 1) setRawIndex((((index() + delta) % n) + n) % n);
  };

  return (
    <Show when={count() > 0}>
      <WidgetBase
        name="layout"
        defaultPos={{ x: 1375, y: 5 }}
        defaultTransparency={25}
        transparencySlider
      >
        <div class="flex flex-col gap-2 p-2">
          <div class="relative mx-auto h-60 w-60">
            {/* Lines: percentage coordinates match the icon anchors exactly */}
            <svg
              class="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <For each={layout()?.lines} keyed={false}>
                {(line) => {
                  const ends = () => {
                    const icons = layout()?.icons;
                    const from = icons?.[line().fromIconId];
                    const to = icons?.[line().toIconId];
                    return from && to ? { from, to } : undefined;
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

            {/* Icons are centered on their point; the label hangs below */}
            <For each={layout()?.icons} keyed={false}>
              {(icon) => (
                <div
                  class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pct(icon().x), top: pct(icon().y) }}
                >
                  <div class="relative">
                    <img
                      src={iconSrc(icon().id)}
                      alt={icon().label ?? ""}
                      title={icon().label}
                      draggable={false}
                      class="pointer-events-auto h-5 w-5 drop-shadow-md select-none"
                    />
                    <Show when={icon().label}>
                      <span class="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium text-white/80 select-none [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
                        {icon().label}
                      </span>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* Layout switcher: only for zones with more than one layout */}
          <Show when={count() > 1}>
            <div class="mx-auto flex items-center gap-1 rounded-full bg-black/40 p-0.5 ring-1 ring-inset ring-white/15">
              <button
                type="button"
                aria-label="Previous layout"
                class="grid h-6 w-6 place-items-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
                onClick={() => step(-1)}
              >
                <Chevron dir="left" />
              </button>
              <span class="min-w-10 text-center text-[11px] font-medium tabular-nums text-white/80 select-none">
                {index() + 1} / {count()}
              </span>
              <button
                type="button"
                aria-label="Next layout"
                class="grid h-6 w-6 place-items-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
                onClick={() => step(1)}
              >
                <Chevron dir="right" />
              </button>
            </div>
          </Show>
        </div>
      </WidgetBase>
    </Show>
  );
}
