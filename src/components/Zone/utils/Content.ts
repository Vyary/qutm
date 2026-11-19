import { createMemo, createRoot } from "solid-js";
import { setFlag, tracker } from "./Tracker";
import { Guide, guide } from "./Guide";
import { listen } from "@tauri-apps/api/event";
import { error } from "@tauri-apps/plugin-log";
import { character } from "./Character";

const EMPTY: Guide = { prev: "", preq: [], tasks: [] };

export const content = createRoot(() =>
  createMemo<Guide>((prev) => {
    const found = guide[tracker.zone]?.guide?.find((z) => {
      const prevOk = z.prev ? z.prev === tracker.prevZone : true;
      const preqOk = z.preq
        ? z.preq.every((zone) => tracker.history.includes(zone))
        : true;
      return prevOk && preqOk;
    });

    if (!found) return prev ?? EMPTY;

    const tasks = found.tasks.filter((task) => {
      const conditionMet = task.condition
        ? !!tracker.flags?.[tracker.zone]?.[task.condition]
        : false;
      const preqMet = task.condition
        ? task.condition.split(", ").every((z) => tracker.history.includes(z))
        : false;

      if (task.hide) return !conditionMet && !preqMet;
      if (task.show) return conditionMet || preqMet;
      return true;
    });

    return { ...found, tasks };
  }),
);

let listening: Promise<() => void> | undefined;

export const initQuoteTracker = () => {
  listening ??= listen<string>("log-quote", (e) => {
    const zoneQuotes = guide[tracker.zone]?.quotes;
    if (zoneQuotes) {
      let quote = e.payload;

      if (character.name && quote.includes(character.name)) {
        quote = quote.replace(character.name, "Character");
      }

      if (zoneQuotes[quote]) {
        setFlag(quote);
      }
    }
  }).catch((e) => {
    error(String(e));
    listening = undefined;
    return () => {};
  });
};

export const stopQuoteTracker = () => {
  const p = listening;
  listening = undefined;
  p?.then((unlisten) => unlisten());
};
