import { createStore, reconcile } from "solid-js/store";
import { store } from "@/lib/Store";
import { save } from "@tauri-apps/plugin-dialog";
import { error, info } from "@tauri-apps/plugin-log";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import townsjson from "@/assets/towns.json";

const [towns, setTowns] = createStore<Record<string, string>>();

const addTownName = (id: string, name: string) => {
  setTowns(id, name);
};

const saveTowns = async () => {
  await store.set("towns", towns);
  await store.save();
};

const loadTowns = async () => {
  const t = await store.get<Record<string, string>>("towns");
  if (t) setTowns(reconcile(t));
  if (!t) {
    setTowns(reconcile(townsjson));
    saveTowns();
  }
};

const exportTowns = async () => {
  try {
    const filePath = await save({
      filters: [
        {
          name: "JSON",
          extensions: ["json"],
        },
      ],
      defaultPath: "towns.json",
    });

    if (!filePath) {
      info("towns export cancelled");
      return;
    }

    await writeTextFile(filePath, JSON.stringify(towns));
  } catch (e) {
    error("exporting towns: " + e);
  }
};

export { towns, addTownName, saveTowns, loadTowns, exportTowns };
