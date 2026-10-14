import { debug, info } from "@tauri-apps/plugin-log";
import { findModId } from "./CreateQuery";

interface Toggleable<T> {
  value: T;
  disabled: boolean;
}

export interface Requirements {
  level?: { min?: number; max?: number };
  str?: { min?: number; max?: number };
  dex?: { min?: number; max?: number };
  int?: { min?: number; max?: number };
}

export interface ItemMod {
  id: string;
  mod: string;
  disabled: boolean;
  min?: number;
  max?: number;
  fractured?: Toggleable<boolean>;
}

export interface Item {
  category: string;
  rarity: Toggleable<string>;
  name: Toggleable<string>;
  type: Toggleable<string>;
  ilvl: Toggleable<number>;
  quality: Toggleable<number>;
  requires: Toggleable<Requirements>;
  sockets: Toggleable<number>;
  enhancement: ItemMod[];
  implicit: ItemMod[];
  explicit: ItemMod[];
  skill: ItemMod[];
  corrupted?: Toggleable<boolean>;
  sanctified?: Toggleable<boolean>;
  mirrored?: Toggleable<boolean>;
}

let multiLineMod = "";

const parseModLine = (
  modType: string,
  line: string,
  multiLine?: boolean,
): ItemMod => {
  line = line.trim().replace(" — Unscalable Value", "");

  if (line.includes("Charm Slots")) {
    line = line.replace("Slots", "Slot");
  }

  // match Adds 4(2-4) to 5(5-8) Physical Damage to Attacks
  const XtoX = line.match(
    /(?<pre>.* )?(?<low>-?\d+)\(.*?\) to (?<high>-?\d+)\(.*?\)(?<rest>.*)/,
  );
  if (XtoX) {
    const { pre, low, high, rest } = XtoX.groups!;
    const mod = `${pre ? pre : ""}# to #${rest}`;
    const value = (Number(low) + Number(high)) / 2;

    const id = findModId(modType, mod);
    if (id) {
      info(`matched # to #${rest}, value: ${value}`);
      multiLineMod = "";
      return {
        id: id,
        mod: mod,
        min: value,
        disabled: false,
      };
    }
  }

  line = line.replace(/\(.*?\)/, "");
  const modValues = [...line.matchAll(/-?\d+(?:\.\d+)?/g)].map(
    (match) => match[0],
  );
  if (modValues) {
    let mod = line;
    let value = 0;

    for (const number of modValues) {
      mod = mod.replace(`${number}`, "#");
    }

    for (let i = 0; i < modValues.length; i++) {
      value = Number(modValues[i]);

      const id = findModId(modType, mod);
      if (id) {
        multiLineMod = "";
        return { id: id, mod: mod, min: value, disabled: false };
      }

      if (mod.includes("+")) {
        const id = findModId(modType, mod.replace("+", ""));
        if (id) {
          return {
            id: id,
            mod: mod.replace("+", ""),
            min: value,
            disabled: false,
          };
        }
      }

      if (mod.includes("less")) {
        const id = findModId(modType, mod.replaceAll("less", "more"));
        if (id) {
          multiLineMod = "";
          return {
            id: id,
            mod: mod.replaceAll("less", "more"),
            max: -value,
            disabled: false,
          };
        }
      }

      if (mod.includes("Unlucky")) {
        const id = findModId(modType, mod.replaceAll("Unlucky", "Lucky"));
        if (id) {
          multiLineMod = "";
          return {
            id: id,
            mod: mod.replaceAll("Unlucky", "Lucky"),
            max: -value,
            disabled: false,
          };
        }
      }

      if (
        mod.includes("reduced Life") ||
        mod.includes("Reload Speed") ||
        mod.includes("Attribute Requirements") ||
        mod.includes("Duration of Bleeding on You")
      ) {
        const id = findModId(modType, mod.replace("reduced", "increased"));
        if (id) {
          multiLineMod = "";
          return {
            id: id,
            mod: mod.replace("reduced", "increased"),
            max: -value,
            disabled: false,
          };
        }
      }

      if (mod.includes("Charm Charges gained")) {
        const id = findModId(modType, mod.replace("reduced", "increased"));
        if (id) {
          multiLineMod = "";
          return {
            id: id,
            mod: mod.replace("reduced", "increased"),
            min: -value,
            disabled: false,
          };
        }
      }

      if (mod.includes("Charm Charges used")) {
        const id = findModId(modType, mod.replace("increased", "reduced"));
        if (id) {
          multiLineMod = "";
          return {
            id: id,
            mod: mod.replace("increased", "reduced"),
            min: -value,
            disabled: false,
          };
        }
      }

      mod = mod.replace("#", `${modValues[i]}`);
    }
  }

  const id = findModId(modType, line);
  if (id) {
    multiLineMod = "";
    return { id: id, mod: line, disabled: false };
  }

  if (!multiLine) {
    multiLineMod += line.trim() + "\n";
    return parseModLine(modType, multiLineMod, true);
  }

  return { id: "", mod: "", disabled: false };
};

export const parseItem = (item: string) => {
  debug("parsing item");

  const lines = item.split("\n");

  const itemStruct: Item = {
    category: "",
    rarity: { value: "", disabled: false },
    name: { value: lines[2].trim(), disabled: true },
    type: { value: "", disabled: false },
    quality: { value: 0, disabled: true },
    requires: { value: {}, disabled: true },
    ilvl: { value: 0, disabled: true },
    sockets: { value: 0, disabled: true },
    enhancement: [],
    implicit: [],
    explicit: [],
    skill: [],
  };

  if (!lines[3].includes("---")) {
    itemStruct.type = { value: lines[3].trim(), disabled: false };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes("---")) continue;

    if (line === "Corrupted" || lines[i] === "Twice Corrupted") {
      itemStruct.corrupted = { value: true, disabled: false };
      continue;
    }

    if (line === "Sanctified") {
      itemStruct.sanctified = { value: true, disabled: false };
      continue;
    }

    if (line === "Mirrored") {
      itemStruct.mirrored = { value: true, disabled: false };
      continue;
    }

    debug("line: " + line);

    if (line.includes("Item Class: ")) {
      const c = line.split("Item Class: ")[1].trim();

      itemStruct.category = c;
      debug("added category: " + c);
      continue;
    }

    if (line.includes("Rarity: ")) {
      const r = line.split("Rarity: ")[1].trim();

      itemStruct.rarity = { value: r, disabled: false };
      debug("added rarity: " + r);
      continue;
    }

    if (line.includes("Item Level: ")) {
      const ilvl = Number(line.split("Item Level: ")[1]);

      if (ilvl > 75) {
        itemStruct.ilvl = { value: ilvl, disabled: false };
        continue;
      }

      itemStruct.ilvl = {
        value: ilvl,
        disabled: true,
      };

      debug("added ilvl: " + ilvl);
      continue;
    }

    if (line.includes("Quality: ")) {
      const match = line.match(/\+(\d+)%/);

      if (match) {
        const quality = Number(match[1]);

        if (quality > 20) {
          itemStruct.quality = { value: quality, disabled: false };
          continue;
        }

        itemStruct.quality = { value: quality, disabled: true };

        debug("added quality: " + match[1]);
      }

      continue;
    }

    if (line.includes("Sockets: ")) {
      const s = line.split("Sockets: ")[1];
      const sockets = s.split("S").length - 1;

      if (sockets > 1) {
        itemStruct.sockets = { value: sockets, disabled: false };
        continue;
      }

      itemStruct.sockets = { value: sockets, disabled: true };
      continue;
    }

    if (line.includes("Requires")) {
      const levelMatch = line.match(/Level (\d+)/);
      const strMatch = line.match(/(\d+)\s*(?:\([^)]*\)\s*)?Str/);
      const dexMatch = line.match(/(\d+)\s*(?:\([^)]*\)\s*)?Dex/);
      const intMatch = line.match(/(\d+)\s*(?:\([^)]*\)\s*)?Int/);

      itemStruct.requires = {
        value: {
          level: { max: levelMatch ? Number(levelMatch[1]) : undefined },
          str: { max: strMatch ? Number(strMatch[1]) : undefined },
          dex: { max: dexMatch ? Number(dexMatch[1]) : undefined },
          int: { max: intMatch ? Number(intMatch[1]) : undefined },
        },
        disabled: true,
      };

      debug("added requirements: " + JSON.stringify(itemStruct.requires));
      continue;
    }

    if (line.includes("Enhancement")) {
      const increase = parseInt(line.match(/(\d+)%/)?.[0] || "0", 10);

      for (let j = 1; j <= 3; i++) {
        if (
          lines[i + j].includes("Enhancement") ||
          lines[i + j].includes("---") ||
          !lines[i + j].trim()
        ) {
          debug("breaking inner loop");
          break;
        }

        debug("---> 2nd loop ---> checking line: " + lines[i + j]);
        const mod = parseModLine("enchant", lines[i + j]);
        if (mod.mod == "") continue;

        if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
        if (mod.min) mod.min = Math.floor(mod.min);
        itemStruct.enhancement.push(mod);
        debug("added enhancement: " + JSON.stringify(mod));
      }

      continue;
    }

    if (line.includes("Implicit")) {
      const increase = parseInt(line.match(/(\d+)%/)?.[0] || "0", 10);

      for (let j = 1; j <= 3; i++) {
        if (
          (lines[i + j].includes("Prefix") &&
            !lines[i + j].includes("allowed")) ||
          (lines[i + j].includes("Suffix") &&
            !lines[i + j].includes("allowed")) ||
          lines[i + j].includes("Unique") ||
          lines[i + j].includes("Implicit") ||
          lines[i + j].includes("---") ||
          !lines[i + j].trim()
        ) {
          debug("breaking inner loop");
          break;
        }

        debug("---> 2nd loop ---> checking line: " + lines[i + j]);
        const mod = parseModLine("implicit", lines[i + j]);
        if (mod.mod == "") continue;

        if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
        if (mod.min) mod.min = Math.floor(mod.min);
        itemStruct.implicit.push(mod);
        debug("added implicit: " + JSON.stringify(mod));
      }

      continue;
    }

    if (line.includes("Grants Skill")) {
      const mod = parseModLine("skill", line);
      if (mod.mod == "") continue;

      if (mod.min) mod.min = Math.floor(mod.min);
      itemStruct.skill.push(mod);
      continue;
    }

    // Explicit
    if (
      line.includes("Prefix") ||
      line.includes("Suffix") ||
      line.includes("Unique")
    ) {
      const increase = parseInt(line.match(/(\d+)%/)?.[0] || "0", 10);
      const fractured = line.includes("Fractured");
      const tier = Number(
        line.match(/Tier:\s*(?<tier>\d+)/)?.groups?.tier ?? 0,
      );

      for (let j = 1; j <= 3; i++) {
        if (
          lines[i + j].includes("Prefix") ||
          lines[i + j].includes("Suffix") ||
          lines[i + j].includes("Unique") ||
          lines[i + j].includes("---") ||
          !lines[i + j].trim()
        ) {
          debug("breaking inner loop");
          break;
        }

        debug("---> 2nd loop ---> checking line: " + lines[i + j]);
        const mod = parseModLine("explicit", lines[i + j]);
        if (mod.mod == "") continue;
        if (fractured) mod.fractured = { value: true, disabled: true };
        if (tier > 2) mod.disabled = true;

        if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
        if (mod.min) mod.min = Math.floor(mod.min);

        const modIndex = itemStruct.explicit.findIndex(
          (item) => item.mod == mod.mod,
        );
        if (modIndex === -1) {
          itemStruct.explicit.push(mod);
          info("added explicit: " + JSON.stringify(mod));
          continue;
        }
        if (modIndex > -1 && itemStruct.explicit[modIndex].min && mod.min) {
          itemStruct.explicit[modIndex].min += mod.min;
          info("increased explicit: " + JSON.stringify(mod));
          continue;
        }
        itemStruct.explicit.push(mod);
        info("added 2nd explicit: " + JSON.stringify(mod));
      }
    }
  }

  if (itemStruct.type.value === "") {
    itemStruct.type.disabled = true;
    itemStruct.name.disabled = false;
  }

  if (itemStruct.rarity.value === "Unique") {
    itemStruct.name.disabled = false;
  }

  return itemStruct;
};
