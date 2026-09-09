import { createStore, produce, reconcile } from "solid-js/store";
import { open } from "@tauri-apps/plugin-dialog";
import { save } from "@tauri-apps/plugin-dialog";
import { error, info } from "@tauri-apps/plugin-log";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { tracker } from "./Tracker";
import layoutsjson from "../assets/layouts.json";
import { store } from "./Store";

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

const [layouts, setLayouts] = createStore<Record<string, ZoneLayout[]>>();

const addLayout = (zone: string) => {
  if (!layouts[zone]) {
    setLayouts(zone, [
      {
        name: "1",
        image: "",
        icons: [],
        lines: [],
      },
    ]);
  }
};

const addEmptyLayout = () => {
  setLayouts(
    produce(
      (s) =>
        (s[tracker.zone] = [
          ...s[tracker.zone],
          {
            name: "1",
            image: "",
            icons: [],
            lines: [],
          },
        ]),
    ),
  );
};

const copyLayout = (layoutIndex: number) => {
  setLayouts(
    produce(
      (s) =>
        (s[tracker.zone] = [
          ...s[tracker.zone],
          JSON.parse(JSON.stringify(s[tracker.zone][layoutIndex])),
        ]),
    ),
  );
};

const changeLayoutName = (layoutIndex: number, name: string) => {
  setLayouts(
    produce((s) => {
      s[tracker.zone][layoutIndex].name = name;
    }),
  );
};

const changeDefaultLayout = (layoutIndex: number) => {
  setLayouts(
    produce((s) => {
      [s[tracker.zone][layoutIndex], s[tracker.zone][0]] = [
        s[tracker.zone][0],
        s[tracker.zone][layoutIndex],
      ];
    }),
  );
};

const addIcon = (layoutIndex: number, iconType: string, iconLabel: string) => {
  if (iconType === "") return;

  setLayouts(
    produce(
      (s) =>
        (s[tracker.zone][layoutIndex]["icons"] = [
          ...s[tracker.zone][layoutIndex]["icons"],
          { id: iconType, label: iconLabel, x: 0.5, y: 0.5 },
        ]),
    ),
  );
};

const removeIcon = (layoutIndex: number, iconIndex: number) => {
  setLayouts(
    produce((s) => s[tracker.zone][layoutIndex]["icons"].splice(iconIndex, 1)),
  );
};

const changeIconLocation = (
  layoutIndex: number,
  iconIndex: number,
  e: MouseEvent,
  rect: DOMRect,
) => {
  const xPercent = Math.max(
    0,
    Math.min(1, (e.clientX - rect.left) / rect.width),
  );
  const yPercent = Math.max(
    0,
    Math.min(1, (e.clientY - rect.top) / rect.height),
  );

  setLayouts(tracker.zone, layoutIndex, "icons", iconIndex, "x", xPercent);
  setLayouts(tracker.zone, layoutIndex, "icons", iconIndex, "y", yPercent);
};

const addLine = (
  layoutIndex: number,
  start: number | undefined,
  end: number,
) => {
  if (start === undefined) return;

  setLayouts(
    produce(
      (s) =>
        (s[tracker.zone][layoutIndex]["lines"] = [
          ...s[tracker.zone][layoutIndex]["lines"],
          { fromIconId: start, toIconId: end },
        ]),
    ),
  );
};

const deleteLines = (layoutIndex: number) => {
  setLayouts(
    produce((s) => {
      s[tracker.zone][layoutIndex]["lines"] = [];
    }),
  );
};

const deleteLayout = (index: number) => {
  setLayouts(
    produce((s) => {
      const filtered = s[tracker.zone].filter((_, i) => i !== index);
      if (filtered.length > 0) {
        s[tracker.zone] = filtered;
      }

      if (filtered.length === 0) {
        s[tracker.zone] = [
          {
            name: "1",
            image: "",
            icons: [],
            lines: [],
          },
        ];
      }
    }),
  );
};

const saveLayouts = async () => {
  await store.set("layouts", layouts);
  await store.save();
  localStorage.setItem("layouts", JSON.stringify(layouts));
};

const loadLayouts = async () => {
  const l = await store.get<Record<string, ZoneLayout[]>>("layouts");
  if (l) setLayouts(reconcile(l));
  if (!l) {
    setLayouts(reconcile(layoutsjson));
    saveLayouts();
  }
};

const exportLayouts = async () => {
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
      info("layouts export cancelled");
      return;
    }

    await writeTextFile(filePath, JSON.stringify(layouts));
  } catch (e) {
    error("exporting layouts: " + e);
  }
};

const importLayouts = async () => {
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
      info("layouts import cancelled");
      return;
    }

    const rawFile = await readTextFile(filePath);
    const file = JSON.parse(rawFile);

    setLayouts(reconcile(file));

    saveLayouts();
  } catch (e) {
    error("importing layouts: " + e);
  }
};

export {
  layouts,
  addLayout,
  addEmptyLayout,
  copyLayout,
  changeLayoutName,
  changeDefaultLayout,
  addIcon,
  removeIcon,
  changeIconLocation,
  addLine,
  deleteLines,
  deleteLayout,
  saveLayouts,
  loadLayouts,
  exportLayouts,
  importLayouts,
};
