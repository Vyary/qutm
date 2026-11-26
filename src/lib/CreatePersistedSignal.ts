import { createEffect, createSignal } from "solid-js";
import { store } from "./Store";

export function createPersistedSignal<T>(key: string, initial: T) {
  const [value, setValue] = createSignal<T>(initial as Exclude<T, Function>);

  const hydrate = async () => {
    const saved = await store.get<T>(key);
    if (saved !== undefined && saved !== null) setValue(() => saved);
  };

  createEffect(
    () => value(),
    (value) => {
      (async () => {
        await store.set(key, value);
        await store.save();
      })();
    },
  );

  return [value, setValue, hydrate] as const;
}
