import { createMemo, Show } from "solid-js";
import { character } from "./utils/Character";
import { tracker } from "./utils/Tracker";
import { RTL, textSize } from "../Settings/Settings";

export function LevelWarning() {
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
        id="level-warning"
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
