import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { error, info } from "@tauri-apps/plugin-log";
import { createSignal } from "solid-js";
import { store } from "./Store";
import { disablePassthrough } from "./Passthrough";

export const [filePath, setFilePath] = createSignal("");
const [watching, setWatching] = createSignal(false);

const startTailing = async (path: string) => {
  setWatching(true);
  try {
    await invoke("tail_file", { filePath: path });
  } catch (e) {
    setWatching(false);
    error("invoking tail_file: " + e);
  }
};

export const selectFile = async () => {
  const selected =
    (await open({
      multiple: false,
      directory: false,
      defaultPath:
        "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile 2\\logs\\Client.txt",
      filters: [
        {
          name: "Log Files",
          extensions: ["txt"],
        },
      ],
    })) || "";

  if (!selected) {
    info("client file selecting cancelled");
    return;
  }

  if (!selected.endsWith("\\Client.txt") && !selected.endsWith("/Client.txt")) {
    error(`selected file is not Client.txt: ${selected}`);
    return;
  }

  setFilePath(selected);
  saveFilePath(selected);
  startTailing(selected);
};

const saveFilePath = async (filePath: string) => {
  await store.set("filePath", filePath);
  await store.save();
};

export const initFileWatch = async () => {
  const fp = await store.get<string>("filePath");
  if (fp) {
    setFilePath(fp);
    if (!watching()) startTailing(fp);
    return;
  }

  disablePassthrough();
  // show setup
};
