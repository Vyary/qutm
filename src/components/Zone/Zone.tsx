import { For, onSettled, Show } from "solid-js";
import { WidgetBase } from "../WidgetBase";
import { initTracker, stopTracker, tracker } from "./utils/Tracker";
import { content, initQuoteTracker, stopQuoteTracker } from "./utils/Content";
import { loadTowns, towns } from "./utils/Towns";
import { loadGuide, saveGuide } from "./utils/Guide";
import { initCharacterTracker, stopCharacterTracker } from "./utils/Character";
import { ZoneEditor, ZoneEditorSettings } from "./ZoneEditor";
import { LevelWarning } from "./LevelWarning";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import {
  dev,
  RTL,
  textSize,
  textSizeSmall,
  textSlider,
} from "../Settings/Settings";
import { createPersistedSignal } from "@/lib/CreatePersistedSignal";

export const [showZone, setShowZone, hydrateZone] = createPersistedSignal(
  "showZone",
  false,
  true,
);

export function Zone() {
  const onLoad = () => {
    loadTowns();
    loadGuide();

    initTracker();
    initCharacterTracker();
    initQuoteTracker();
  };

  const cleanUp = async () => {
    await saveGuide();
    await stopTracker();
    await stopCharacterTracker();

    stopQuoteTracker();
  };

  onSettled(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    onLoad();

    getCurrentWindow()
      .onCloseRequested(async () => await cleanUp())
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
    <Show when={towns[tracker.zone] || dev()}>
      <WidgetBase
        name="zone"
        defaultPos={{ x: 20, y: 170 }}
        defaultTransparency={25}
        transparencySlider
        extraPanel
        extraChildren={<ZoneEditor />}
        id="zone"
      >
        <div
          class={[
            `text-base-content text-shadow-lg leading-relaxed border-b border-base-content/5 px-5 py-3 ${textSize()}`,
            { "text-end": RTL() },
          ]}
        >
          {`${towns[tracker.zone]} - Zone Level: ${tracker.zoneLevel}`}
        </div>

        <LevelWarning />
        <Show when={dev()}>
          <ZoneEditorSettings />
        </Show>

        <div
          id="zone-tasks"
          class={["px-5 py-3", { "space-y-1": textSlider() > 0 }]}
        >
          <For each={content().tasks} keyed={(task) => task.text}>
            {(task) => (
              <div
                class={[
                  "flex items-baseline justify-between",
                  { "flex-row-reverse": RTL() },
                ]}
              >
                <div
                  class={["leading-6 text-base-content", textSize()]}
                  innerHTML={task().text}
                />
                <div
                  class={["select-none italic ml-5 text-sm", textSizeSmall()]}
                  innerHTML={task().reward}
                />
              </div>
            )}
          </For>
        </div>
      </WidgetBase>
    </Show>
  );
}
export { RTL };
