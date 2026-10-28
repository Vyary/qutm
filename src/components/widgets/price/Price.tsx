import { invoke } from "@tauri-apps/api/core";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { BaseWidget } from "../BaseWidget";
import { loadMods, saveMods } from "./utils/Mods";
import { disablePassthrough, enablePassthrough } from "@/lib/Passthrough";
import { loadOverviews } from "@/lib/Overviews";
import { error, info } from "@tauri-apps/plugin-log";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";
import { PriceCheck } from "./utils/PriceChecker";
import { createQuery } from "./utils/CreateQuery";
import { Item, Prices } from "./utils/Types";
import { parseItem } from "./utils/ParseItem";
import { ItemRenderer } from "./ItemRenderer";

export const [scanItemAction, setScanItemAction] = createSignal<
  () => Promise<void>
>(() => Promise.resolve());

let interval: ReturnType<typeof setInterval> | undefined;

export function Price() {
  const [item, setItem] = createStore<Item>({
    name: { value: "", disabled: true },
    TypeFilters: { filters: { category: { value: "", disabled: true } } },
    EquipmentFilters: { filters: {}, disabled: true },
    ReqFilters: { filters: {}, disabled: true },
    MapFilters: { filters: {}, disabled: true },
    MiscFilters: { filters: {}, disabled: true },
    enhancement: [],
    implicit: [],
    explicit: [],
    skill: [],
  });
  const [timeout, setTimeoutLeft] = createSignal(0);
  const [prices, setPrices] = createSignal<Prices[]>([]);
  const [closeOverlay, setCloseOverlay] = createSignal(false);
  let requestId = 0;
  let disposed = false;
  let unlisten: UnlistenFn = () =>
    info("price widget on close unlisten not updated");

  const round2 = (num: number) => Math.round(num * 100) / 100;

  const applyDps = (item: Item): Item => {
    const ef = item.EquipmentFilters.filters;
    if (!ef.pdps && !ef.edps) return item;

    const aps = ef.aps?.value.min ?? 0;
    const pdps = ef.pdps?.value.min ?? 0;
    const edps = ef.edps?.value.min ?? 0;

    if (ef.pdps) ef.pdps.value.min = round2(pdps * aps);
    if (ef.edps) ef.edps.value.min = round2(edps * aps);

    const totalDps = (ef.pdps?.value.min ?? 0) + (ef.edps?.value.min ?? 0);
    ef.dps = { value: { min: totalDps }, disabled: true };

    return item;
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
    const s = performance.now();
    if (timeout()) return;
    const id = ++requestId;
    setPrices([]);
    try {
      const q = JSON.stringify(createQuery(item));
      info(`query creating took: ${(performance.now() - s).toFixed(2)}ms`);
      const p = await PriceCheck(item, q);
      if (id !== requestId) return;
      if (p.timeout) return startCountdown(p.timeout);
      setPrices(p.prices);
      info(`pricing took: ${(performance.now() - s).toFixed(2)}ms`);
    } catch (e) {
      if (id === requestId) setPrices([]);
      error("getting price: " + e);
    }
  };

  const scanItem = async () => {
    try {
      let s = performance.now();
      const itemCopy: string = await invoke("os_copy");
      info(`copied item: \n${itemCopy}`);
      info(`copy took: ${(performance.now() - s).toFixed(2)}ms`);
      s = performance.now();
      const itemStruct = parseItem(itemCopy);
      info(`parsed item: \n${JSON.stringify(itemStruct)}`);
      info(`parse took: ${(performance.now() - s).toFixed(2)}ms`);
      s = performance.now();
      setItem(reconcile(applyDps(itemStruct)));
      disablePassthrough();
      info(`set took: ${(performance.now() - s).toFixed(2)}ms`);
      getPrice();
      setCloseOverlay(true);
    } catch (e) {
      error(`scanning item: ${e}`);
    }
  };

  onMount(async () => {
    loadMods();
    loadOverviews();
    setScanItemAction(() => scanItem);

    const un = await getCurrentWindow().onCloseRequested(async () => {
      await saveMods();
      clearInterval(interval);
    });
    if (disposed) un();
    else unlisten = un;
  });

  onCleanup(async () => {
    disposed = true;
    requestId++;
    clearInterval(interval);
    unlisten();
    setScanItemAction(() => () => Promise.resolve());
    await saveMods().catch((e) => error(`saving mods: ${e}`));
  });

  return (
    <>
      <div
        class="min-h-dvh min-w-dvw"
        onClick={() => {
          if (closeOverlay()) enablePassthrough();
          setCloseOverlay(false);
        }}
      >
        hi
      </div>
      <Show when={item.TypeFilters.filters.category.value}>
        <BaseWidget
          name="price"
          defaultPos={{ x: 50, y: 170 }}
          defaultWidth={{ w: 550 }}
          defaultTransparency={85}
          transparencySlider={true}
        >
          <ItemRenderer
            item={item}
            setItem={setItem}
            prices={prices}
            timeout={timeout}
            getPrice={getPrice}
          />
        </BaseWidget>
      </Show>
    </>
  );
}
