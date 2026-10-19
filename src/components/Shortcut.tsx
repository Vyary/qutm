import { showOverlay } from "@/lib/File";
import { store } from "@/lib/Store";
import { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { error, info } from "@tauri-apps/plugin-log";
import { onCleanup, onMount } from "solid-js";
import { createStore, unwrap } from "solid-js/store";

type Keys = { Ctrl: boolean; Shift: boolean; Alt: boolean; Key: string };

const [shortcuts, setShortcuts] = createStore<Record<string, Keys>>({});
const [errors, setErrors] = createStore<Record<string, boolean>>({});

const users = new Map<string, number>();
const unlisteners = new Map<string, UnlistenFn>();
const handlers = new Map<
  string,
  { action: () => Promise<void>; global: () => boolean }
>();

const shortcutString = (name: string) => {
  const k = shortcuts[name];
  const parts: string[] = [];

  if (k.Ctrl) parts.push("CommandOrControl");
  if (k.Shift) parts.push("Shift");
  if (k.Alt) parts.push("Alt");
  if (k.Key) parts.push(k.Key);

  return parts.join("+");
};

const registerShortcut = async (name: string) => {
  try {
    await register(shortcutString(name), async (e) => {
      if (e.state !== "Released") return;

      const h = handlers.get(name);
      if (!h) return;

      if (h.global() || showOverlay()) await h.action();
    });
    setErrors(name, false);
  } catch (e) {
    setErrors(name, true);
    error(`failed to register ${name}: ${e}`);
  }
};

const unregisterShortcut = async (name: string) => {
  try {
    await unregister(shortcutString(name));
  } catch (e) {
    error(`Failed to unregister ${name}: ${e}`);
  }
};

const updateShortcut = async (name: string, patch: Partial<Keys>) => {
  await unregisterShortcut(name);

  setShortcuts(name, patch);

  await registerShortcut(name);

  await store.set(name, { ...unwrap(shortcuts[name]) });
  await store.save();
};

function Shortcut(props: {
  name: string;
  action: () => Promise<void>;
  defaultKey: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  global?: boolean;
}) {
  if (!shortcuts[props.name]) {
    setShortcuts(props.name, {
      Ctrl: props.ctrl ?? false,
      Shift: props.shift ?? false,
      Alt: props.alt ?? false,
      Key: props.defaultKey,
    });
  }

  handlers.set(props.name, {
    action: () => props.action(),
    global: () => props.global ?? false,
  });

  onMount(async () => {
    const count = users.get(props.name) ?? 0;
    users.set(props.name, count + 1);
    if (count > 0) return;

    const saved = await store.get<Keys>(props.name);
    if (saved) setShortcuts(props.name, saved);

    await registerShortcut(props.name);

    unlisteners.set(
      props.name,
      await getCurrentWindow().onCloseRequested(async () => {
        await unregisterShortcut(props.name);
      }),
    );
  });

  onCleanup(async () => {
    const count = (users.get(props.name) ?? 1) - 1;
    users.set(props.name, count);
    if (count > 0) return;

    await unregisterShortcut(props.name);

    const unlisten = unlisteners.get(props.name);
    if (unlisten) unlisten();
    else info(`shortcut ${props.name}: close listener was not set`);
    unlisteners.delete(props.name);
    handlers.delete(props.name);
  });

  const keys = () => shortcuts[props.name];

  return (
    <div class="flex flex-col gap-1">
      <span class="text-xs font-medium tracking-wide opacity-60">
        {props.name}
      </span>
      <div class="join w-full">
        <input
          class="btn btn-soft btn-sm join-item flex-1"
          type="checkbox"
          aria-label="Ctrl"
          checked={keys().Ctrl}
          onChange={(e) =>
            updateShortcut(props.name, { Ctrl: e.currentTarget.checked })
          }
        />
        <input
          class="btn btn-soft btn-sm join-item flex-1"
          type="checkbox"
          aria-label="Shift"
          checked={keys().Shift}
          onChange={(e) =>
            updateShortcut(props.name, { Shift: e.currentTarget.checked })
          }
        />
        <input
          class="btn btn-soft btn-sm join-item flex-1"
          type="checkbox"
          aria-label="Alt"
          checked={keys().Alt}
          onChange={(e) =>
            updateShortcut(props.name, { Alt: e.currentTarget.checked })
          }
        />
        <input
          type="text"
          placeholder="Key"
          class="input input-sm join-item w-16 text-center font-mono uppercase"
          classList={{ "input-error": errors[props.name] }}
          value={keys().Key.toUpperCase()}
          onInput={(e) => {
            const v = e.currentTarget.value.trim();
            if (v === "") {
              setErrors(props.name, true);
              return;
            }
            updateShortcut(props.name, { Key: v.toUpperCase() });
          }}
        />
      </div>
    </div>
  );
}

export { Shortcut };
