import townsJson from "@/assets/towns.json";
import { store } from "@/lib/Store";
import { createStore } from "solid-js";

type Towns = Record<string, string>;
export const [towns, setTowns] = createStore<Towns>({});

const saveTowns = async (t: Towns) => {
  await store.set("towns", t);
  await store.save();
};

export const loadTowns = async () => {
  const towns = await store.get<Towns>("towns");
  if (towns) {
    setTowns(() => towns);
    return;
  }

  setTowns(() => townsJson);
  saveTowns(townsJson);
};
