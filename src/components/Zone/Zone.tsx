import { createSignal, For, onSettled, Show } from "solid-js";
import { WidgetBase } from "../WidgetBase";
import { initTracker, stopTracker, tracker } from "./utils/Tracker";
import { content, initQuoteTracking, stopQuoteTracking } from "./utils/Content";
import { loadTowns, towns } from "./utils/Towns";
import { loadGuide } from "./utils/Guide";
import { initCharacter, stopCharacter } from "./utils/Character";
import { ZoneEditor } from "./ZoneEditor";
import { ZoneEditorSettings } from "./ZoneEditorSettings";
import { LevelWarning } from "./LevelWarning";

export const textSize = () => "text-base";
export const textSizeSmall = () => "text-sm";
export const textSlider = () => 1;
export const RTL = () => false;

export const [showZone, setShowZone] = createSignal(true);

export function Zone() {
  onSettled(() => {
    loadTowns();
    loadGuide();

    initTracker();
    initCharacter();
    initQuoteTracking();

    return () => {
      stopTracker();
      stopCharacter();
      stopQuoteTracking();
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
        <For each={[towns[tracker.zone]]}>
          {() => (
            <For each={content().tasks}>
              {(task) => (
                <div
                  class={[
                    "flex items-baseline justify-between",
                    { "flex-row-reverse": RTL() },
                  ]}
                >
                  <div
                    class={`leading-6 text-base-content ${textSize()}`}
                    innerHTML={task.text}
                  />
                  <div
                    class={`select-none italic ml-5 text-sm ${textSizeSmall()}`}
                    innerHTML={task.reward}
                  />
                </div>
              )}
            </For>
          )}
        </For>
      </div>
    </WidgetBase>
  );
}
