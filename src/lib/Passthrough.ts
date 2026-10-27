import { getCurrentWindow } from "@tauri-apps/api/window";
import { createSignal } from "solid-js";

const [passthrough, setPassthrough] = createSignal(false);

const enablePassthrough = async () => {
  setPassthrough(true);
  await getCurrentWindow().setIgnoreCursorEvents(true);
};

const disablePassthrough = async () => {
  setPassthrough(false);
  await getCurrentWindow().setIgnoreCursorEvents(false);
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
