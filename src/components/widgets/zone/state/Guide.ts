import { open } from "@tauri-apps/plugin-dialog";
import { save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { createStore, produce, reconcile } from "solid-js/store";
import { store } from "@/lib/Store";
import { error, info } from "@tauri-apps/plugin-log";
import guideQuotesjson from "@/assets/guide.json";

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

const [guide, setGuide] = createStore<Record<string, Guide[]>>();

const [quotes, setQuotes] =
  createStore<Record<string, Record<string, boolean>>>();

const saveGuide = async () => {
  await store.set("guide", guide);
  await store.set("quotes", quotes);
  await store.save();
};

const loadGuide = async () => {
  const g = await store.get<Record<string, Guide[]>>("guide");
  const q = await store.get<Record<string, Record<string, boolean>>>("quotes");

  if (g) setGuide(reconcile(g));
  if (q) setQuotes(reconcile(q));

  if (!g) {
    setGuide(reconcile(guideQuotesjson["guide"]));
    setQuotes(reconcile(guideQuotesjson["quotes"]));
    saveGuide();
  }
};

const addTown = (town: string) => {
  if (!guide[town]) {
    setGuide(town, [
      {
        tasks: [{ text: "" }],
      },
    ]);
  }
};

const addGroup = (zone: string) => {
  setGuide(
    produce((s) => {
      s[zone].push({
        tasks: [],
      });
    }),
  );
};

const moveGroupUp = (zone: string, groupIndex: number) => {
  setGuide(
    produce((s) => {
      const groups = s[zone];

      if (groupIndex > 0) {
        [groups[groupIndex - 1], groups[groupIndex]] = [
          groups[groupIndex],
          groups[groupIndex - 1],
        ];
      }
    }),
  );

  saveGuide();
};

const moveGroupDown = (zone: string, groupIndex: number) => {
  setGuide(
    produce((s) => {
      const groups = s[zone];

      if (groupIndex < groups.length - 1) {
        [groups[groupIndex + 1], groups[groupIndex]] = [
          groups[groupIndex],
          groups[groupIndex + 1],
        ];
      }
    }),
  );

  saveGuide();
};

const deleteZone = (zone: string, index: number) => {
  setGuide(
    produce((s) => {
      s[zone].splice(index, 1);
    }),
  );

  saveGuide();
};

const addTask = (zone: string, zoneIndex: number) => {
  setGuide(
    produce((s) => {
      s[zone][zoneIndex].tasks.push({ text: "" });
    }),
  );

  saveGuide();
};

const removeTask = (zone: string, zoneIndex: number, taskIndex: number) => {
  setGuide(
    produce((s) => {
      s[zone][zoneIndex].tasks.splice(taskIndex, 1);
    }),
  );

  saveGuide();
};

const changeTask = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
  text: string,
) => {
  setGuide(
    produce((s) => {
      s[zone][zoneIndex].tasks[taskIndex].text = text;
    }),
  );

  saveGuide();
};

const changeReward = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
  text: string,
) => {
  setGuide(
    produce((s) => {
      s[zone][zoneIndex].tasks[taskIndex].reward = text;
    }),
  );

  saveGuide();
};

const moveTaskUp = (zone: string, zoneIndex: number, taskIndex: number) => {
  setGuide(
    produce((s) => {
      const tasks = s[zone][zoneIndex].tasks;

      if (taskIndex > 0) {
        [tasks[taskIndex - 1], tasks[taskIndex]] = [
          tasks[taskIndex],
          tasks[taskIndex - 1],
        ];
      }
    }),
  );

  saveGuide();
};

const moveTaskDown = (zone: string, zoneIndex: number, taskIndex: number) => {
  setGuide(
    produce((s) => {
      const tasks = s[zone][zoneIndex].tasks;

      if (taskIndex < tasks.length - 1) {
        [tasks[taskIndex + 1], tasks[taskIndex]] = [
          tasks[taskIndex],
          tasks[taskIndex + 1],
        ];
      }
    }),
  );

  saveGuide();
};

const changeAction = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
  action: string,
) => {
  setGuide(
    produce((s) => {
      if (action == "Show") {
        s[zone][zoneIndex].tasks[taskIndex].show = true;
        s[zone][zoneIndex].tasks[taskIndex].hide = false;
      }

      if (action == "Hide") {
        s[zone][zoneIndex].tasks[taskIndex].show = false;
        s[zone][zoneIndex].tasks[taskIndex].hide = true;
      }
    }),
  );

  saveGuide();
};

const changeDoneQuote = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
  text: string,
) => {
  setGuide(
    produce((s) => {
      s[zone][zoneIndex].tasks[taskIndex].condition = text;
    }),
  );
  if (!quotes?.[zone]?.[text]) {
    setQuotes(zone, {});
    setQuotes(zone, text, true);
  }

  saveGuide();
};

const changePrev = (zone: string, zoneIndex: number, text: string) => {
  setGuide(
    produce((s) => {
      s[zone][zoneIndex].prev = text;
    }),
  );

  saveGuide();
};

const changePreq = (zone: string, zoneIndex: number, text: string) => {
  setGuide(
    produce((s) => {
      s[zone][zoneIndex].preq = text === "" ? [] : text.split(", ");
    }),
  );

  saveGuide();
};

const exportGuide = async () => {
  try {
    const filePath = await save({
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
      defaultPath: "guide.json",
    });

    if (!filePath) {
      info("export cancelled");
      return;
    }

    await writeTextFile(
      filePath,
      JSON.stringify({ guide: guide, quotes: quotes }),
    );
  } catch (e) {
    error("exporting guide: " + e);
  }
};

const importGuide = async () => {
  try {
    const filePath = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
    });

    if (!filePath) {
      info("import cancelled");
      return;
    }

    const rawFile = await readTextFile(filePath);
    const file = JSON.parse(rawFile);

    setGuide(reconcile(file["guide"]));
    setQuotes(reconcile(file["quotes"]));

    saveGuide();
  } catch (e) {
    error("importing guide: " + e);
  }
};

export {
  quotes,
  guide,
  addTown,
  deleteZone,
  addGroup,
  moveGroupUp,
  moveGroupDown,
  addTask,
  removeTask,
  changeTask,
  changeReward,
  moveTaskUp,
  moveTaskDown,
  changeAction,
  changeDoneQuote,
  changePrev,
  changePreq,
  saveGuide,
  loadGuide,
  exportGuide,
  importGuide,
};
