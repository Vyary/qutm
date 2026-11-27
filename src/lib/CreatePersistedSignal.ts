import { createSignal } from "solid-js";
import { store } from "./Store";
import {
  hydrateDev,
  hydrateLeague,
  hydrateRTL,
  hydrateTextSlider,
} from "@/components/Settings/Settings";
import { hydrateZone } from "@/components/Zone/Zone";
import { hydrateLayout } from "@/components/Layout/Layout";
import { hydratePrice } from "@/components/Price/Price";
import { hydrateInventory } from "@/components/Inventory/Inventory";
import { hydrateUpdate } from "@/components/Updater";

export function createPersistedSignal<T>(key: string, initial: T, def: T) {
  const [value, setValue] = createSignal<T>(initial as Exclude<T, Function>);

  const hydrate = async () => {
    const saved = await store.get<T>(key);
    setValue(() => saved ?? def);
  };

  const set = async (next: T) => {
    setValue(() => next);
    await store.set(key, next);
    await store.save();
  };

  return [value, set, hydrate] as const;
}

export const HydratePersistedSignals = async () => {
  await Promise.all([
    hydrateRTL(),
    hydrateTextSlider(),
    hydrateDev(),
    hydrateLeague(),
    hydrateUpdate(),
    hydrateZone(),
    hydrateLayout(),
    hydratePrice(),
    hydrateInventory(),
  ]);
};
