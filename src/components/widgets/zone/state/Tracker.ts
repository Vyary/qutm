import { createStore, produce, reconcile } from "solid-js/store";
import { store } from "@/lib/Store";

interface Tracker {
  zone: string;
  zoneLevel: number;
  prevZone: string;
  history: string[];
  flags: Record<string, Record<string, boolean>>;
}

const [tracker, setTracker] = createStore<Tracker>({
  zone: "",
  zoneLevel: 0,
  prevZone: "",
  history: [],
  flags: {},
});

const saveTracker = async () => {
  await store.set("tracker", tracker);
  await store.save();
};

const loadTracker = async () => {
  const t = await store.get<Tracker>("tracker");
  if (t) setTracker(reconcile(t));
};

const setZone = (zone: string) => {
  setTracker(
    produce((s) => {
      s.prevZone = s.zone;
      s.zone = zone;
      s.history = [zone, ...s.history];
    }),
  );
};

const setZoneLevel = (level: number) => {
  setTracker("zoneLevel", level);
};

const setFlag = (quote: string) => {
  if (!tracker.flags[tracker.zone]) {
    setTracker("flags", tracker.zone, {});
  }
  setTracker("flags", tracker.zone, quote, true);
};

export { tracker, setZone, setZoneLevel, setFlag, saveTracker, loadTracker };
