import { load } from "@tauri-apps/plugin-store";

export const store = await load("store.json", { autoSave: false });
