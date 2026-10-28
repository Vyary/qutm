import { showLayout } from "@/components/widgets/layout/LayoutSettings";
import { showZone } from "@/components/widgets/zone/ZoneSettings";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createSignal } from "solid-js";

const [passthrough, setPassthrough] = createSignal(false);

const enablePassthrough = async () => {
  setPassthrough(true);
  if (!showZone() && !showLayout()) await getCurrentWindow().hide();
  await getCurrentWindow().setIgnoreCursorEvents(true);
};

const disablePassthrough = async () => {
  setPassthrough(false);
  if (!showZone() && !showLayout()) await getCurrentWindow().show();
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
