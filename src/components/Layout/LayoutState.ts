import { store } from "@/lib/Store";
import { listen } from "@tauri-apps/api/event";
import { createSignal, createStore } from "solid-js";
import layoutsJson from "@/assets/layouts.json";
import { save, open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { error, info } from "@tauri-apps/plugin-log";

interface AreaEntered {
  level: number;
  code: string;
}

type LayoutIcon = {
  id: string;
  label?: string;
  x: number;
  y: number;
};

type LayoutLine = {
  fromIconId: number;
  toIconId: number;
};

type ZoneLayout = {
  name: string;
  image?: string;
  icons: LayoutIcon[];
  lines: LayoutLine[];
};

type Layouts = Record<string, ZoneLayout[]>;

export const [layouts, setLayouts] = createStore<Layouts>({});
export const [layoutZone, setLayoutZone] = createSignal("");

let listening: Promise<() => void> | undefined;

export const initLayoutTracker = () => {
  loadLayouts();

  listening ??= listen<AreaEntered>("area-entered", (e) => {
    setLayoutZone(() => e.payload.code);
  }).catch((e) => {
    error(String(e));
    listening = undefined;
    return () => {};
  });
};

export const stopLayoutTracker = async () => {
  const p = listening;
  listening = undefined;
  p?.then((unlisten) => unlisten());
  await saveLayouts();
};

export const changeLayout = (zone: string) => {
  setLayoutZone(() => zone);
};

const saveLayouts = async () => {
  await store.set("layouts", layouts);
  await store.set("layoutZone", layoutZone());
  await store.save();
  info("layouts saved");
};

export const loadLayouts = async () => {
  const [layouts, layoutZone] = await Promise.all([
    store.get<Layouts>("layouts"),
    store.get<string>("layoutZone"),
  ]);

  if (layoutZone) {
    setLayoutZone(() => layoutZone);
  }

  if (layouts) {
    setLayouts(() => layouts);
    return;
  }

  setLayouts(() => layoutsJson);
  saveLayouts();
};

export const exportLayouts = async () => {
  try {
    const filePath = await save({
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
      defaultPath: "layouts.json",
    });

    if (!filePath) {
      info("export cancelled");
      return;
    }

    await writeTextFile(filePath, JSON.stringify(layouts));
  } catch (e) {
    error("exporting layouts: " + e);
  }
};

export const importLayouts = async () => {
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

    setLayouts(() => file);
    saveLayouts();
  } catch (e) {
    error("importing layouts: " + e);
  }
};
