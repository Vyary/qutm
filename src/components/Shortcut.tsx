import { store } from "@/lib/Store";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { error } from "@tauri-apps/plugin-log";
import { createSignal, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";

function Shortcut(props: {
  name: string;
  action: () => Promise<void>;
  defaultKey: string;
}) {
  const [keys, setKeys] = createStore({
    Ctrl: false,
    Shift: false,
    Alt: false,
    Key: props.defaultKey,
  });

  const [keysErr, setKeysErr] = createSignal(false);

  const shortcutString = () => {
    const parts = [];

    if (keys.Ctrl) parts.push("CommandOrControl");
    if (keys.Shift) parts.push("Shift");
    if (keys.Alt) parts.push("Alt");
    if (keys.Key) parts.push(keys.Key);

    return parts.join("+");
  };

  const registerShortcut = async () => {
    try {
      await register(shortcutString(), async (e) => {
        if (e.state === "Released") {
          await props.action();
        }
      });
    } catch (e) {
      setKeysErr(true);
      error(`failed to register ${props.name}: ${e}`);
    }
  };

  const updateShortcut = async (e: any, input: boolean = false) => {
    try {
      await unregister(shortcutString());
    } catch (e) {
      error(`Failed to unregister ${props.name}: ${e}`);
    }

    setKeys(e.target.value, e.target.checked);

    if (input) {
      setKeys(e.target.placeholder, e.target.value.toUpperCase());
    }

    registerShortcut();

    await store.set(props.name, keys);
    await store.save();
  };

  onMount(async () => {
    const k = await store.get(props.name);
    if (k) setKeys(k);
    registerShortcut();

    await getCurrentWindow().onCloseRequested(async (e) => {
      e.preventDefault();
      try {
        await unregister(shortcutString());
      } catch (e) {
        error(`Failed to unregister ${props.name}: ${e}`);
      }
    });
  });

  onCleanup(async () => {
    await unregister(shortcutString());
  });

  return (
    <div class="flex flex-col gap-1">
      <span class="text-xs font-medium tracking-wide opacity-60">
        {props.name}
      </span>
      <div class="join w-full">
        <input
          class="btn btn-soft btn-sm join-item flex-1"
          type="checkbox"
          name="modifier"
          aria-label="Ctrl"
          value="Ctrl"
          checked={keys.Ctrl}
          onChange={(e) => updateShortcut(e)}
        />
        <input
          class="btn btn-soft btn-sm join-item flex-1"
          type="checkbox"
          name="modifier"
          aria-label="Shift"
          value="Shift"
          checked={keys.Shift}
          onChange={(e) => updateShortcut(e)}
        />
        <input
          class="btn btn-soft btn-sm join-item flex-1"
          type="checkbox"
          name="modifier"
          aria-label="Alt"
          value="Alt"
          checked={keys.Alt}
          onChange={(e) => updateShortcut(e)}
        />
        <input
          type="text"
          placeholder="Key"
          class="input input-sm join-item w-16 text-center font-mono uppercase"
          classList={{ "input-error": keysErr() }}
          value={keys.Key.toUpperCase()}
          onInput={(e) => {
            if (e.target.value.trim() === "") {
              setKeysErr(true);
              return;
            }
            setKeysErr(false);
            updateShortcut(e, true);
          }}
        />
      </div>
    </div>
  );
}

export { Shortcut };
