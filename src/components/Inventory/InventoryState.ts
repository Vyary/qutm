import { createStore } from "solid-js";

export const [inventory, setInventory] = createStore<Record<string, number>>(
  {},
);
