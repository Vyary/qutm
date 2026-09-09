import { createSignal, For, Show } from "solid-js";
import { BaseWidget } from "./BaseWidget";
import { tracker } from "../../state/Tracker";
import { passthrough } from "../../state/Passthrough";
import sc from "../../assets/sc.png";
import {
  addEmptyLayout,
  addIcon,
  addLayout,
  addLine,
  changeDefaultLayout,
  changeIconLocation,
  changeLayoutName,
  copyLayout,
  deleteLayout,
  deleteLines,
  layouts,
  removeIcon,
  saveLayouts,
} from "../../state/Layouts";
import { info } from "@tauri-apps/plugin-log";
import { create } from "@tauri-apps/plugin-fs";

function LayoutWidget() {
  const [iconIndex, setIconIndex] = createSignal(0);
  const [layoutIndex, setLayoutIndex] = createSignal(0);
  const [selecting, setSelecting] = createSignal<boolean>(false);
  const [deletingIcon, setDeletingIcon] = createSignal(false);
  const [startIcon, setStartIcon] = createSignal<number>();
  const [iconType, setIconType] = createSignal("");
  const [iconLabel, setIconLabel] = createSignal("");

  const icons = [
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
  ];
  let containerRef!: HTMLDivElement;

  const onIconMove = (e: MouseEvent) => {
    const rect = containerRef.getBoundingClientRect();
    changeIconLocation(layoutIndex(), iconIndex(), e, rect);
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onIconMove);
    window.removeEventListener("mouseup", onUp);
  };

  const onDown = (e: MouseEvent, index: number) => {
    e.preventDefault();
    setIconIndex(index);
    window.addEventListener("mousemove", onIconMove);
    window.addEventListener("mouseup", onUp);
  };

  const linker = (index: number) => {
    {
      if (selecting()) {
        if (deletingIcon()) {
          removeIcon(layoutIndex(), index);
          setSelecting(false);
          setDeletingIcon(false);
          return;
        }

        if (startIcon() === undefined) {
          setStartIcon(index);
          return;
        }

        addLine(layoutIndex(), startIcon(), index);
        setSelecting(false);
        setStartIcon(undefined);
      }
    }
  };

  return (
    <BaseWidget
      name="layout"
      defaultPos={{ x: 1375, y: 5 }}
      defaultWidth={{ w: 550 }}
      defaultTransparency={25}
      transparencySlider={true}
    >
      <Show
        when={layouts[tracker.zone]}
        fallback={
          <Show when={tracker.zone !== ""}>
            <div
              class="flex items-center px-5 py-8 justify-center text-sm text-base-content/50 cursor-pointer hover:text-base-content/70 transition-colors"
              onClick={() => addLayout(tracker.zone)}
            >
              No Zone Layout — click to add
            </div>
          </Show>
        }
      >
        <div class="flex flex-col gap-3 p-3">
          <div
            ref={containerRef}
            class="relative w-60 h-60 mx-auto rounded-lg overflow-hidden"
          >
            <img
              // src={layouts?.[tracker.zone]?.[layoutIndex()]?.image}
              src={sc}
              draggable={false}
              class="w-full h-full opacity-0"
            />

            <svg
              class="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <For each={layouts?.[tracker.zone]?.[layoutIndex()]?.lines}>
                {(line) => {
                  const from = () =>
                    layouts[tracker.zone]?.[layoutIndex()].icons[
                      line.fromIconId
                    ];
                  const to = () =>
                    layouts[tracker.zone]?.[layoutIndex()].icons[line.toIconId];
                  return (
                    <Show when={from() && to()}>
                      <line
                        x1={from()!.x * 101}
                        y1={from()!.y * 101}
                        x2={to()!.x * 101}
                        y2={to()!.y * 101}
                        stroke="rgba(255,255,255,0.85)"
                        stroke-width="0.5"
                        vector-effect="non-scaling-stroke"
                      />
                    </Show>
                  );
                }}
              </For>
            </svg>

            <For each={layouts?.[tracker.zone]?.[layoutIndex()]?.icons}>
              {(icon, i) => (
                <div
                  class="absolute flex flex-col items-center pointer-events-none"
                  style={{
                    left: `${icon.x * 100}%`,
                    top: `${icon.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Show when={icon.label}>
                    <span class="text-[9px] font-medium text-white whitespace-nowrap select-none">
                      {icon.label}
                    </span>
                  </Show>

                  <img
                    src={
                      new URL(`../../assets/${icon.id}.webp`, import.meta.url)
                        .href
                    }
                    class="w-5 h-5 drop-shadow-md pointer-events-auto"
                    classList={{
                      "cursor-move": !selecting(),
                      "cursor-pointer ring-2 ring-primary rounded-full":
                        selecting(),
                    }}
                    onMouseDown={(e) => onDown(e, i())}
                    onClick={() => linker(i())}
                  />
                </div>
              )}
            </For>
          </div>

          <Show when={!passthrough()}>
            <div class="flex flex-col gap-2 pt-1 border-t border-base-content/10 max-w-60">
              <div class="inline-flex items-center justify-center gap-2">
                <select class="select select-sm select-bordered w-full bg-base-200">
                  <For each={layouts?.[tracker.zone]}>
                    {(l, i) => (
                      <option
                        selected={i() == layoutIndex()}
                        onClick={() => {
                          info("changed" + i());
                          setLayoutIndex(i());
                        }}
                      >
                        {l?.name}
                      </option>
                    )}
                  </For>
                </select>
                <button
                  class="btn"
                  onClick={() =>
                    setLayoutIndex(
                      (layoutIndex() + 1) %
                        (layouts?.[tracker.zone]?.length || 1),
                    )
                  }
                >
                  Next
                </button>
                <input
                  type="text"
                  placeholder="Icon Label..."
                  class="input input-sm input-bordered w-full bg-base-200"
                  value={layouts?.[tracker.zone][layoutIndex()]?.name}
                  onChange={(e) =>
                    changeLayoutName(layoutIndex(), e.currentTarget.value)
                  }
                />
              </div>
              <div class="inline-flex items-center justify-center gap-2">
                <button
                  class="btn btn-sm flex-1 hover:text-success hover:bg-success/10"
                  onClick={() => {
                    changeDefaultLayout(layoutIndex());
                    setLayoutIndex(0);
                  }}
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
                    class="lucide lucide-replace-all-icon lucide-replace-all"
                  >
                    <path d="M14 14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" />
                    <path d="M14 4a1 1 0 0 1 1-1" />
                    <path d="M15 10a1 1 0 0 1-1-1" />
                    <path d="M19 14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1" />
                    <path d="M21 4a1 1 0 0 0-1-1" />
                    <path d="M21 9a1 1 0 0 1-1 1" />
                    <path d="m3 7 3 3 3-3" />
                    <path d="M6 10V5a2 2 0 0 1 2-2h2" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  class="btn btn-sm flex-1 hover:text-success hover:bg-success/10"
                  onClick={() => {
                    copyLayout(layoutIndex());
                    setLayoutIndex(layouts?.[tracker.zone]?.length - 1);
                  }}
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
                    class="lucide lucide-copy-icon lucide-copy"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </button>
                <button
                  class="btn btn-sm flex-1 hover:text-success hover:bg-success/10"
                  onClick={() => {
                    addEmptyLayout();
                    setLayoutIndex(layouts?.[tracker.zone]?.length - 1);
                  }}
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
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </button>
                <button
                  class="btn btn-sm flex-1 hover:text-error hover:bg-error/10"
                  onClick={() => {
                    const index = layoutIndex();
                    setLayoutIndex(index - 1 >= 0 ? index - 1 : 0);
                    deleteLayout(index);
                  }}
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
                    class=""
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div class="flex gap-2">
                <div class="form-control w-full">
                  <input
                    type="text"
                    list="icons"
                    placeholder="Select icon type..."
                    class="input input-sm input-bordered w-full bg-base-200"
                    value={iconType()}
                    onChange={(e) => setIconType(e.currentTarget.value)}
                  />
                  <datalist id="icons">
                    <For each={icons}>
                      {(i) => <option value={i}>{i}</option>}
                    </For>
                  </datalist>
                </div>

                <input
                  type="text"
                  placeholder="Icon Label..."
                  class="input input-sm input-bordered w-full bg-base-200"
                  value={iconLabel()}
                  onChange={(e) => setIconLabel(e.currentTarget.value)}
                />

                <button
                  class="btn btn-sm flex-1 hover:text-error hover:bg-error/10"
                  onClick={() => {
                    setSelecting(true);
                    setDeletingIcon(true);
                  }}
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
                    class=""
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div class="flex gap-2">
                <button
                  class="btn btn-sm btn-primary flex-1"
                  onClick={() => {
                    addIcon(layoutIndex(), iconType(), iconLabel());
                    setIconType("");
                    setIconLabel("");
                  }}
                >
                  + Icon
                </button>
                <button
                  class="btn btn-sm flex-1"
                  classList={{ "btn-active btn-secondary": selecting() }}
                  onClick={() => setSelecting(!selecting())}
                >
                  {selecting() ? "Selecting…" : "+ Line"}
                </button>
                <button
                  class="btn btn-sm flex-1 hover:text-error hover:bg-error/10"
                  onClick={() => deleteLines(layoutIndex())}
                >
                  - Lines
                </button>
              </div>

              <button
                class="btn btn-sm btn-outline btn-block mt-1"
                onClick={saveLayouts}
              >
                Save Layouts
              </button>
            </div>
          </Show>
        </div>
      </Show>
    </BaseWidget>
  );
}

export { LayoutWidget };
