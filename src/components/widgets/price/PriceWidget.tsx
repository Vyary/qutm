import { invoke } from "@tauri-apps/api/core";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { error } from "@tauri-apps/plugin-log";
import { For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { BaseWidget } from "../BaseWidget";
import { openUrl } from "@tauri-apps/plugin-opener";
import { loadMods, saveMods } from "./Mods";
import { Item, ItemMod, parseItem } from "./ParseItem";
import { createQuery } from "./CreateQuery";

function PriceWidget(props: { shortcut: string }) {
  const [item, setItem] = createStore<Item>({
    category: "",
    rarity: "",
    name: { value: "", disabled: false },
    type: { value: "", disabled: false },
    requires: { value: 0, disabled: false },
    ilvl: { value: 0, disabled: false },
    implicit: [],
    explicit: [],
  });

  onMount(async () => {
    loadMods();

    try {
      await register(props.shortcut, async (e) => {
        if (e.state === "Pressed") {
          await invoke("os_copy");
          const itemCopy = await readText();
          const itemStruct = parseItem(itemCopy);
          setItem(itemStruct);
        }
      });
    } catch (e) {
      error("while pricing item: " + e);
    }
  });

  onCleanup(async () => {
    await saveMods();
    unregister(props.shortcut);
  });

  return (
    <BaseWidget
      name="price"
      defaultPos={{ x: 1375, y: 5 }}
      defaultWidth={{ w: 550 }}
      defaultTransparency={25}
      transparencySlider={true}
    >
      <main class="mx-auto w-full max-w-xl p-4 sm:p-6">
        <div class="space-y-4">
          <header class="flex items-end justify-between gap-4">
            <div>
              <h1 class="text-lg font-semibold tracking-tight">Price Check</h1>
              <p class="mt-0.5 text-xs text-base-content/50">
                Select the fields to include in your search.
              </p>
            </div>

            <kbd class="kbd kbd-sm text-base-content/60">{props.shortcut}</kbd>
          </header>

          <section class="overflow-hidden rounded-xl border border-base-300 bg-base-100">
            <div class="border-b border-base-300 px-4 py-3">
              <h2 class="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Item
              </h2>
            </div>

            <div class="divide-y divide-base-300">
              <FieldRow
                label="Name"
                enabled={!item.name.disabled}
                onToggle={(v) => setItem("name", "disabled", v)}
              >
                <input
                  type="text"
                  class="input input-ghost input-sm w-full px-2"
                  value={item.name.value}
                  disabled={!item.name.disabled}
                  onInput={(e) =>
                    setItem("name", "value", e.currentTarget.value)
                  }
                />
              </FieldRow>

              <FieldRow
                label="Type"
                enabled={!item.type.disabled}
                onToggle={(v) => setItem("type", "disabled", v)}
              >
                <input
                  type="text"
                  class="input input-ghost input-sm w-full px-2"
                  value={item.type.value}
                  disabled={item.type.disabled}
                  onInput={(e) =>
                    setItem("type", "value", e.currentTarget.value)
                  }
                />
              </FieldRow>

              <FieldRow
                label="Requires"
                enabled={!item.requires.disabled}
                onToggle={(v) => setItem("requires", "disabled", v)}
              >
                <input
                  type="number"
                  class="input input-ghost input-sm w-full px-2"
                  value={item.requires.value}
                  disabled={!item.requires.disabled}
                  onInput={(e) =>
                    setItem("requires", "value", Number(e.currentTarget.value))
                  }
                />
              </FieldRow>

              <FieldRow
                label="Item Level"
                enabled={!item.ilvl.disabled}
                onToggle={(v) => setItem("ilvl", "disabled", v)}
              >
                <input
                  type="number"
                  class="input input-ghost input-sm w-full px-2"
                  value={item.ilvl.value}
                  disabled={!item.ilvl.disabled}
                  onInput={(e) =>
                    setItem("ilvl", "value", Number(e.currentTarget.value))
                  }
                />
              </FieldRow>
            </div>
          </section>

          <ModList
            title="Implicit"
            mods={item.implicit}
            onToggle={(i, v) => setItem("implicit", i, "disabled", v)}
            onValueChange={(i, v) => setItem("implicit", i, "value", v)}
          />

          <ModList
            title="Explicit"
            mods={item.explicit}
            onToggle={(i, v) => setItem("explicit", i, "disabled", v)}
            onValueChange={(i, v) => setItem("explicit", i, "value", v)}
          />
        </div>
        <button
          class="btn"
          onClick={async () => {
            await openUrl(
              "https://www.pathofexile.com/trade2/search/poe2/Forbidden%20Rites?q=" +
                JSON.stringify(createQuery(item)),
            );
          }}
        >
          trade
        </button>
      </main>
    </BaseWidget>
  );
}

function FieldRow(props: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: any;
}) {
  return (
    <div
      class={`flex min-h-12 items-center gap-3 px-4 py-2 transition-colors ${
        props.enabled ? "bg-base-100" : "bg-base-200/20"
      }`}
    >
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        checked={props.enabled}
        onChange={(e) => props.onToggle(e.currentTarget.checked)}
      />

      <span
        class={`w-24 shrink-0 text-sm ${
          props.enabled
            ? "font-medium text-base-content"
            : "text-base-content/40"
        }`}
      >
        {props.label}
      </span>

      <div
        class={`min-w-0 flex-1 ${props.enabled ? "opacity-100" : "opacity-40"}`}
      >
        {props.children}
      </div>
    </div>
  );
}

function ModList(props: {
  title: string;
  mods: ItemMod[];
  onToggle: (index: number, value: boolean) => void;
  onValueChange: (index: number, value: number) => void;
}) {
  return (
    <section class="overflow-hidden rounded-xl border border-base-300 bg-base-100">
      <div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-base-content/50">
          {props.title}
        </h2>

        {props.mods.length > 0 && (
          <span class="badge badge-ghost badge-sm">{props.mods.length}</span>
        )}
      </div>

      <Show
        when={props.mods.length > 0}
        fallback={
          <div class="px-4 py-6 text-center">
            <p class="text-sm text-base-content/40">
              No {props.title.toLowerCase()} modifiers
            </p>
          </div>
        }
      >
        <div class="divide-y divide-base-300">
          <For each={props.mods}>
            {(mod, i) => {
              const [before, after] = mod.mod.split("#");

              return (
                <div class="flex items-start gap-3 px-4 py-3 hover:bg-base-200/30 transition-colors">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm mt-1"
                    checked={mod.disabled}
                    onChange={(e) =>
                      props.onToggle(i(), e.currentTarget.checked)
                    }
                  />

                  <div
                    class={`flex flex-wrap items-center gap-1 text-sm leading-6 ${
                      mod.disabled
                        ? "text-base-content"
                        : "text-base-content/35"
                    }`}
                  >
                    <span>{before}</span>

                    <input
                      type="number"
                      value={mod.value}
                      disabled={!mod.disabled}
                      class="input input-bordered input-xs w-20 text-center"
                      onInput={(e) =>
                        props.onValueChange(i(), Number(e.currentTarget.value))
                      }
                    />

                    <span>{after}</span>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </section>
  );
}
export { PriceWidget };
