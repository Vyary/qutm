import { createStore } from "solid-js";
import guideJson from "@/assets/guide2.json";
import { store } from "@/lib/Store";
import { info } from "@tauri-apps/plugin-log";

export interface Guide {
  prev?: string;
  preq?: string[];
  tasks: {
    text: string;
    reward?: string;
    show?: boolean;
    hide?: boolean;
    condition?: string;
  }[];
}

type Zone = string;
type GuideStore = Record<
  Zone,
  { guide: Guide[]; quotes: Record<string, boolean> }
>;

export const [guide, setGuide] = createStore<GuideStore>({});

const saveGuide = async (g: GuideStore) => {
  await store.set("guide", g);
  await store.save();
  info("guide saved");
};

export const loadGuide = async () => {
  const guide = await store.get<GuideStore>("guide");

  if (guide) {
    setGuide(() => guide);
    return;
  }

  setGuide(() => guideJson);
  saveGuide(guideJson);
};
