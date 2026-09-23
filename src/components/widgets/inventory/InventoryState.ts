import { store } from "@/lib/Store";
import { createStore } from "solid-js/store";

const [inventory, setInventory] = createStore<Record<string, number>>();

const addToInventory = async (item: { name: string; quantity: number }) => {
  setInventory(item.name, item.quantity);
  saveInventory();
};

const loadInventory = async () => {
  const inv = await store.get<Record<string, number>>("inventory");
  if (inv) setInventory(inv);
};

const saveInventory = async () => {
  await store.set("inventory", inventory);
  await store.save();
};

export { inventory, addToInventory, loadInventory, saveInventory };
