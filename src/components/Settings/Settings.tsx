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
import { clearInventory } from "../Inventory/InventoryState";
import { startTour } from "../Help/Tour";

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
          Tour over enabled widgets.
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-soft btn-sm"
            onClick={() => {
              setShowSettings(false);
              startTour("complete");
            }}
          >
            Complete tour
          </button>

          <Show when={showZone()}>
            <button
              type="button"
              class="btn btn-soft btn-sm"
              onClick={() => {
                setShowSettings(false);
                startTour("zone");
              }}
            >
              Zone widget tour
            </button>
          </Show>

          <Show when={showLayout()}>
            <button
              type="button"
              class="btn btn-soft btn-sm"
              onClick={() => {
                setShowSettings(false);
                startTour("layout");
              }}
            >
              Layout widget tour
            </button>
          </Show>

          <Show when={showPrice()}>
            <button
              type="button"
              class="btn btn-soft btn-sm"
              onClick={() => {
                setShowSettings(false);
                startTour("price");
              }}
            >
              Price widget tour
            </button>
          </Show>

          <Show when={showInventory()}>
            <button
              type="button"
              class="btn btn-soft btn-sm"
              onClick={() => {
                setShowSettings(false);
                startTour("inventory");
              }}
            >
              Inventory widget tour
            </button>
          </Show>
        </div>
      </div>
    </Card>
  );
}

export const [showSettings, setShowSettings] = createSignal(false);

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
          <span class="text-xs text-base-content/50">v0.8.6</span>
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
                <ul class="menu dropdown-content bg-base-200 border border-base-content/5 rounded-box z-1 p-2 shadow-sm min-w-50">
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
                </div>
                <ShortcutRecorder
                  name="scanAndAdd"
                  description="Scan and add item to the inventory system"
                />
              </Show>
            </Card>
          </div>
        </div>
      </div>

      <footer class="mt-4 flex items-center justify-between gap-3 border-t border-base-content/10 bg-base-200/90 px-5 py-3 backdrop-blur">
        <div class="flex flex-wrap gap-2">
          <a
            href="https://discord.com/invite/TfpK2fnCmF"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm border-none bg-[#5865F2] text-white hover:bg-[#4752c4]"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
            Discord
          </a>
          <a
            href="https://patreon.com/qutm"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm border-none bg-black text-white hover:bg-neutral-800"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 12.396 5.369 12.46 3.765.047 4.326-4.804 6.068-7.141 1.24-1.662 2.836-2.132 4.801-2.618 3.376-.836 5.678-3.501 5.673-7.031Z" />
            </svg>
            Patreon
          </a>
        </div>
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
