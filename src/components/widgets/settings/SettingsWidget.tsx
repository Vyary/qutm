import { createSignal, onMount, Show } from "solid-js";
import { filePath, selectFile, startTailing, watching } from "@/lib/File";
import { enablePassthrough, togglePassthrough } from "@/lib/Passthrough";
import {
  character,
  updateCharacterClass,
  setCharacterName,
} from "../zone/state/Character";
import { BaseWidget } from "../BaseWidget";
import { store } from "@/lib/Store";
import { setShowSettings, showSettings } from "./SettingsSettings";
import { UpdaterSettings } from "@/components/updater/UpdaterSettings";
import { ZoneSettings } from "../zone/ZoneSettings";
import { InventorySettings } from "../inventory/InventorySettings";
import { LayoutSettings } from "../layout/LayoutSettings";
import { PriceSettings } from "../price/PriceSettings";
import { Shortcut } from "@/components/Shortcut";

const [textSlider, setTextSlider] = createSignal(1);
const sizes = ["text-xs", "text-sm", "text-base", "text-lg", "text-lg"];
const textSize = () => sizes[textSlider()];
const textSizeSmall = () =>
  sizes[textSlider() - 1 >= 0 ? textSlider() - 1 : textSlider()];

const [RTL, setRTL] = createSignal(false);
const [dev, setDev] = createSignal(false);

function SettingsWidget() {
  onMount(async () => {
    setRTL((await store.get("RTL")) ?? RTL());
    setTextSlider((await store.get("textSize")) ?? textSlider());
    setDev((await store.get("dev")) ?? dev());
  });

  return (
    <BaseWidget
      name="settings"
      defaultPos={{ x: 1640, y: 5 }}
      defaultWidth={{ w: 340 }}
      defaultTransparency={100}
    >
      <fieldset
        class="fieldset select-none w-full gap-3 px-4 py-3"
        classList={{
          hidden: !showSettings(),
        }}
      >
        <legend class="fieldset-legend text-sm font-semibold uppercase tracking-wider opacity-70">
          Settings
        </legend>
        <Shortcut
          name="Overlay Toggle"
          action={async () => togglePassthrough()}
          defaultKey="F"
          ctrl={true}
          shift={true}
          global={true}
        />

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
              Locate Client.txt to enable the overlay
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
            Features
          </span>
          <ZoneSettings />
          <LayoutSettings />
        </div>
        <div class="divider my-0 opacity-50"></div>
        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide opacity-60">
            Beta Features
          </span>
          <InventorySettings />
          <PriceSettings />
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
            class="toggle toggle-sm toggle-success"
          />
        </div>
        <div class="divider my-0 opacity-50"></div>
        <div class="flex items-center justify-between">
          <span
            class="cursor-pointer text-sm"
            onClick={async () => {
              const isEnabled = !dev();
              setDev(isEnabled);
              await store.set("dev", isEnabled);
              await store.save();
            }}
          >
            Dev Options
          </span>
          <input
            type="checkbox"
            checked={dev()}
            onClick={async () => {
              const isEnabled = !dev();
              setDev(isEnabled);
              await store.set("dev", isEnabled);
              await store.save();
            }}
            class="toggle toggle-sm toggle-success"
          />
        </div>

        <UpdaterSettings />

        <button
          class="btn btn-soft btn-sm w-full mt-1"
          onClick={() => {
            if (filePath()) {
              if (!watching()) {
                startTailing();
              }
              enablePassthrough();
              setShowSettings(false);
            }
          }}
        >
          Save & Close
        </button>
      </fieldset>
    </BaseWidget>
  );
}

export { SettingsWidget, RTL, dev, textSlider, textSize, textSizeSmall };
