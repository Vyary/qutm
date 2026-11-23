import { store } from "@/lib/Store";
import { listen } from "@tauri-apps/api/event";
import { error, info } from "@tauri-apps/plugin-log";
import { createStore } from "solid-js";

interface Character {
  name: string;
  class: string;
  level: number;
}

export const [character, setCharacter] = createStore<Character>({
  name: "",
  class: "",
  level: 0,
});

let listening: Promise<() => void> | undefined;

export const initCharacterTracker = () => {
  loadCharacter();

  listening ??= listen<Character>("character-level-up", (e) => {
    setCharacter((s) => {
      if (s.name === "") {
        s.name = e.payload.name;
        s.class = e.payload.class;
      }
      if (s.name === e.payload.name) {
        s.level = e.payload.level;
      }
    });
  }).catch((e) => {
    error(String(e));
    listening = undefined;
    return () => {};
  });
};

export const stopCharacterTracker = async () => {
  const p = listening;
  listening = undefined;
  p?.then((unlisten) => unlisten());
  await saveCharacter();
};

export const setCharacterName = (name: string) => {
  setCharacter((s) => {
    s.name = name;
  });
};

const saveCharacter = async () => {
  await store.set("character", character);
  await store.save();
  info("character saved");
};

const loadCharacter = async () => {
  const s = await store.get<Character>("character");
  if (s) setCharacter(() => s);
};
