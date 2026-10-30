import { createSignal, onMount, Show, type JSX } from "solid-js";
import { filePath, selectFile, startTailing, watching } from "@/lib/File";
import { enablePassthrough, togglePassthrough } from "@/lib/Passthrough";
import { character, setCharacterName } from "../zone/state/Character";
import { store } from "@/lib/Store";
import { setShowSettings, showSettings } from "./SettingsSettings";
import { UpdaterSettings } from "@/components/updater/UpdaterSettings";
import { ZoneSettings } from "../zone/ZoneSettings";
import { InventorySettings } from "../inventory/InventorySettings";
import { LayoutSettings } from "../layout/LayoutSettings";
import { PriceSettings } from "../price/PriceSettings";
import { Shortcut } from "@/components/Shortcut";

function createPersistedSignal<T>(key: string, initial: T) {
  const [value, setValue] = createSignal<T>(initial);

  const hydrate = async () => {
    const saved = await store.get<T>(key);
    if (saved !== undefined && saved !== null) setValue(() => saved);
  };

  const set = async (next: T) => {
    setValue(() => next);
    await store.set(key, next);
    await store.save();
  };

  return [value, set, hydrate] as const;
}

const TEXT_SIZES = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
] as const;

export const [textSlider, setTextSlider, hydrateTextSlider] =
  createPersistedSignal("textSize", 1);
export const [RTL, setRTL, hydrateRTL] = createPersistedSignal("RTL", false);
export const [dev, setDev, hydrateDev] = createPersistedSignal("dev", false);

export const textSize = () => TEXT_SIZES[textSlider()];
export const textSizeSmall = () => TEXT_SIZES[Math.max(textSlider() - 1, 0)];

function Card(props: { title: string; badge?: string; children: JSX.Element }) {
  return (
    <section class="flex flex-col gap-4 rounded-box border border-base-content/10 bg-base-100/40 p-4">
      <header class="flex items-center justify-between">
        <h3 class="text-xs font-semibold uppercase tracking-wider opacity-60">
          {props.title}
        </h3>
        <Show when={props.badge}>
          <span class="badge badge-warning badge-sm font-semibold">
            {props.badge}
          </span>
        </Show>
      </header>
      {props.children}
    </section>
  );
}

function ToggleRow(props: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label class="flex cursor-pointer items-center justify-between gap-4">
      <div class="flex min-w-0 flex-col">
        <span class="text-sm font-medium">{props.label}</span>
        <Show when={props.description}>
          <span class="text-xs text-base-content/50">{props.description}</span>
        </Show>
      </div>
      <input
        type="checkbox"
        class="toggle toggle-sm toggle-success"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
    </label>
  );
}

const isClientTxt = (path: string) => /(^|[\\/])Client\.txt$/.test(path);

function ClientFileField() {
  return (
    <Card title="Client file">
      <div class="flex flex-col gap-1.5">
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
        <Show when={!isClientTxt(filePath())}>
          <p class="text-xs text-warning">
            Locate Client.txt to enable the overlay
          </p>
        </Show>
      </div>
    </Card>
  );
}

function AppearanceCard() {
  return (
    <Card title="Appearance">
      <div class="flex flex-col gap-2">
        <div class="flex items-baseline justify-between">
          <div class="flex flex-col">
            <span class="text-sm font-medium">Text size</span>
            <span class="text-xs text-base-content/50">
              Adjust the overlay's text
            </span>
          </div>
          <span class="text-xs tabular-nums opacity-60">
            {textSlider() + 1} / {TEXT_SIZES.length}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={TEXT_SIZES.length - 1}
          value={textSlider()}
          class="range range-xs"
          onInput={(e) => setTextSlider(Number(e.currentTarget.value))}
        />
        <div class="flex justify-between text-[11px] opacity-40">
          <span>Small</span>
          <span>Medium</span>
          <span>Large</span>
        </div>
      </div>
      <ToggleRow
        label="Right-to-left layout"
        description="Change the Zone Widget text direction"
        checked={RTL()}
        onChange={setRTL}
      />
    </Card>
  );
}

export function Settings() {
  onMount(() => {
    void Promise.all([hydrateRTL(), hydrateTextSlider(), hydrateDev()]);
  });

  const saveAndClose = () => {
    if (!filePath()) return;
    if (!watching()) startTailing();
    enablePassthrough();
    setShowSettings(false);
  };

  return (
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none bg-base-200 px-5 pt-4 z-20"
      classList={{ hidden: !showSettings() }}
    >
      <h2 class="mb-4 border-b border-base-content/10 pb-3 text-sm font-semibold uppercase tracking-widest opacity-80">
        <div class="flex items-center justify-between">
          Settings
          <span class="text-xs text-base-content/50">v0.7.6</span>
        </div>
      </h2>

      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 items-start gap-4">
          <Card title="Shortcut">
            <Shortcut
              name="Overlay Toggle"
              action={async () => togglePassthrough()}
              defaultKey="F"
              ctrl
              shift
              global
            />
          </Card>
          <Card title="Character">
            <label class="flex flex-col gap-1.5">
              <span class="text-xs opacity-60">Character name</span>
              <input
                type="text"
                placeholder="Enter character name"
                class="input input-sm w-full"
                value={character.name}
                onInput={(e) => setCharacterName(e.currentTarget.value.trim())}
              />
            </label>
          </Card>
        </div>

        <ClientFileField />

        <div class="grid grid-cols-2 items-start gap-4">
          <div class="flex flex-col gap-4">
            <Card title="Features">
              <ZoneSettings />
              <LayoutSettings />
            </Card>
            <AppearanceCard />
            <Card title="Advanced">
              <ToggleRow
                label="Developer options"
                description="Enable additional debugging options"
                checked={dev()}
                onChange={setDev}
              />
              <UpdaterSettings />
            </Card>
          </div>

          <Card title="Beta features" badge="Beta">
            <InventorySettings />
            <div class="border-t border-base-content/10" />
            <PriceSettings />
          </Card>
        </div>
      </div>

      <footer class="mt-4 flex items-center justify-end gap-3 border-t border-base-content/10 bg-base-200/90 px-5 py-3 backdrop-blur">
        <Show when={!filePath()}>
          <span class="text-xs text-base-content/50">
            Select your Client.txt to continue
          </span>
        </Show>
        <button
          class="btn btn-primary btn-sm px-6"
          disabled={!filePath()}
          onClick={saveAndClose}
        >
          Save
        </button>
      </footer>
    </div>
  );
}
