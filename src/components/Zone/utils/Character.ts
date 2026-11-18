import { store } from "@/lib/Store";
import { listen } from "@tauri-apps/api/event";
import { error } from "@tauri-apps/plugin-log";
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

export const initCharacter = () => {
  loadCharacter();

  listening ??= listen<Character>("character-level-up", (e) => {
    setCharacter((s) => {
      s.name = e.payload.name;
      s.class = e.payload.class;
      s.level = e.payload.level;
    });
  }).catch((e) => {
    error(String(e));
    listening = undefined;
    return () => {};
  });
};

export const stopCharacter = () => {
  const p = listening;
  listening = undefined;
  p?.then((unlisten) => unlisten());
  saveCharacter();
};

const saveCharacter = async () => {
  await store.set("character", character);
  await store.save();
};

const loadCharacter = async () => {
  const s = await store.get<Character>("character");
  if (s) setCharacter(() => s);
};
