import { createSignal, For, onSettled, Show } from "solid-js";
import { WidgetBase } from "../WidgetBase";
import { initTracker, stopTracker, tracker } from "./utils/Tracker";
import { content, initQuoteTracking, stopQuoteTracking } from "./utils/Content";
import { loadTowns, towns } from "./utils/Towns";
import { loadGuide, saveGuide } from "./utils/Guide";
import { initCharacter, stopCharacter } from "./utils/Character";
import { ZoneEditor, ZoneEditorSettings } from "./ZoneEditor";
import { LevelWarning } from "./LevelWarning";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error, info } from "@tauri-apps/plugin-log";

export const textSize = () => "text-base";
export const textSizeSmall = () => "text-sm";
export const textSlider = () => 1;
export const RTL = () => false;

export const [showZone, setShowZone] = createSignal(true);

export function Zone() {
  const load = () => {
    loadTowns();
    loadGuide();

    initTracker();
    initCharacter();
    initQuoteTracking();
  };

  const cleanUp = () => {
    saveGuide();
    stopTracker();
    stopCharacter();
    stopQuoteTracking();
    info("cleanUp complete");
  };

  onSettled(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    load();

    getCurrentWindow()
      .onCloseRequested(() => cleanUp())
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch((e) => error(String(e)));

    return () => {
      cleanUp();
      disposed = true;
      unlisten?.();
    };
  });

  return (
    <WidgetBase
      name="zone"
      defaultPos={{ x: 20, y: 170 }}
      defaultTransparency={25}
      transparencySlider
      extraPanel
      extraChildren={<ZoneEditor />}
    >
      <Show when={towns[tracker.zone]}>
        <div
          class={[
            `text-base-content text-shadow-lg leading-relaxed border-b border-base-content/5 px-5 py-3 ${textSize()}`,
            { "text-end": RTL() },
          ]}
        >
          {`${towns[tracker.zone]} - Zone Level: ${tracker.zoneLevel}`}
        </div>
      </Show>

      <LevelWarning />
      <ZoneEditorSettings />

      <div class={["px-5 py-3", { "space-y-1": textSlider() > 0 }]}>
        <For each={content().tasks} keyed={(task) => task.text}>
          {(task) => (
            <div
              class={[
                "flex items-baseline justify-between",
                { "flex-row-reverse": RTL() },
              ]}
            >
              <div
                class={`leading-6 text-base-content ${textSize()}`}
                innerHTML={task().text}
              />
              <div
                class={`select-none italic ml-5 text-sm ${textSizeSmall()}`}
                innerHTML={task().reward}
              />
            </div>
          )}
        </For>
      </div>
    </WidgetBase>
  );
}
