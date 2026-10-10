import { store } from "@/lib/Store";
import { info } from "@tauri-apps/plugin-log";
import { createStore, reconcile } from "solid-js/store";

const [inventory, setInventory] = createStore<Record<string, number>>();

const addToInventory = async (item: { name: string; quantity: number }) => {
  setInventory(item.name, item.quantity);
};

const removeItem = (name: string) => {
  setInventory(name, undefined!);
};

const clearInventory = async () => {
  await store.delete("inventory");
  setInventory(reconcile({}));
};

const loadInventory = async () => {
  const inv = await store.get<Record<string, number>>("inventory");
  if (inv) setInventory(inv);
};

const saveInventory = async () => {
  await store.set("inventory", inventory);
  await store.save();
  info("inventory saved");
};

export {
  inventory,
  addToInventory,
  removeItem,
  clearInventory,
  loadInventory,
  saveInventory,
};
