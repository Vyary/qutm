import { overviewPrice, overviews } from "@/lib/Overviews";
import { createSignal, createStore } from "solid-js";
import { Item, Prices } from "./Types";
import { invoke } from "@tauri-apps/api/core";
import { error, info } from "@tauri-apps/plugin-log";
import { disablePassthrough } from "@/lib/Passthrough";
import { setCloseOverlay } from "@/lib/CloseOverlay";
import { OverviewsPrice, PriceCheck } from "./PriceChecker";
import { createQuery } from "./CreateQuery";
import { parseItem } from "./ParseItem";

export const emptyItem = {
  TypeFilters: { filters: { category: { value: "", disabled: true } } },
  EquipmentFilters: { filters: {}, disabled: true },
  ReqFilters: { filters: {}, disabled: true },
  MapFilters: { filters: {}, disabled: true },
  MiscFilters: { filters: {}, disabled: true },
  enhancement: [],
  implicit: [],
  explicit: [],
  skill: [],
  runes: [],
};

export const [item, setItem] = createStore<Item>(emptyItem);
export const [prices, setPrices] = createSignal<Prices[]>([]);
export const [ovPrice, setOvPrice] = createSignal(false);
export const [timeout, setTimeoutLeft] = createSignal(0);
let requestId = 0;
let interval: ReturnType<typeof setInterval> | undefined;

export const hasCategory = () => item.TypeFilters.filters.category.value;

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

export const getPrice = async () => {
  const overviewsPrice = await OverviewsPrice(item);
  if (overviewsPrice.length > 0) {
    setPrices(() => overviewsPrice);
    setOvPrice(true);
    return;
  }

  if (timeout()) return;

  const id = ++requestId;
  setPrices([]);

  try {
    const q = JSON.stringify(createQuery(item)());
    info(`query: ${q}`);

    const p = await PriceCheck(q);

    if (id !== requestId) return;
    if (p.timeout) return startCountdown(p.timeout);

    setPrices(p.prices);
    setOvPrice(false);
  } catch (e) {
    if (id === requestId) setPrices([]);
    error("getting price: " + e);
  }
};

export const scanItem = async () => {
  try {
    const itemCopy: string = await invoke("os_copy");
    info(`copied item: \n${itemCopy}`);

    const itemStruct = parseItem(itemCopy);
    info(`parsed item: \n${JSON.stringify(itemStruct)}`);

    setItem(() => applyDps(itemStruct));
    disablePassthrough();

    getPrice();
    setCloseOverlay(true);
  } catch (e) {
    error(`failed to scan item: ${e}`);
  }
};

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

export const sameBaseOverviews = () =>
  Object.values(overviews).filter(
    (i) => i.base === item.name?.value.replace("Exceptional ", ""),
  );

export const selectItemBase = (item: overviewPrice) => {
  setItem((s) => {
    s.type ??= {
      value: s.name!.value.replace("Exceptional ", ""),
      disabled: false,
    };
    s.type = {
      value: s.name!.value.replace("Exceptional ", ""),
      disabled: false,
    };
    s.name ??= { value: item.name, disabled: false };
    s.name = { value: item.name, disabled: false };
  });
  getPrice();
};
