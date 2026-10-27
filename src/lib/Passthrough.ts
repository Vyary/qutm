import { getCurrentWindow } from "@tauri-apps/api/window";
import { createSignal } from "solid-js";

const [passthrough, setPassthrough] = createSignal(false);

const enablePassthrough = async () => {
  setPassthrough(true);
  await getCurrentWindow().setFocusable(false);
  await getCurrentWindow().setIgnoreCursorEvents(true);
};

const disablePassthrough = async () => {
  setPassthrough(false);
  await getCurrentWindow().setFocusable(true);
  await getCurrentWindow().setIgnoreCursorEvents(false);
};

const togglePassthrough = async () => {
  setPassthrough(!passthrough());
  await getCurrentWindow().setFocusable(passthrough());
  await getCurrentWindow().setIgnoreCursorEvents(passthrough());
};

export {
  passthrough,
  setPassthrough,
  enablePassthrough,
  disablePassthrough,
  togglePassthrough,
};
