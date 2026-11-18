import { store } from "@/lib/Store";
import { listen } from "@tauri-apps/api/event";
import { error } from "@tauri-apps/plugin-log";
import { createStore } from "solid-js";

interface AreaEntered {
  level: number;
  name: string;
}

interface Tracker {
  zone: string;
  zoneLevel: number;
  prevZone: string;
  history: string[];
  flags: Record<string, Record<string, boolean>>;
}

export const [tracker, setTracker] = createStore<Tracker>({
  zone: "",
  zoneLevel: 0,
  prevZone: "",
  history: [],
  flags: {},
});

let listening: Promise<() => void> | undefined;

export const initTracker = () => {
  loadTracker();

  listening ??= listen<AreaEntered>("area-entered", (e) => {
    setTracker((s) => {
      s.prevZone = s.zone;
      s.zone = e.payload.name;
      s.zoneLevel = e.payload.level;
      s.history.unshift(e.payload.name);
    });
  }).catch((e) => {
    error(String(e));
    listening = undefined;
    return () => {};
  });
};

export const stopTracker = () => {
  const p = listening;
  listening = undefined;
  p?.then((unlisten) => unlisten());
  saveTracker();
};

const saveTracker = async () => {
  await store.set("tracker", tracker);
  await store.save();
};

const loadTracker = async () => {
  const s = await store.get<Tracker>("tracker");
  if (s) setTracker(() => s);
};

export const setFlag = (quote: string) => {
  setTracker((s) => {
    s.flags[tracker.zone] ??= {};
    s.flags[tracker.zone][quote] = true;
  });
};
