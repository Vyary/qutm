import { createMemo, createSignal, For, Show } from "solid-js";
import { TransitionGroup } from "solid-transition-group";
import { tracker } from "../../state/Tracker";
import { towns } from "../../state/Towns";
import { ZoneEditor } from "./ZoneEditor";
import { passthrough } from "../../state/Passthrough";
import { content } from "../../state/Content";
import { character } from "../../state/Character";
import { BaseWidget } from "./BaseWidget";
import { RTL, textSize, textSizeSmall, textSlider } from "./SettingsWidget";

function ZoneWidget() {
  const [openEditor, setOpenEditor] = createSignal(false);
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
    <>
      <BaseWidget
        name="zone"
        defaultPos={{ x: 20, y: 170 }}
        defaultWidth={{ w: 550 }}
        defaultTransparency={25}
        transparencySlider={true}
      >
        <Show when={towns[tracker.zone]}>
          <div
            class={`text-base-content text-shadow-lg leading-relaxed border-b border-base-content/5 px-5 py-3 select-none ${textSize()}`}
            classList={{
              "text-end": RTL(),
            }}
          >
            {`${towns[tracker.zone]} - Zone Level: ${tracker.zoneLevel}`}
          </div>

          <Show
            when={levelDiff() == threshold() && !overleveled() && expections()}
          >
            <div
              class={`px-5 py-3 border-b border-base-content/5 flex items-center gap-1 text-sm text-warning bg-warning/10 ${textSize()}`}
              classList={{ "justify-end": RTL() }}
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
              <span>
                <strong class="font-semibold">Under Level Warning</strong>: Gain
                More Experience before Continuing
              </span>
            </div>
          </Show>

          <Show when={penaltyPercent() > 0 && expections()}>
            <div
              class={`px-5 py-3 border-b border-base-content/5 flex items-center gap-1 text-sm text-error bg-error/10 ${textSize()}`}
              classList={{ "justify-end": RTL() }}
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
              <span>
                <strong class="font-semibold">
                  Reduced Experience {penaltyPercent().toFixed(0)}% penalty
                </strong>
                : Move to a {overleveled() ? "higher" : "lower"} level zone
              </span>
            </div>
          </Show>
        </Show>

        <div
          class="px-5 py-3"
          classList={{
            "space-y-1": textSlider() > 0,
          }}
        >
          <For each={[towns[tracker.zone]]}>
            {() => (
              <TransitionGroup name="slide-fade">
                <For each={content().tasks}>
                  {(task) => (
                    <div
                      class="flex items-baseline justify-between"
                      classList={{ "flex-row-reverse": RTL() }}
                    >
                      <div
                        class={`leading-6 text-base-content select-none ${textSize()}`}
                        innerHTML={task.text}
                      />
                      <div
                        class={`select-none italic ml-5 text-sm ${textSizeSmall()}`}
                        innerHTML={task.reward}
                      />
                    </div>
                  )}
                </For>
              </TransitionGroup>
            )}
          </For>
        </div>

        <Show when={!passthrough()}>
          <div
            class="absolute top-1 h-5 w-1 cursor-pointer p-1 text-base-content/50 hover:text-base-content transition-colors"
            classList={{
              "right-7": !RTL(),
              "left-1": RTL(),
            }}
            onMouseDown={() => setOpenEditor(!openEditor())}
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
      </BaseWidget>

      <Show when={openEditor()}>
        <div
          classList={{
            hidden: passthrough(),
          }}
        >
          <ZoneEditor />
        </div>
      </Show>
    </>
  );
}

export { ZoneWidget };
