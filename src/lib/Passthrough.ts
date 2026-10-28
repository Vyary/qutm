import { getCurrentWindow } from "@tauri-apps/api/window";
import { info } from "@tauri-apps/plugin-log";
import { createSignal } from "solid-js";

const [passthrough, setPassthrough] = createSignal(false);

const enablePassthrough = () => {
  setPassthrough(true);
  getCurrentWindow().setIgnoreCursorEvents(true);
  info(`overlay enabled setIgnoreCursorEvents: ${passthrough()}`);
};

const disablePassthrough = async () => {
  setPassthrough(false);
  await getCurrentWindow().show();
  await getCurrentWindow().setFocus();
  await getCurrentWindow().setIgnoreCursorEvents(false);
  info(`overlay disabled setIgnoreCursorEvents: ${passthrough()}`);
};

const togglePassthrough = async () => {
  if (passthrough()) disablePassthrough();
  else enablePassthrough();
};

export {
  passthrough,
  setPassthrough,
  enablePassthrough,
  disablePassthrough,
  togglePassthrough,
};
