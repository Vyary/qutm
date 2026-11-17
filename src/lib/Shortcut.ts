import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { createStore, onSettled } from "solid-js";
import { showOverlay } from "./ShowOverlay";
import { error } from "@tauri-apps/plugin-log";
import { store } from "./Store";

export const [shortcuts, setShortcuts] = createStore<Record<string, string>>(
  {},
);
export const [errors, setErrors] = createStore<Record<string, boolean>>({});
const handlers = new Map<string, { action: () => void; global: boolean }>();
const users = new Map<string, number>();

const registerShortcut = async (
  name: string,
  shortcut: string,
  global: boolean,
  action: () => void,
) => {
  try {
    await register(shortcut, (e) => {
      if (e.state !== "Released") return;
      if (!action) return;
      if (global || showOverlay()) action();
    });

    setShortcuts((s) => {
      s[name] = shortcut;
    });
    handlers.set(name, { action: action, global: global });

    await store.set(name, shortcut);
    await store.save();

    setErrors((s) => {
      s[name] = false;
    });
  } catch (e) {
    setErrors((s) => {
      s[name] = true;
    });
    error(`failed to register ${name}: ${e}`);

    await registerShortcut(name, shortcuts[name], global, action);
  }
};

const unregisterShortcut = async (shortcut: string) => {
  try {
    await unregister(shortcut);
  } catch (e) {
    error(`failed to unregister ${JSON.stringify(shortcut)}: ${e}`);
  }
};

export const updateShortcut = async (name: string, shortcut: string) => {
  const previous = shortcuts[name];
  await unregisterShortcut(previous);

  const h = handlers.get(name);
  if (!h) {
    error(`failed to find action for ${name}`);
    return;
  }

  await registerShortcut(name, shortcut, h.global, h.action);
};

export const createShortcut = (
  name: string,
  shortcut: string,
  global: boolean,
  action: () => void,
) => {
  onSettled(() => {
    const count = users.get(name) ?? 0;
    users.set(name, count + 1);
    if (count > 0) return;

    (async () => {
      const saved = await store.get<string>(name);
      await registerShortcut(name, saved ?? shortcut, global, action);
    })();

    return () => {
      const count = users.get(name) ?? 0;
      users.set(name, count - 1);
      if (count > 1) return;

      (async () => {
        const s = shortcuts[name];
        await unregisterShortcut(s);
        handlers.delete(name);
        users.delete(name);
      })();
    };
  });
};
