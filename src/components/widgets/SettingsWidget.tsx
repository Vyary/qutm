import { createSignal, onMount, Show } from "solid-js";
import { filePath, selectFile, startTailing, watching } from "../../state/File";
import {
  enablePassthrough,
  PtSc,
  updatePasstroughShortcut,
} from "../../state/Passthrough";
import {
  SwSc,
  SwScReset,
  updateStopwatchShortcut,
  updateStopwatchShortcutReset,
} from "./StopwatchShortcutState";
import {
  character,
  updateCharacterClass,
  setCharacterName,
} from "../../state/Character";
import { BaseWidget } from "./BaseWidget";
import { store } from "../../state/Store";

const [textSlider, setTextSlider] = createSignal(2);
const sizes = ["text-xs", "text-sm", "text-base", "text-lg", "text-lg"];
const textSize = () => sizes[textSlider()];
const textSizeSmall = () =>
  sizes[textSlider() - 1 >= 0 ? textSlider() - 1 : textSlider()];

const [showSw, setShowSw] = createSignal(false);
const [showInventory, setShowInventory] = createSignal(false);
const [RTL, setRTL] = createSignal(false);
const [showLayout, setShowLayout] = createSignal(false);
const [autoUpdate, setAutoUpdate] = createSignal(true);

function SettingsWidget() {
  const [PtScErr, setPtScErr] = createSignal(false);
  const [SwScErr, setSwScErr] = createSignal(false);
  const [SwScResetErr, setSwScResetErr] = createSignal(false);

  onMount(async () => {
    setShowSw((await store.get("showSw")) ?? showSw());
    setAutoUpdate((await store.get("autoUpdate")) ?? autoUpdate());
    setRTL((await store.get("RTL")) ?? RTL());
    setTextSlider((await store.get("textSize")) ?? textSlider());
    setShowInventory((await store.get("showInventory")) ?? showInventory());
    setShowLayout((await store.get("showLayout")) ?? showLayout());
  });

  return (
    <BaseWidget
      name="settings"
      defaultPos={{ x: 1640, y: 5 }}
      defaultWidth={{ w: 340 }}
      defaultTransparency={100}
    >
      <fieldset class="fieldset select-none w-full gap-3 px-4 py-3">
        <legend class="fieldset-legend text-sm font-semibold uppercase tracking-wider opacity-70">
          Settings
        </legend>

        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide opacity-60">
            Overlay Toggle
          </span>
          <div class="join w-full">
            <input
              class="btn btn-soft btn-sm join-item flex-1"
              type="checkbox"
              name="modifier"
              aria-label="Ctrl"
              value="Ctrl"
              checked={PtSc.Ctrl}
              onChange={(e) => updatePasstroughShortcut(e)}
            />
            <input
              class="btn btn-soft btn-sm join-item flex-1"
              type="checkbox"
              name="modifier"
              aria-label="Shift"
              value="Shift"
              checked={PtSc.Shift}
              onChange={(e) => updatePasstroughShortcut(e)}
            />
            <input
              class="btn btn-soft btn-sm join-item flex-1"
              type="checkbox"
              name="modifier"
              aria-label="Alt"
              value="Alt"
              checked={PtSc.Alt}
              onChange={(e) => updatePasstroughShortcut(e)}
            />
            <input
              type="text"
              placeholder="Key"
              class="input input-sm join-item w-16 text-center font-mono uppercase"
              classList={{ "input-error": PtScErr() }}
              value={PtSc.Key.toUpperCase()}
              onInput={(e) => {
                if (e.target.value.trim() === "") {
                  setPtScErr(true);
                  return;
                }
                setPtScErr(false);
                updatePasstroughShortcut(e, true);
              }}
            />
          </div>
        </div>

        <div class="divider my-0 opacity-50"></div>

        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide opacity-60">
            Client.txt File
          </span>
          <div class="join w-full">
            <button class="btn btn-soft btn-sm join-item" onClick={selectFile}>
              Browse
            </button>
            <input
              type="text"
              readOnly
              class="input input-sm join-item flex-1 truncate font-mono"
              placeholder="Client.txt Location"
              value={filePath()}
            />
          </div>
          <Show
            when={
              !filePath().endsWith("\\Client.txt") &&
              !filePath().endsWith("/Client.txt")
            }
          >
            <p class="flex items-center gap-1 pt-0.5 text-xs text-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86 2.1 18.04A1.5 1.5 0 0 0 3.42 20.3h17.16a1.5 1.5 0 0 0 1.31-2.26L13.7 3.86a1.5 1.5 0 0 0-2.6 0Z"
                />
              </svg>
              Locate Client.txt to enable zone tracking
            </p>
          </Show>
        </div>

        <div class="divider my-0 opacity-50"></div>

        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide opacity-60">
            Character Name
          </span>
          <input
            type="text"
            placeholder="Character Name"
            class="input input-sm w-full"
            value={character.name}
            onInput={(e) => setCharacterName(e.target.value.trim())}
          />
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide opacity-60">
            Character Class
          </span>
          <input
            type="text"
            placeholder="Character Class"
            class="input input-sm w-full"
            value={character.class}
            onInput={(e) => updateCharacterClass(e.target.value.trim())}
          />
        </div>

        <div class="divider my-0 opacity-50"></div>

        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide opacity-60">
            Beta features
          </span>
          <div class="flex items-center justify-between">
            <span
              class="cursor-pointer text-sm"
              onClick={async () => {
                const isEnabled = !showSw();
                setShowSw(isEnabled);
                await store.set("showSw", isEnabled);
                await store.save();
              }}
            >
              <div class="flex flex-col">
                <span class="text-sm font-medium">Stopwatch</span>
                <span class="text-xs text-base-content/50">
                  In-game timer overlay
                </span>
              </div>
            </span>
            <input
              type="checkbox"
              checked={showSw()}
              onClick={async () => {
                const isEnabled = !showSw();
                setShowSw(isEnabled);
                await store.set("showSw", isEnabled);
                await store.save();
              }}
              class="toggle toggle-sm"
            />
          </div>

          <Show when={showSw()}>
            <div class="flex flex-col gap-3 rounded-lg bg-base-200/30 p-2">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium uppercase tracking-wide opacity-60">
                  Stopwatch Toggle
                </span>
                <div class="join w-full">
                  <input
                    class="btn btn-soft btn-sm join-item flex-1"
                    type="checkbox"
                    name="modifier"
                    aria-label="Ctrl"
                    value="Ctrl"
                    checked={SwSc.Ctrl}
                    onChange={(e) => updateStopwatchShortcut(e)}
                  />
                  <input
                    class="btn btn-soft btn-sm join-item flex-1"
                    type="checkbox"
                    name="modifier"
                    aria-label="Shift"
                    value="Shift"
                    checked={SwSc.Shift}
                    onChange={(e) => updateStopwatchShortcut(e)}
                  />
                  <input
                    class="btn btn-soft btn-sm join-item flex-1"
                    type="checkbox"
                    name="modifier"
                    aria-label="Alt"
                    value="Alt"
                    checked={SwSc.Alt}
                    onChange={(e) => updateStopwatchShortcut(e)}
                  />
                  <input
                    type="text"
                    placeholder="Key"
                    class="input input-sm join-item w-16 text-center font-mono uppercase"
                    classList={{ "input-error": SwScErr() }}
                    value={SwSc.Key.toUpperCase()}
                    onInput={(e) => {
                      if (e.target.value.trim() === "") {
                        setSwScErr(true);
                        return;
                      }
                      setSwScErr(false);
                      updateStopwatchShortcut(e, true);
                    }}
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium uppercase tracking-wide opacity-60">
                  Stopwatch Reset
                </span>
                <div class="join w-full">
                  <input
                    class="btn btn-soft btn-sm join-item flex-1"
                    type="checkbox"
                    name="modifier"
                    aria-label="Ctrl"
                    value="Ctrl"
                    checked={SwScReset.Ctrl}
                    onChange={(e) => updateStopwatchShortcutReset(e)}
                  />
                  <input
                    class="btn btn-soft btn-sm join-item flex-1"
                    type="checkbox"
                    name="modifier"
                    aria-label="Shift"
                    value="Shift"
                    checked={SwScReset.Shift}
                    onChange={(e) => updateStopwatchShortcutReset(e)}
                  />
                  <input
                    class="btn btn-soft btn-sm join-item flex-1"
                    type="checkbox"
                    name="modifier"
                    aria-label="Alt"
                    value="Alt"
                    checked={SwScReset.Alt}
                    onChange={(e) => updateStopwatchShortcutReset(e)}
                  />
                  <input
                    type="text"
                    placeholder="Key"
                    class="input input-sm join-item w-16 text-center font-mono uppercase"
                    classList={{ "input-error": SwScResetErr() }}
                    value={SwScReset.Key.toUpperCase()}
                    onInput={(e) => {
                      if (e.target.value.trim() === "") {
                        setSwScResetErr(true);
                        return;
                      }
                      setSwScResetErr(false);
                      updateStopwatchShortcutReset(e, true);
                    }}
                  />
                </div>
              </div>
            </div>
          </Show>

          <div class="flex items-center justify-between">
            <span
              class="cursor-pointer text-sm"
              onClick={async () => {
                const isEnabled = !showInventory();
                setShowInventory(isEnabled);
                await store.set("showInventory", isEnabled);
                await store.save();
              }}
            >
              <div class="flex flex-col">
                <span class="text-sm font-medium">Inventory</span>
                <span class="text-xs text-base-content/50">
                  Scan and View inventory prices
                </span>
              </div>
            </span>
            <input
              type="checkbox"
              checked={showInventory()}
              onClick={async () => {
                const isEnabled = !showInventory();
                setShowInventory(isEnabled);
                await store.set("showInventory", isEnabled);
                await store.save();
              }}
              class="toggle toggle-sm"
            />
          </div>

          <div class="flex items-center justify-between">
            <span
              class="cursor-pointer text-sm"
              onClick={async () => {
                const isEnabled = !RTL();
                setRTL(isEnabled);
                await store.set("RTL", isEnabled);
                await store.save();
              }}
            >
              <div class="flex flex-col">
                <span class="text-sm font-medium">RTL</span>
                <span class="text-xs text-base-content/50">
                  Zone Widget text direction from Right To Left
                </span>
              </div>
            </span>
            <input
              type="checkbox"
              checked={RTL()}
              onClick={async () => {
                const isEnabled = !RTL();
                setRTL(isEnabled);
                await store.set("RTL", isEnabled);
                await store.save();
              }}
              class="toggle toggle-sm"
            />
          </div>

          <div class="flex items-center justify-between">
            <span
              class="cursor-pointer text-sm"
              onClick={async () => {
                const isEnabled = !showLayout();
                setShowLayout(isEnabled);
                await store.set("showLayout", isEnabled);
                await store.save();
              }}
            >
              <div class="flex flex-col">
                <span class="text-sm font-medium">Layout</span>
                <span class="text-xs text-base-content/50">
                  Layout Widget showing points of interest
                </span>
              </div>
            </span>
            <input
              type="checkbox"
              checked={showLayout()}
              onClick={async () => {
                const isEnabled = !showLayout();
                setShowLayout(isEnabled);
                await store.set("showLayout", isEnabled);
                await store.save();
              }}
              class="toggle toggle-sm"
            />
          </div>
        </div>

        <div class="divider my-0 opacity-50"></div>

        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide opacity-60">
            Text Size
          </span>

          <input
            type="range"
            min="0"
            max="4"
            value={textSlider()}
            class="range range-xs"
            onInput={async (e) => {
              setTextSlider(Number(e.currentTarget.value));
              await store.set("textSize", textSlider());
              await store.save();
            }}
          />
        </div>

        <div class="divider my-0 opacity-50"></div>

        <div class="flex items-center justify-between">
          <span
            class="cursor-pointer text-sm"
            onClick={async () => {
              const isEnabled = !autoUpdate();
              setAutoUpdate(isEnabled);
              await store.set("autoUpdate", isEnabled);
              await store.save();
            }}
          >
            Auto Update
          </span>
          <input
            type="checkbox"
            checked={autoUpdate()}
            onClick={async () => {
              const isEnabled = !autoUpdate();
              setAutoUpdate(isEnabled);
              await store.set("autoUpdate", isEnabled);
              await store.save();
            }}
            class="toggle toggle-sm"
          />
        </div>
        <button
          class="btn btn-soft btn-sm w-full mt-1"
          onClick={() => {
            if (filePath()) {
              if (!watching()) {
                startTailing();
              }
              enablePassthrough();
            }
          }}
        >
          Save & Close
        </button>
      </fieldset>
    </BaseWidget>
  );
}

export {
  SettingsWidget,
  RTL,
  showSw,
  showInventory,
  showLayout,
  autoUpdate,
  textSlider,
  textSize,
  textSizeSmall,
};
