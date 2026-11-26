import { filePath, selectFile } from "@/lib/File";
import { enablePassthrough } from "@/lib/Passthrough";
import { store } from "@/lib/Store";
import { createSignal, For, Show } from "solid-js";
import { ShortcutRecorder } from "../ShortcutRecorder";
import { JSX } from "@solidjs/web/jsx-runtime";
import { setShowZone, showZone } from "../Zone/Zone";
import { setShowLayout, showLayout } from "../Layout/Layout";
import { setShowInventory, showInventory } from "../Inventory/Inventory";
import { setShowPrice, showPrice } from "../Price/Price";
import { WidgetToggle } from "./WidgetToggle";
import { startTour } from "../Help/Tour";

const steps = [
  {
    title: "Client.txt location",
    description:
      "This is the log file used for showing/hiding the overlay and changing the zones",
  },
  {
    title: "Overlay Toggle",
    description: "Shortcut for showing and hiding the overlay",
  },
  { title: "Widgets", description: "Enable/Disable overlay widgets" },
  {
    title: "You're ready",
    description:
      "Everything is configured. Take a quick tour of the widgets, or jump straight into the game.",
  },
] as const;

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

const isClientTxt = (path: string) => /(^|[\\/])Client\.txt$/.test(path);

function ProgressBar(props: { current: number }) {
  return (
    <div class="flex gap-1.5" aria-hidden="true">
      <For each={steps}>
        {(_, i) => (
          <div
            class={[
              "h-1 flex-1 rounded-full transition-colors",
              { "bg-primary": i() <= props.current },
              { "bg-base-content/10": i() > props.current },
            ]}
          />
        )}
      </For>
    </div>
  );
}

export const [showSetup, setShowSetup] = createSignal(false);

export function SetupFlow() {
  const [step, setStep] = createSignal(0);
  const [error, setError] = createSignal("");

  const isLast = () => step() === steps.length - 1;

  const enabledWidgets = () => {
    const list = [];

    if (showZone()) list.push("Zone guide");
    if (showLayout()) list.push("Layout map");
    if (showInventory()) list.push("Inventory");
    if (showPrice()) list.push("Price checker");

    return list;
  };

  const validate = () => {
    setError("");
    if (step() === 0 && !filePath().trim()) {
      setError("Please locate your Client.txt file.");
      return false;
    }
    return true;
  };

  const finish = async (tour: boolean) => {
    setShowSetup(false);
    await store.set("showSetup", false);
    await store.save();

    if (tour) {
      startTour("complete");
      return;
    }

    enablePassthrough();
  };

  const next = async () => {
    if (!validate()) return;

    setStep((current) => current + 1);
  };

  const back = () => {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  };

  return (
    <div class="absolute z-30 w-176 max-w-[calc(100vw-2rem)] select-none rounded-2xl bg-base-200 ring-1 ring-base-content/5 backdrop-blur-md">
      <div class="px-5 pt-4">
        <header class="mb-4 flex items-center justify-between border-b border-base-content/10 pb-3">
          <h2 class="text-sm font-semibold uppercase tracking-widest opacity-80">
            Quick setup
          </h2>
          <span class="text-xs tabular-nums opacity-50">
            Step {step() + 1} of {steps.length}
          </span>
        </header>

        <ProgressBar current={step()} />

        <div class="mb-4 mt-4 flex flex-col gap-1">
          <h1 class="text-xl font-bold tracking-tight">
            {steps[step()].title}
          </h1>
          <p class="text-sm text-base-content/60">
            {steps[step()].description}
          </p>
        </div>

        <Show when={error()}>
          <div
            role="alert"
            class="alert alert-error alert-soft mb-4 py-2 text-sm"
          >
            <span>{error()}</span>
          </div>
        </Show>

        <div class="min-h-40">
          <Show when={step() === 0}>
            <Card title="Client file">
              <div class="flex flex-col gap-1.5">
                <div class="join w-full">
                  <button
                    class="btn btn-soft btn-sm join-item"
                    onClick={selectFile}
                  >
                    Browse
                  </button>
                  <input
                    type="text"
                    class="input input-sm join-item flex-1 truncate font-mono"
                    placeholder="...\Path of Exile 2\logs\Client.txt"
                    value={filePath()}
                  />
                </div>
                <Show when={filePath() && !isClientTxt(filePath())}>
                  <p class="text-xs text-warning">
                    This doesn't look like Client.txt
                  </p>
                </Show>
              </div>
            </Card>
          </Show>

          <Show when={step() === 1}>
            <div class="mx-auto w-full max-w-xs">
              <Card title="Shortcut">
                <ShortcutRecorder
                  name="overlay"
                  description="Show or hide overlay"
                />
              </Card>
            </div>
          </Show>

          <Show when={step() === 2}>
            <div class="grid grid-cols-2 items-start gap-4">
              <Card title="Leveling">
                <WidgetToggle
                  label="Zone"
                  description="Zone Widget showing text guide for act progression"
                  show={showZone}
                  setShow={setShowZone}
                />
                <div class="border-t border-base-content/10" />
                <WidgetToggle
                  label="Layout"
                  description="Layout Widget showing points of interest"
                  show={showLayout}
                  setShow={setShowLayout}
                />
              </Card>
              <Card title="Item Pricing">
                <WidgetToggle
                  label="Price"
                  description="Check Item Price"
                  show={showPrice}
                  setShow={setShowPrice}
                />
                <div class="border-t border-base-content/10" />
                <WidgetToggle
                  label="Inventory"
                  description="Scan and View inventory prices"
                  show={showInventory}
                  setShow={setShowInventory}
                />
              </Card>
            </div>
          </Show>

          <Show when={step() === 3}>
            <div class="flex flex-col gap-4">
              <Card title="Enabled widgets">
                <ul class="flex flex-col gap-2 text-sm">
                  <For each={enabledWidgets()}>
                    {(widget) => (
                      <li class="flex items-center gap-2">
                        <button class="btn btn-circle btn-ghost btn-sm text-success bg-success/10">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="lucide lucide-check preview-icon"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </button>
                        <span>{widget}</span>
                      </li>
                    )}
                  </For>
                </ul>

                <Show when={enabledWidgets().length === 0}>
                  <p class="text-xs text-base-content/50">
                    No widgets enabled. You can turn them on later in Settings
                    or in the previous step.
                  </p>
                </Show>
              </Card>

              <Card title="What happens next">
                <p class="text-sm leading-relaxed text-base-content/70">
                  The overlay stays out of your way until you press your overlay
                  shortcut. Widgets can be dragged, faded, and configured from
                  Settings in the tray menu.
                </p>
              </Card>
            </div>
          </Show>
        </div>
      </div>

      <footer class="mt-4 flex items-center justify-between gap-3 rounded-b-2xl border-t border-base-content/10 bg-base-200/90 px-5 py-3">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          disabled={step() === 0}
          onClick={back}
        >
          Back
        </button>
        <Show when={!isLast()}>
          <button
            type="button"
            class="btn btn-primary btn-sm min-w-32"
            onClick={next}
          >
            Continue
          </button>
        </Show>
        <Show when={isLast()}>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm min-w-32"
              onClick={() => finish(false)}
            >
              Skip for now
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm min-w-32"
              onClick={() => finish(true)}
            >
              Take a tour
            </button>
          </div>
        </Show>
      </footer>
    </div>
  );
}
