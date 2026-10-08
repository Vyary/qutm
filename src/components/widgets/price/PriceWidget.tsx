import { invoke } from "@tauri-apps/api/core";
import { info } from "@tauri-apps/plugin-log";
import { createSignal, For, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { BaseWidget } from "../BaseWidget";
import { openUrl } from "@tauri-apps/plugin-opener";
import { loadMods, saveMods } from "./Mods";
import { Item, parseItem, Requirements } from "./ParseItem";
import { createQuery } from "./CreateQuery";
import { store } from "@/lib/Store";
import { togglePassthrough } from "@/lib/Passthrough";

const [scanItemAction, setScanItemAction] = createSignal<() => Promise<void>>(
  () => Promise.resolve(),
);

function PriceWidget() {
  const [item, setItem] = createStore<Item>({
    category: "",
    rarity: "",
    name: { value: "", disabled: false },
    type: { value: "", disabled: false },
    ilvl: { value: 0, disabled: false },
    quality: { value: 0, disabled: false },
    requires: { value: {}, disabled: false },
    enhancement: [],
    implicit: [],
    explicit: [],
    skill: [],
    corrupted: false,
  });

  const itemReq = (
    req: Requirements,
    reqType: "level" | "str" | "dex" | "int",
  ) => {
    return (
      <span class="col-span-1 inline-flex gap-1">
        <input
          type="text"
          placeholder="min"
          value={req[reqType]?.min || ""}
          onInput={(e) => {
            const val = e.currentTarget.value;
            setItem(
              "requires",
              "value",
              reqType,
              "min",
              val === "" ? undefined : Number(val),
            );
          }}
          class="input input-xs max-w-12"
        />
        <span class="opacity-40">-</span>
        <input
          type="text"
          placeholder="max"
          value={req[reqType]?.max || ""}
          onInput={(e) => {
            const val = e.currentTarget.value;
            setItem(
              "requires",
              "value",
              reqType,
              "max",
              val === "" ? undefined : Number(val),
            );
          }}
          class="input input-xs max-w-12"
        />
        {reqType}
      </span>
    );
  };

  const scanItem = async () => {
    const itemCopy: string = await invoke("os_copy");
    const itemStruct = parseItem(itemCopy);
    setItem(itemStruct);
    togglePassthrough();
  };

  onMount(async () => {
    loadMods();

    const i = await store.get<Item>("item");
    if (i) setItem(i);

    setScanItemAction(() => scanItem);
  });

  onCleanup(async () => {
    await store.set("item", item);
    await store.save();
    await saveMods();
  });

  return (
    <BaseWidget
      name="price"
      defaultPos={{ x: 1375, y: 5 }}
      defaultWidth={{ w: 550 }}
      defaultTransparency={85}
      transparencySlider={true}
    >
      <div class="space-y-1 p-4 text-sm">
        <div
          class="cursor-pointer"
          onClick={() => setItem("name", "disabled", (d) => !d)}
        >
          <span classList={{ "opacity-40": item.name.disabled }}>
            {item.name.value}
          </span>
        </div>

        <div
          class="cursor-pointer"
          onClick={() => setItem("type", "disabled", (d) => !d)}
        >
          <span classList={{ "opacity-40": item.type.disabled }}>
            {item.type.value}
          </span>
        </div>

        <div
          class="cursor-pointer"
          onClick={() => setItem("ilvl", "disabled", (d) => !d)}
        >
          <span classList={{ "opacity-40": item.ilvl.disabled }}>
            Item Level: {item.ilvl.value}
          </span>
        </div>

        <div
          class="cursor-pointer"
          onClick={() => setItem("quality", "disabled", (d) => !d)}
        >
          <span classList={{ "opacity-40": item.quality.disabled }}>
            Quality: {item.quality.value}
          </span>
        </div>

        <div classList={{ "opacity-40": item.requires.disabled }}>
          <span
            class="cursor-pointer"
            onClick={() => setItem("requires", "disabled", (d) => !d)}
          >
            Requires:
          </span>
          <div class="grid grid-cols-2 gap-1 pt-1">
            {itemReq(item.requires.value, "level")}
            {itemReq(item.requires.value, "str")}
            {itemReq(item.requires.value, "dex")}
            {itemReq(item.requires.value, "int")}
          </div>
        </div>

        <div class="border-t border-base-content/10 pt-1">
          <For each={item.skill}>
            {(mod, i) => (
              <div classList={{ "opacity-40": mod.disabled }}>
                <span class="inline-flex gap-1">
                  <input
                    type="text"
                    placeholder="min"
                    value={mod.min || ""}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setItem(
                        "skill",
                        i(),
                        "min",
                        val === "" ? undefined : Number(val),
                      );
                    }}
                    class="input input-xs max-w-12"
                  />
                  <span class="opacity-40">-</span>
                  <input
                    type="text"
                    placeholder="max"
                    value={mod.max || ""}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setItem(
                        "skill",
                        i(),
                        "max",
                        val === "" ? undefined : Number(val),
                      );
                    }}
                    class="input input-xs max-w-12"
                  />
                  <div
                    class="cursor-pointer"
                    onClick={() => setItem("skill", i(), "disabled", (d) => !d)}
                  >
                    {mod.mod}
                  </div>
                </span>
              </div>
            )}
          </For>
          <For each={item.enhancement}>
            {(mod, i) => (
              <div classList={{ "opacity-40": mod.disabled }}>
                <span class="inline-flex gap-1">
                  <input
                    type="text"
                    placeholder="min"
                    value={mod.min || ""}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setItem(
                        "enhancement",
                        i(),
                        "min",
                        val === "" ? undefined : Number(val),
                      );
                    }}
                    class="input input-xs max-w-12"
                  />
                  <span class="opacity-40">-</span>
                  <input
                    type="text"
                    placeholder="max"
                    value={mod.max || ""}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setItem(
                        "enhancement",
                        i(),
                        "max",
                        val === "" ? undefined : Number(val),
                      );
                    }}
                    class="input input-xs max-w-12"
                  />
                  <div
                    class="cursor-pointer"
                    onClick={() =>
                      setItem("enhancement", i(), "disabled", (d) => !d)
                    }
                  >
                    {mod.mod}
                  </div>
                </span>
              </div>
            )}
          </For>
          <For each={item.implicit}>
            {(mod, i) => (
              <div classList={{ "opacity-40": mod.disabled }}>
                <span class="inline-flex gap-1">
                  <input
                    type="text"
                    placeholder="min"
                    value={mod.min || ""}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setItem(
                        "implicit",
                        i(),
                        "min",
                        val === "" ? undefined : Number(val),
                      );
                    }}
                    class="input input-xs max-w-12"
                  />
                  <span class="opacity-40">-</span>
                  <input
                    type="text"
                    placeholder="max"
                    value={mod.max || ""}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setItem(
                        "implicit",
                        i(),
                        "max",
                        val === "" ? undefined : Number(val),
                      );
                    }}
                    class="input input-xs max-w-12"
                  />
                  <div
                    class="cursor-pointer"
                    onClick={() =>
                      setItem("implicit", i(), "disabled", (d) => !d)
                    }
                  >
                    {mod.mod}
                  </div>
                </span>
              </div>
            )}
          </For>
        </div>

        <div class="border-t border-base-content/10 pt-1 space-y-1">
          <For each={item.explicit}>
            {(mod, i) => (
              <div classList={{ "opacity-40": mod.disabled }}>
                <span class="inline-flex gap-1">
                  <input
                    type="text"
                    placeholder="min"
                    value={mod.min || ""}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setItem(
                        "explicit",
                        i(),
                        "min",
                        val === "" ? undefined : Number(val),
                      );
                    }}
                    class="input input-xs max-w-12"
                  />
                  <span class="opacity-40">-</span>
                  <input
                    type="text"
                    placeholder="max"
                    value={mod.max || ""}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setItem(
                        "explicit",
                        i(),
                        "max",
                        val === "" ? undefined : Number(val),
                      );
                    }}
                    class="input input-xs max-w-12"
                  />
                  <div
                    class="cursor-pointer"
                    onClick={() =>
                      setItem("explicit", i(), "disabled", (d) => !d)
                    }
                  >
                    {mod.mod}
                  </div>
                </span>
              </div>
            )}
          </For>
        </div>
      </div>

      <button
        onClick={async () => {
          await openUrl(
            "https://www.pathofexile.com/trade2/search/poe2/Forbidden%20Rites?q=" +
              JSON.stringify(createQuery(item)),
          );

          togglePassthrough();
          info(JSON.stringify(createQuery(item)));
        }}
        class="btn btn-xs"
      >
        Trade
      </button>
      <button onClick={() => invoke("move_mouse")}> Move </button>
    </BaseWidget>
  );
}

export { PriceWidget, scanItemAction };
