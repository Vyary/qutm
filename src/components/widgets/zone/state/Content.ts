import { createMemo } from "solid-js";
import { guide, Guide } from "./Guide";
import { tracker } from "./Tracker";

const content = createMemo<Guide>(
  (prev) => {
    const found = guide[tracker.zone]?.find((z) => {
      const prevOk = z.prev ? z.prev == tracker.prevZone : true;
      const preqOk = z.preq
        ? z.preq.every((zone) => tracker.history.includes(zone))
        : true;
      return prevOk && preqOk;
    });

    if (!found) return prev;

    const pendingTasks = found.tasks.filter((task) => {
      const conditionMet = task.condition
        ? !!tracker.flags?.[tracker.zone]?.[task.condition]
        : false;
      const preqMet = task.condition
        ?.split(", ")
        .every((zone) => tracker.history.includes(zone));

      if (task.hide) {
        return !conditionMet && !preqMet;
      }

      if (task.show) {
        return conditionMet || preqMet;
      }

      return true;
    });

    return {
      ...found,
      tasks: pendingTasks,
    };
  },
  {
    prev: "",
    preq: [],
    tasks: [],
  },
);

export { content };
