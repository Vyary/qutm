import { createMemo, For, onSettled, Show } from "solid-js";
import { WidgetBase } from "../WidgetBase";
import { initTracker, stopTracker, tracker } from "./utils/Tracker";
import { content, initQuoteTracking, stopQuoteTracking } from "./utils/Content";
import { loadTowns, towns } from "./utils/Towns";
import { loadGuide } from "./utils/Guide";
import { character, initCharacter, stopCharacter } from "./utils/Character";

const textSize = () => "text-base";
const textSizeSmall = () => "text-sm";
const textSlider = () => 1;
const RTL = () => false;

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
    <>
      <WidgetBase
        name="zone"
        defaultPos={{ x: 20, y: 170 }}
        defaultTransparency={25}
        transparencySlider
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
    </>
  );
}

function LevelWarning() {
  const overleveled = () => tracker.zoneLevel - character.level < 0;
  const levelDiff = () => Math.abs(tracker.zoneLevel - character.level);
  const threshold = () => 3 + Math.floor(character.level / 16);

  const penaltyValue = createMemo(() => {
    const effDiff = Math.max(levelDiff() - threshold(), 0);
    const numerator = character.level + 5;
    const denominator = character.level + 5 + Math.pow(effDiff, 2.5);

    return Math.pow(numerator / denominator, 1.3);
  });

  const penaltyPercent = () => (1 - penaltyValue()) * 100;

  const expections = () =>
    character.level != 0 && !tracker.zone.toLowerCase().includes("town");

  return (
    <Show
      when={
        (levelDiff() == threshold() && !overleveled() && expections()) ||
        (penaltyPercent() > 0 && expections())
      }
    >
      <div
        class={[
          `px-5 py-3 border-b border-base-content/5 flex items-center gap-1 text-sm  ${textSize()}`,
          { "justify-end": RTL() },
          {
            "text-warning bg-warning/10":
              levelDiff() == threshold() && !overleveled() && expections(),
          },
          {
            "text-error bg-error/10": penaltyPercent() > 0 && expections(),
          },
        ]}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <Show
          when={levelDiff() == threshold() && !overleveled() && expections()}
        >
          <span>
            <strong class="font-semibold">Under Level Warning</strong>: Gain
            More Experience before Continuing
          </span>
        </Show>
        <Show when={penaltyPercent() > 0 && expections()}>
          <span>
            <strong class="font-semibold">
              Reduced Experience {penaltyPercent().toFixed(0)}% penalty
            </strong>
            : Move to a {overleveled() ? "higher" : "lower"} level zone
          </span>
        </Show>
      </div>
    </Show>
  );
}
