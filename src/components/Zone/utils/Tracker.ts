import { store } from "@/lib/Store";
import { listen } from "@tauri-apps/api/event";
import { error, info } from "@tauri-apps/plugin-log";
import { createStore } from "solid-js";

interface AreaEntered {
  level: number;
  code: string;
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
      s.zone = e.payload.code;
      s.zoneLevel = e.payload.level;
      s.history.unshift(e.payload.code);
    });
  }).catch((e) => {
    error(String(e));
    listening = undefined;
    return () => {};
  });
};

export const stopTracker = async () => {
  const p = listening;
  listening = undefined;
  p?.then((unlisten) => unlisten());
  await saveTracker();
};

const saveTracker = async () => {
  await store.set("tracker", tracker);
  await store.save();
  info("tracker saved");
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

export const changeZone = (zone: string) => {
  setTracker((s) => {
    s.prevZone = s.zone;
    s.zone = zone;
    s.history.unshift(zone);
  });
};

export const removeLastZone = () => {
  setTracker((s) => {
    s.history.shift();
    s.zone = s.history[0] ?? "";
    s.prevZone = s.history[1] ?? "";
  });
};
