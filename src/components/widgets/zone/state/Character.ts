import { store } from "@/lib/Store";
import { createStore, reconcile } from "solid-js/store";

interface Character {
  name: string;
  level: number;
  class: string;
}

const [character, setCharacter] = createStore<Character>({
  name: "",
  level: 0,
  class: "",
});

const setCharacterName = (name: string) => {
  setCharacter("name", name);
};

const updateCharacterLevel = (level: number) => {
  setCharacter("level", level);
};

const updateCharacterClass = (c: string) => {
  setCharacter("class", c);
};

const saveCharacter = async () => {
  await store.set("char", character);
  await store.save();
};

const loadCharacter = async () => {
  const c = await store.get<Character>("char");
  if (c) setCharacter(reconcile(c));
};

export {
  character,
  setCharacterName,
  updateCharacterLevel,
  updateCharacterClass,
  saveCharacter,
  loadCharacter,
};
