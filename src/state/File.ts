import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { createSignal } from "solid-js";
import { setFlag, setZone, setZoneLevel, tracker } from "./Tracker";
import { addTown, quotes } from "./Guide";
import {
  character,
  updateCharacterClass,
  setCharacterName,
  updateCharacterLevel,
} from "./Character";
import { store } from "./Store";
import { error, info } from "@tauri-apps/plugin-log";
import { togglePassthrough } from "./Passthrough";

const [filePath, setFilePath] = createSignal("");
const [watching, setWatching] = createSignal(false);
const [showOverlay, setShowOverlay] = createSignal(false);

const startTailing = async () => {
  await listen("tail-line", (event) => {
    try {
      const line = event.payload as string;

      // info("\n ➡️" + line.split(": "));

      if (
        line.includes("[STARTUP] Loading Start") ||
        line.includes("[WINDOW] Gained focus")
      ) {
        setShowOverlay(true);
        return;
      }

      if (
        line.includes("[WINDOW] Lost focus") ||
        line.includes("Closing game gracefully")
      ) {
        setShowOverlay(false);
        return;
      }

      if (line.includes("Set Source")) {
        setShowOverlay(!line.includes("unknown"));
        return;
      }

      if (line.includes("area")) {
        const match = line.match(/level (?<level>\d+) area "(?<zone>\w+)"/)!;
        if (match?.groups) {
          const { level, zone } = match.groups;

          if (!zone.toLowerCase().includes("hideout")) {
            // addLayout(zone);
            setZone(zone);
            setZoneLevel(Number(level));
            addTown(zone);
          }
        }

        return;
      }

      if (line.includes("is now level")) {
        const levelMatch = line.match(
          /: (?<charName>\w*) \((?<charClass>\w*)\) is now level (?<charLevel>\d*)/,
        )!;

        if (levelMatch?.groups) {
          const { charName, charClass, charLevel } = levelMatch.groups;
          if (!character.name) setCharacterName(charName);
          if (character.name == charName) {
            updateCharacterClass(charClass);
            updateCharacterLevel(Number(charLevel));
          }
        }

        return;
      }

      // if (line.includes("LOADING SCREEN")) {
      //   const match = line.match(/LOADING SCREEN\] \((?<zoneName>[^)]+)/)!;
      //   const { zoneName } = match.groups!;
      //   addTownName(tracker.zone, zoneName);
      // }

      const zoneQuotes = quotes?.[tracker.zone];
      if (zoneQuotes) {
        const quoteArray = line.split(": ");
        let quote = quoteArray[quoteArray.length - 1];

        if (character.name && quote.includes(character.name)) {
          quote = quote.replace(character.name, "Character");
        }

        if (zoneQuotes[quote]) {
          setFlag(quote);
        }
      }
    } catch (e) {
      error("tailing file: " + e);
    }
  });

  setWatching(true);

  await invoke("tail_file", { filePath: filePath() }).catch((e) => {
    error("invoking tail_file: " + e);
  });
};

const selectFile = async () => {
  const selected =
    (await open({
      multiple: false,
      directory: false,
      defaultPath:
        "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile 2\\logs\\Client.txt",
      filters: [
        {
          name: "Log Files",
          extensions: ["txt"],
        },
      ],
    })) || "";

  if (!selected) {
    info("client file selecting cancelled");
    return;
  }

  if (selected.endsWith("\\Client.txt") || selected.endsWith("/Client.txt")) {
    if (selected) {
      setFilePath(selected);
      saveFilePath(selected);
    }

    startTailing();
  }
};

const saveFilePath = async (filePath: string) => {
  await store.set("filePath", filePath);
  await store.save();
};

const loadFilePath = async () => {
  const fp = await store.get<string>("filePath");
  if (fp) {
    setFilePath(fp);
    startTailing();
  }

  if (!filePath()) togglePassthrough();
};

export {
  filePath,
  setFilePath,
  saveFilePath,
  loadFilePath,
  watching,
  setWatching,
  startTailing,
  selectFile,
  showOverlay,
};
