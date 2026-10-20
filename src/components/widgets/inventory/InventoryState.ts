import { store } from "@/lib/Store";
import { info } from "@tauri-apps/plugin-log";
import { createStore, reconcile } from "solid-js/store";

export const [inventory, setInventory] = createStore<Record<string, number>>();

export const addToInventory = async (item: {
  name: string;
  quantity: number;
}) => {
  setInventory(item.name, item.quantity);
};

export const removeItem = (name: string) => {
  setInventory(name, undefined!);
};

export const clearInventory = async () => {
  await store.delete("inventory");
  setInventory(reconcile({}));
};

export const loadInventory = async () => {
  const inv = await store.get<Record<string, number>>("inventory");
  if (inv) setInventory(inv);
};

export const saveInventory = async () => {
  await store.set("inventory", inventory);
  await store.save();
  info("inventory saved");
};
