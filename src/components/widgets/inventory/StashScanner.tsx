import { Region } from "@/components/widgets/inventory/SnipSelect";
import { store } from "@/lib/Store";
import { createSignal } from "solid-js";

const [stashArea, setStashArea] = createSignal<Region>({
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
});

const saveStashArea = async () => {
  await store.set("stashArea", stashArea());
  await store.save();
};

const loadStashArea = async () => {
  const a = await store.get<Region>("stashArea");
  if (a) setStashArea(a);
};

export { stashArea, setStashArea, saveStashArea, loadStashArea };
