import { createSignal, onMount, Show } from "solid-js";
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
];

export const [showSetup, setShowSetup] = createSignal(false);

export function SetupFlow() {
  const [step, setStep] = createSignal(0);
  const [errors, setErrors] = createSignal("");

  const validate = () => {
    setErrors("");

    if (step() === 0) {
      if (!filePath().trim()) {
        setErrors("Please locate your Client.txt file.");
        return false;
      }
    }

    return true;
  };

  const next = () => {
    if (!validate()) return;

    if (step() < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    if (!watching()) startTailing();
    setShowSetup(false);
    enablePassthrough();
    store.set("showSetup", false);
  };

  const back = () => {
    setErrors("");
    setStep((current) => Math.max(0, current - 1));
  };

  onMount(async () => {
    const show = (await store.get<boolean>("showSetup")) ?? true;
    setShowSetup(show);
    if (show) disablePassthrough();
  });

  return (
    <Show when={showSetup()}>
      <div class="absolute h-auto backdrop-blur-md rounded-2xl ring-1 ring-base-content/5 bg-base-200">
        <div class="px-4 py-10">
          <div class="mx-auto max-w-3xl">
            <header class="mb-10 text-center">
              <div class="badge badge-primary badge-outline mb-4">
                QUICK SETUP
              </div>
              <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
                Let's get you started
              </h1>
              <p class="mt-3 text-base-content/60">
                A few quick steps to set up your new overlay.
              </p>
            </header>

            <div class="card border border-base-300 bg-base-100 shadow-xl">
              <div class="card-body p-5 sm:p-8">
                <div class="mb-7">
                  <p class="text-sm font-medium text-primary">
                    STEP {step() + 1} OF {steps.length}
                  </p>
                  <h2 class="mt-2 text-2xl font-bold">{steps[step()].title}</h2>
                  <p class="mt-1 text-base-content/60">
                    {steps[step()].description}
                  </p>
                </div>

                <Show when={!!errors()}>
                  <div role="alert" class="alert alert-error mb-5">
                    <span>{errors()}</span>
                  </div>
                </Show>

                <Show when={step() === 0}>
                  <div class="space-y-5">
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
                  </div>
                </Show>

                <Show when={step() === 1}>
                  <Shortcut
                    name="Overlay Toggle"
                    action={async () => togglePassthrough()}
                    defaultKey="F"
                    ctrl={true}
                    shift={true}
                    global={true}
                  />
                </Show>

                <Show when={step() === 2}>
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
                </Show>

                <div class="mt-8 flex items-center justify-between gap-3 border-t border-base-300 pt-6">
                  <button
                    type="button"
                    class="btn btn-ghost"
                    disabled={step() === 0}
                    onClick={back}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    class="btn btn-primary min-w-32"
                    onClick={next}
                  >
                    {step() === steps.length - 1 ? "Finish setup" : "Continue"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
