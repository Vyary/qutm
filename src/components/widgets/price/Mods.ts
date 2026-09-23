import { error, info } from "@tauri-apps/plugin-log";
import { fetch } from "@tauri-apps/plugin-http";
import { createStore } from "solid-js/store";
import { store } from "@/lib/Store";

export interface ApiResponse {
  result: StatCategory[];
}

export interface StatCategory {
  id: string;
  label: string;
  entries: StatEntry[];
}

export interface StatEntry {
  id: string;
  text: string;
  type: string;
}

export type Mods = Record<string, Record<string, string>>;

export const [mods, setMods] = createStore<Mods>();

export const fetchMods = async () => {
  const headers = new Headers({
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64; rv:156.0) Gecko/20100101 Firefox/156.0",
    Accept: "application/json",
  });

  try {
    info("fetching mods");
    const response = await fetch(
      `https://www.pathofexile.com/api/trade2/data/stats`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      throw new Error("api responded with status: " + response.status);
    }

    const data: ApiResponse = await response.json();

    if (!data || !Array.isArray(data.result)) {
      throw new Error("Invalid API response format: 'result' array missing");
    }

    const result = data.result.reduce<Mods>((acc, category) => {
      acc[category.id] = Object.fromEntries(
        category.entries.map((entry) => [entry.text, entry.id]),
      );

      return acc;
    }, {});

    return result;
  } catch (e) {
    error("fetching mods: " + e);
  }
};

export const loadMods = async () => {
  const m = await store.get<Mods>("mods");
  if (m) setMods(m);
  if (!m) {
    setMods((await fetchMods()) || {});
    saveMods();
  }
};

export const saveMods = async () => {
  await store.set("mods", mods);
  await store.save();
};
