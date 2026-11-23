import { createStore, flush } from "solid-js";
import guideJson from "@/assets/guide.json";
import { store } from "@/lib/Store";
import { error, info } from "@tauri-apps/plugin-log";
import { Zone } from "../Zone";
import { save, open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

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

export const saveGuide = async () => {
  flush();
  await store.set("guide", guide);
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
  saveGuide();
};

export const addGroup = (zone: string) => {
  setGuide((s) => {
    s[zone].guide.push({ tasks: [] });
  });
};

export const deleteGroup = (zone: string, groupIndex: number) => {
  setGuide((s) => {
    s[zone].guide.splice(groupIndex, 1);
  });
};

export const moveGroupUp = (zone: string, groupIndex: number) => {
  if (groupIndex <= 0) return;

  setGuide((s) => {
    [s[zone].guide[groupIndex - 1], s[zone].guide[groupIndex]] = [
      s[zone].guide[groupIndex],
      s[zone].guide[groupIndex - 1],
    ];
  });
};

export const moveGroupDown = (zone: string, groupIndex: number) => {
  if (groupIndex >= guide[zone].guide.length - 1) return;

  setGuide((s) => {
    [s[zone].guide[groupIndex + 1], s[zone].guide[groupIndex]] = [
      s[zone].guide[groupIndex],
      s[zone].guide[groupIndex + 1],
    ];
  });
};

export const addTask = (zone: string, zoneIndex: number) => {
  setGuide((s) => {
    s[zone].guide[zoneIndex].tasks.push({ text: "" });
  });
};

export const removeTask = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
) => {
  setGuide((s) => {
    s[zone].guide[zoneIndex].tasks.splice(taskIndex, 1);
  });
};

export const moveTaskUp = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
) => {
  if (taskIndex <= 0) return;

  setGuide((s) => {
    [
      s[zone].guide[zoneIndex].tasks[taskIndex - 1],
      s[zone].guide[zoneIndex].tasks[taskIndex],
    ] = [
      s[zone].guide[zoneIndex].tasks[taskIndex],
      s[zone].guide[zoneIndex].tasks[taskIndex - 1],
    ];
  });
};

export const moveTaskDown = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
) => {
  if (taskIndex >= guide[zone].guide[zoneIndex].tasks.length - 1) return;

  setGuide((s) => {
    [
      s[zone].guide[zoneIndex].tasks[taskIndex + 1],
      s[zone].guide[zoneIndex].tasks[taskIndex],
    ] = [
      s[zone].guide[zoneIndex].tasks[taskIndex],
      s[zone].guide[zoneIndex].tasks[taskIndex + 1],
    ];
  });
};

export const changeTask = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
  text: string,
) => {
  setGuide((s) => {
    s[zone].guide[zoneIndex].tasks[taskIndex].text = text;
  });
};

export const changePrev = (zone: string, zoneIndex: number, text: string) => {
  setGuide((s) => {
    s[zone].guide[zoneIndex].prev = text;
  });
};

export const changePreq = (zone: string, zoneIndex: number, text: string) => {
  setGuide((s) => {
    s[zone].guide[zoneIndex].preq = text === "" ? [] : text.split(", ");
  });
};

export const changeReward = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
  text: string,
) => {
  setGuide((s) => {
    s[zone].guide[zoneIndex].tasks[taskIndex].reward = text;
  });
};

export const changeAction = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
  action: "Show" | "Hide",
) => {
  setGuide((s) => {
    if (action === "Show") {
      s[zone].guide[zoneIndex].tasks[taskIndex].show = true;
      delete s[zone].guide[zoneIndex].tasks[taskIndex].hide;
    }

    if (action === "Hide") {
      delete s[zone].guide[zoneIndex].tasks[taskIndex].show;
      s[zone].guide[zoneIndex].tasks[taskIndex].hide = true;
    }
  });
};

export const changeDoneQuote = (
  zone: string,
  zoneIndex: number,
  taskIndex: number,
  text: string,
) => {
  setGuide((s) => {
    s[zone].guide[zoneIndex].tasks[taskIndex].condition = text;
    s[zone].quotes[text] = true;
  });
};

export const exportGuide = async () => {
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

    await writeTextFile(filePath, JSON.stringify(guide));
  } catch (e) {
    error("exporting guide: " + e);
  }
};

export const importGuide = async () => {
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

    setGuide(() => file);
    saveGuide();
  } catch (e) {
    error("importing guide: " + e);
  }
};
