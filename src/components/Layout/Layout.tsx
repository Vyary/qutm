import { createSignal, For, onSettled, Show } from "solid-js";
import { error } from "@tauri-apps/plugin-log";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WidgetBase } from "../WidgetBase";
import {
  initLayoutTracker,
  layouts,
  layoutZone,
  stopLayoutTracker,
} from "./LayoutState";

export const [showLayout, setShowLayout] = createSignal(false);

const pct = (n: number) => `${n * 100}%`;

export function Layout() {
  const [layoutIndex, setLayoutIndex] = createSignal(0);
  const zoneLayouts = () => layouts[layoutZone()];
  const layout = () => zoneLayouts()?.[layoutIndex()];
  const count = () => zoneLayouts()?.length ?? 0;

  onSettled(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    initLayoutTracker();

    getCurrentWindow()
      .onCloseRequested(async () => {
        await stopLayoutTracker();
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch((e) => error(String(e)));

    return () => {
      disposed = true;
      unlisten?.();
      void stopLayoutTracker();
    };
  });

  const step = (delta: number) => {
    const n = count();
    setLayoutIndex((s) => {
      if (s + delta < 0 || s + delta >= n) return s;
      return s + delta;
    });
  };

  return (
    <Show when={count() > 0}>
      <WidgetBase
        id="layout"
        name="layout"
        defaultPos={{ x: 1375, y: 5 }}
        defaultTransparency={25}
        transparencySlider
      >
        <div id="layout-points" class="flex flex-col gap-2 p-2">
          <div class="relative mx-auto h-60 w-60 overflow-hidden">
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

            <For each={layout()?.icons} keyed={false}>
              {(icon) => (
                <div
                  class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pct(icon().x), top: pct(icon().y) }}
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

          <Show when={count() > 1}>
            <div
              id="layout-changer"
              class="mx-auto flex items-center gap-1 rounded-full bg-base-200/50 p-0.5 ring-1 ring-inset ring-base-content/15"
            >
              <button
                type="button"
                aria-label="Previous layout"
                class="grid h-6 w-6 place-items-center rounded-full text-base-content/70 transition hover:bg-base-content/15 hover:text-base-content active:scale-90"
                onClick={() => step(-1)}
              >
                <Chevron dir="left" />
              </button>
              <span class="min-w-10 text-center text-[11px] font-medium tabular-nums text-base-content/80 select-none">
                {layoutIndex() + 1} / {count()}
              </span>
              <button
                type="button"
                aria-label="Next layout"
                class="grid h-6 w-6 place-items-center rounded-full text-base-content/70 transition hover:bg-base-content/15 hover:text-text-base-content active:scale-90"
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
