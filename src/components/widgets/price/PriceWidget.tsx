import { invoke } from "@tauri-apps/api/core";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { BaseWidget } from "../BaseWidget";
import { openUrl } from "@tauri-apps/plugin-opener";
import { loadMods, saveMods } from "./Mods";
import { Item, parseItem, Requirements, Waystone } from "./ParseItem";
import { createQuery } from "./CreateQuery";
import { enablePassthrough, togglePassthrough } from "@/lib/Passthrough";
import { PriceCheck } from "./PriceChecker";
import { loadOverviews } from "@/lib/Overviews";
import { error, info } from "@tauri-apps/plugin-log";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";

export interface Prices {
  amount: number;
  currency: string;
  listed: string;
}

const [scanItemAction, setScanItemAction] = createSignal<() => Promise<void>>(
  () => Promise.resolve(),
);

let interval: ReturnType<typeof setInterval> | undefined;

function PriceWidget() {
  const [item, setItem] = createStore<Item>({
    category: "",
    rarity: { value: "", disabled: false },
    name: { value: "", disabled: false },
    type: { value: "", disabled: false },
    ilvl: { value: 0, disabled: false },
    quality: { value: 0, disabled: false },
    requires: { value: {}, disabled: false },
    waystone: { value: {}, disabled: false },
    sockets: { value: 0, disabled: false },
    enhancement: [],
    implicit: [],
    explicit: [],
    skill: [],
  });
  const [timeout, setTimeoutLeft] = createSignal(0);
  const [prices, setPrices] = createSignal<Prices[]>([]);
  let enterTime = 0;
  const reqTime = 1000;

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

  const waystoneStat = (
    waystone: Waystone,
    statType: keyof Waystone,
    label: string,
  ) => {
    return (
      <span class="col-span-1 inline-flex gap-1">
        <input
          type="text"
          placeholder="min"
          value={waystone[statType]?.min ?? ""}
          onInput={(e) => {
            const val = e.currentTarget.value;
            setItem(
              "waystone",
              "value",
              statType,
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
          value={waystone[statType]?.max ?? ""}
          onInput={(e) => {
            const val = e.currentTarget.value;
            setItem(
              "waystone",
              "value",
              statType,
              "max",
              val === "" ? undefined : Number(val),
            );
          }}
          class="input input-xs max-w-12"
        />
        {label}
      </span>
    );
  };

  const startCountdown = (ms: number) => {
    clearInterval(interval);
    const deadline = Date.now() + ms;
    setTimeoutLeft(ms);

    interval = setInterval(() => {
      const rem = deadline - Date.now();
      if (rem <= 0) {
        clearInterval(interval);
        setTimeoutLeft(0);
        getPrice();
      } else {
        setTimeoutLeft(rem);
      }
    }, 100);
  };

  const getPrice = async () => {
    if (timeout()) {
      return;
    }

    setPrices([]);

    try {
      const pcr = await PriceCheck(item, JSON.stringify(createQuery(item)));
      if (pcr.timeout) {
        startCountdown(pcr.timeout);
        return;
      }
      setPrices(pcr.prices);
    } catch (e) {
      setPrices([]);
      error("getting price: " + e);
    }
  };

  const scanItem = async () => {
    const itemCopy: string = await invoke("os_copy");
    info(`copied item: \n${itemCopy}`);
    const itemStruct = parseItem(itemCopy);
    setItem("corrupted", undefined);
    setItem("mirrored", undefined);
    setItem("sanctified", undefined);
    setItem(itemStruct);
    togglePassthrough();
    info(JSON.stringify(createQuery(item)));
    getPrice();
  };

  let unlisten: UnlistenFn = () =>
    info("price widget on close unlisten not updated");

  onMount(async () => {
    loadMods();
    loadOverviews();
    setScanItemAction(() => scanItem);

    // const i = await store.get<Item>("item");
    // if (i) setItem(i);

    unlisten = await getCurrentWindow().onCloseRequested(async () => {
      await saveMods();
      clearInterval(interval);
    });
  });

  onCleanup(async () => {
    // await store.set("item", item);
    // await store.save();
    await saveMods();
    clearInterval(interval);
    unlisten();
  });

  return (
    <Show when={item.category}>
      <div
        onMouseEnter={() => (enterTime = Date.now())}
        onMouseLeave={() => {
          if (Date.now() - enterTime >= reqTime) {
            info("on mouse leave triggered");
            enablePassthrough();
          }
        }}
      >
        <BaseWidget
          name="price"
          defaultPos={{ x: 50, y: 170 }}
          defaultWidth={{ w: 550 }}
          defaultTransparency={85}
          transparencySlider={true}
        >
          <div class="space-y-1 p-4 text-sm">
            <div class="flex justify-between items-center">
              <div class="flex flex-col gap-1">
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
              </div>

              <div class="flex flex-col gap-1">
                <div
                  class="cursor-pointer"
                  classList={{
                    "badge badge-sm badge-soft badge-error": item.corrupted
                      ? true
                      : false,
                    "badge badge-sm badge-soft badge-warning": item.sanctified
                      ? true
                      : false,
                    "badge badge-sm badge-soft badge-info": item.mirrored
                      ? true
                      : false,
                  }}
                  onClick={() => {
                    setItem(
                      item?.corrupted
                        ? "corrupted"
                        : item?.sanctified
                          ? "sanctified"
                          : item?.mirrored
                            ? "mirrored"
                            : "corrupted",
                      "disabled",
                      (d) => !d,
                    );
                  }}
                >
                  <span
                    classList={{
                      "opacity-40":
                        item?.corrupted?.disabled ||
                        item?.sanctified?.disabled ||
                        item?.mirrored?.disabled,
                    }}
                  >
                    {item.corrupted
                      ? "Corrupted"
                      : item.sanctified
                        ? "Sanctified"
                        : item.mirrored
                          ? "Mirrored"
                          : ""}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span
                class="cursor-pointer"
                onClick={() => setItem("rarity", "disabled", (d) => !d)}
                classList={{ "opacity-40": item.rarity.disabled }}
              >
                Rarity: {item.rarity.value}
              </span>
            </div>

            <div>
              <span
                class="cursor-pointer"
                onClick={() => setItem("ilvl", "disabled", (d) => !d)}
                classList={{ "opacity-40": item.ilvl.disabled }}
              >
                Item Level: {item.ilvl.value}
              </span>
            </div>

            <div>
              <span
                class="cursor-pointer"
                onClick={() => setItem("quality", "disabled", (d) => !d)}
                classList={{ "opacity-40": item.quality.disabled }}
              >
                Quality: {item.quality.value}
              </span>
            </div>

            <div>
              <span
                class="cursor-pointer"
                onClick={() => setItem("sockets", "disabled", (d) => !d)}
                classList={{ "opacity-40": item.sockets.disabled }}
              >
                Sockets: {item.sockets.value}
              </span>
            </div>

            <div class="divider my-0 opacity-50"></div>

            <Show when={item.category != "Waystones"}>
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
            </Show>

            <Show when={item.category == "Waystones"}>
              <div classList={{ "opacity-40": item.waystone.disabled }}>
                <span
                  class="cursor-pointer"
                  onClick={() => setItem("waystone", "disabled", (d) => !d)}
                >
                  Waystone Stats:
                </span>
                <div class="grid grid-cols-2 gap-1 pt-1">
                  {waystoneStat(item.waystone.value, "tier", "Tier")}
                  {waystoneStat(
                    item.waystone.value,
                    "monsterEff",
                    "Monster Eff.",
                  )}
                  {waystoneStat(
                    item.waystone.value,
                    "monsterRarity",
                    "Monster Rarity",
                  )}
                  {waystoneStat(
                    item.waystone.value,
                    "dropChance",
                    "Drop Chance",
                  )}
                  {waystoneStat(item.waystone.value, "packsize", "Pack Size")}
                  {waystoneStat(
                    item.waystone.value,
                    "itemRarity",
                    "Item Rarity",
                  )}
                  {waystoneStat(item.waystone.value, "revives", "Revives")}
                </div>
              </div>
            </Show>

            <div class="divider my-0 opacity-50"></div>

            <div class="">
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
                        onClick={() =>
                          setItem("skill", i(), "disabled", (d) => !d)
                        }
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

            <div class="divider my-0 opacity-50"></div>

            <div class="space-y-1">
              <For each={item.explicit}>
                {(mod, i) => (
                  <div classList={{ "opacity-40": mod.disabled }}>
                    <span class="inline-flex items-center gap-1">
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
                      <div
                        class="cursor-pointer text-xs "
                        classList={{
                          "opacity-40": mod.fractured?.disabled,
                          "badge badge-xs badge-soft badge-warning":
                            mod.fractured ? true : false,
                        }}
                        onClick={() => {
                          setItem(
                            "explicit",
                            i(),
                            "fractured",
                            "disabled",
                            (d) => !d,
                          );
                        }}
                      >
                        {mod.fractured ? "Fractured" : ""}
                      </div>
                    </span>
                  </div>
                )}
              </For>
            </div>

            <div class="divider my-0 opacity-50"></div>

            <div class="w-full inline-flex justify-between">
              <div>
                <button
                  onClick={async () => {
                    getPrice();
                  }}
                  class="btn btn-xs btn-soft"
                  classList={{
                    "btn-disabled": timeout() > 0,
                    "font-mono": timeout() > 0,
                  }}
                >
                  {timeout() > 0
                    ? `${(timeout() / 1000).toFixed(1)}s`
                    : "Recheck price"}
                </button>
              </div>
              <button
                onClick={async () => {
                  await openUrl(
                    "https://www.pathofexile.com/trade2/search/poe2/Forbidden%20Rites?q=" +
                      JSON.stringify(createQuery(item)),
                  );

                  togglePassthrough();
                }}
                class="btn btn-xs btn-soft"
              >
                Trade
              </button>
            </div>

            <For each={prices()}>
              {(p) => (
                <div class="flex justify-between px-1">
                  <span class="">
                    {p.amount >= 1 ? p.amount : p.amount.toFixed(4)}{" "}
                    {p.currency}
                  </span>
                  <span>{p.listed}</span>
                </div>
              )}
            </For>
          </div>
        </BaseWidget>
      </div>
    </Show>
  );
}

export { PriceWidget, scanItemAction };
