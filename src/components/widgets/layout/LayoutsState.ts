import { createStore, produce, reconcile } from "solid-js/store";
import { open } from "@tauri-apps/plugin-dialog";
import { save } from "@tauri-apps/plugin-dialog";
import { error, info } from "@tauri-apps/plugin-log";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import layoutsjson from "@/assets/layouts.json";
import { store } from "@/lib/Store";
import { createSignal } from "solid-js";

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
const [layoutZone, setLayoutZone] = createSignal("");

const addLayout = () => {
  if (!layouts[layoutZone()]) {
    setLayouts(layoutZone(), [
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
        (s[layoutZone()] = [
          ...s[layoutZone()],
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
        (s[layoutZone()] = [
          ...s[layoutZone()],
          JSON.parse(JSON.stringify(s[layoutZone()][layoutIndex])),
        ]),
    ),
  );
};

const changeLayoutName = (layoutIndex: number, name: string) => {
  setLayouts(
    produce((s) => {
      s[layoutZone()][layoutIndex].name = name;
    }),
  );
};

const changeDefaultLayout = (layoutIndex: number) => {
  setLayouts(
    produce((s) => {
      [s[layoutZone()][layoutIndex], s[layoutZone()][0]] = [
        s[layoutZone()][0],
        s[layoutZone()][layoutIndex],
      ];
    }),
  );
};

const addIcon = (layoutIndex: number, iconType: string, iconLabel: string) => {
  if (iconType === "") return;

  setLayouts(
    produce(
      (s) =>
        (s[layoutZone()][layoutIndex]["icons"] = [
          ...s[layoutZone()][layoutIndex]["icons"],
          { id: iconType, label: iconLabel, x: 0.5, y: 0.5 },
        ]),
    ),
  );
};

const removeIcon = (layoutIndex: number, iconIndex: number) => {
  setLayouts(
    produce((s) => s[layoutZone()][layoutIndex]["icons"].splice(iconIndex, 1)),
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

  setLayouts(layoutZone(), layoutIndex, "icons", iconIndex, "x", xPercent);
  setLayouts(layoutZone(), layoutIndex, "icons", iconIndex, "y", yPercent);
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
        (s[layoutZone()][layoutIndex]["lines"] = [
          ...s[layoutZone()][layoutIndex]["lines"],
          { fromIconId: start, toIconId: end },
        ]),
    ),
  );
};

const deleteLines = (layoutIndex: number) => {
  setLayouts(
    produce((s) => {
      s[layoutZone()][layoutIndex]["lines"] = [];
    }),
  );
};

const deleteLayout = (index: number) => {
  setLayouts(
    produce((s) => {
      const filtered = s[layoutZone()].filter((_, i) => i !== index);
      if (filtered.length > 0) {
        s[layoutZone()] = filtered;
      }

      if (filtered.length === 0) {
        s[layoutZone()] = [
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
  await store.set("layoutsZone", layoutZone());
  await store.save();
};

const loadLayouts = async () => {
  const l = await store.get<Record<string, ZoneLayout[]>>("layouts");
  if (l) setLayouts(reconcile(l));
  if (!l) {
    setLayouts(reconcile(layoutsjson));
    saveLayouts();
  }

  const lz = await store.get<string>("layoutsZone");
  if (lz) setLayoutZone(lz);
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
  layoutZone,
  setLayoutZone,
};
