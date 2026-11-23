import { filePath, selectFile } from "@/lib/File";
import { store } from "@/lib/Store";
import { createSignal, For, onSettled, Show } from "solid-js";
import { ShortcutRecorder } from "../ShortcutRecorder";
import { character, setCharacterName } from "../Zone/utils/Character";
import { setShowZone, showZone } from "../Zone/Zone";
import { setShowLayout, showLayout } from "../Layout/Layout";
import { setShowInventory, showInventory } from "../Inventory/Inventory";
import { setShowPrice, showPrice } from "../Price/Price";
import { JSX } from "@solidjs/web/jsx-runtime";
import { autoUpdate, setAutoUpdate } from "../Updater";
import { WidgetToggle } from "./WidgetToggle";
import { enablePassthrough } from "@/lib/Passthrough";
import { clearInventory, clearRecording } from "../Inventory/InventoryState";
import { startTour } from "../Help/Tour";
import { info } from "@tauri-apps/plugin-log";

function createPersistedSignal<T>(key: string, initial: T) {
  const [value, setValue] = createSignal<T>(initial as Exclude<T, Function>);

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
export const [league, setLeague, hydrateLeague] = createPersistedSignal(
  "league",
  "Forbidden Rites",
);

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

function HelpAndTutorialsCard() {
  return (
    <Card title="Help & tutorials">
      <div class="flex flex-col gap-3">
        <p class="text-xs leading-relaxed text-base-content/50">
          Tour over all enabled widgets.
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-soft btn-sm"
            onClick={() => {
              setShowSettings(false);
              startTour();
            }}
          >
            Replay quick tour
          </button>
        </div>
      </div>
    </Card>
  );
}

export const [showSettings, setShowSettings] = createSignal(true);

export function Settings() {
  let detailsRef!: HTMLDetailsElement;

  const saveAndClose = () => {
    setShowSettings(false);
    enablePassthrough();
  };

  onSettled(() => {
    Promise.all([
      hydrateRTL(),
      hydrateTextSlider(),
      hydrateDev(),
      hydrateLeague(),
    ]);

    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      saveAndClose();
    };

    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  });

  return (
    <div
      class={[
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none bg-base-200 px-5 pt-4 z-20",
        { hidden: !showSettings() },
      ]}
    >
      <h2 class="mb-4 border-b border-base-content/10 pb-3 text-sm font-semibold uppercase tracking-widest opacity-80">
        <div class="flex items-center justify-between">
          Settings
          <span class="text-xs text-base-content/50">v0.8.0</span>
        </div>
      </h2>

      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-3 items-start gap-4">
          <Card title="Overlay Shortcut">
            <ShortcutRecorder
              name="overlay"
              description="Show or hide overlay"
            />
          </Card>
          <Card title="League">
            <label class="flex flex-col gap-1.5">
              <details ref={detailsRef} class="dropdown dropdown-center">
                <summary class="btn btn-sm btn-neutral w-full">
                  {league()}
                </summary>
                <ul class="menu dropdown-content bg-base-200 border border-base-content/5 rounded-box z-1 p-2 shadow-sm">
                  <For each={["Forbidden Rites", "Runes of Aldur"] as const}>
                    {(choice) => (
                      <li>
                        <a
                          onClick={() => {
                            detailsRef.removeAttribute("open");
                            setLeague(choice);
                          }}
                        >
                          {choice}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </details>
            </label>
          </Card>
          <Card title="Character Name">
            <label class="flex flex-col gap-1.5">
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
            <AppearanceCard />
            <HelpAndTutorialsCard />
            <Card title="Advanced">
              <ToggleRow
                label="Developer options"
                description="Enable additional debugging options"
                checked={dev()}
                onChange={setDev}
              />
              <WidgetToggle
                label="Update"
                description="Auto Update App"
                defaultState={true}
                show={autoUpdate}
                setShow={setAutoUpdate}
              />
            </Card>
          </div>

          <div class="flex flex-col gap-4">
            <Card title="Features">
              <WidgetToggle
                label="Zone"
                description="Zone Widget showing text guide for act progression"
                defaultState={true}
                show={showZone}
                setShow={setShowZone}
              />
              <div class="border-t border-base-content/10" />
              <WidgetToggle
                label="Layout"
                description="Layout Widget showing points of interest"
                defaultState={true}
                show={showLayout}
                setShow={setShowLayout}
              />
            </Card>
            <Card title="Beta features" badge="Beta">
              <WidgetToggle
                label="Inventory"
                description="Scan and View inventory prices"
                defaultState={true}
                show={showInventory}
                setShow={setShowInventory}
              />
              <Show when={showInventory()}>
                <div class="flex gap-2">
                  <button
                    class="btn btn-primary btn-xs"
                    onClick={clearInventory}
                  >
                    Clear Inventory
                  </button>
                  <button
                    class="btn btn-primary btn-xs"
                    onClick={clearRecording}
                  >
                    Reset Auto-Scanning Steps
                  </button>
                </div>
                <ShortcutRecorder
                  name="autoScan"
                  description="Start or stop automatic scanning"
                />
                <ShortcutRecorder
                  name="addStep"
                  description="Record the next scanning step"
                />
                <ShortcutRecorder
                  name="addMouseClick"
                  description="Record a mouse click for the scan"
                />
              </Show>
              <div class="border-t border-base-content/10" />
              <WidgetToggle
                label="Price"
                description="Check item price"
                defaultState={true}
                show={showPrice}
                setShow={setShowPrice}
              />
              <Show when={showPrice()}>
                <ShortcutRecorder
                  name="itemScan"
                  description="Check item price"
                />
              </Show>
            </Card>
          </div>
        </div>
      </div>

      <footer class="mt-4 flex items-center justify-between gap-3 border-t border-base-content/10 bg-base-200/90 px-5 py-3 backdrop-blur">
        <span class="text-xs text-base-content/40">Press Esc to close</span>
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
