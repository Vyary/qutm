import { load } from "@tauri-apps/plugin-store";

const store = await load("store.json", { autoSave: false });

export { store };
