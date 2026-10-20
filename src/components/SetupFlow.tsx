import { createSignal, For, onMount, Show, type JSX } from "solid-js";
import { filePath, selectFile, startTailing, watching } from "@/lib/File";
import { ZoneSettings } from "./widgets/zone/ZoneSettings";
import { LayoutSettings } from "./widgets/layout/LayoutSettings";
import { InventorySettings } from "./widgets/inventory/InventorySettings";
import { PriceSettings } from "./widgets/price/PriceSettings";
import {
  disablePassthrough,
  enablePassthrough,
  togglePassthrough,
} from "@/lib/Passthrough";
import { Shortcut } from "./Shortcut";
import { store } from "@/lib/Store";

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
] as const;

export const [showSetup, setShowSetup] = createSignal(false);

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
            class="h-1 flex-1 rounded-full transition-colors"
            classList={{
              "bg-primary": i() <= props.current,
              "bg-base-content/10": i() > props.current,
            }}
          />
        )}
      </For>
    </div>
  );
}

export function SetupFlow() {
  const [step, setStep] = createSignal(0);
  const [error, setError] = createSignal("");

  const isLast = () => step() === steps.length - 1;

  const validate = () => {
    setError("");
    if (step() === 0 && !filePath().trim()) {
      setError("Please locate your Client.txt file.");
      return false;
    }
    return true;
  };

  const next = async () => {
    if (!validate()) return;

    if (!isLast()) {
      setStep((current) => current + 1);
      return;
    }

    if (!watching()) startTailing();
    setShowSetup(false);
    enablePassthrough();
    await store.set("showSetup", false);
    await store.save();
  };

  const back = () => {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  };

  onMount(async () => {
    const show = (await store.get<boolean>("showSetup")) ?? true;
    setShowSetup(show);
    if (show) disablePassthrough();
  });

  return (
    <Show when={showSetup()}>
      <div class="absolute z-30 w-[44rem] max-w-[calc(100vw-2rem)] select-none rounded-2xl bg-base-200 ring-1 ring-base-content/5 backdrop-blur-md">
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
                      readOnly
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
                  <Shortcut
                    name="Overlay Toggle"
                    action={async () => togglePassthrough()}
                    defaultKey="F"
                    ctrl
                    shift
                    global
                  />
                </Card>
              </div>
            </Show>

            <Show when={step() === 2}>
              <div class="grid grid-cols-2 items-start gap-4">
                <Card title="Features">
                  <ZoneSettings />
                  <LayoutSettings />
                </Card>
                <Card title="Beta features" badge="Beta">
                  <InventorySettings />
                  <div class="border-t border-base-content/10" />
                  <PriceSettings />
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
          <button
            type="button"
            class="btn btn-primary btn-sm min-w-32"
            onClick={next}
          >
            {isLast() ? "Finish setup" : "Continue"}
          </button>
        </footer>
      </div>
    </Show>
  );
}
