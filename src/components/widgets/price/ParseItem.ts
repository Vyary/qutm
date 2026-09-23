import { info } from "@tauri-apps/plugin-log";

interface Toggleable<T> {
  value: T;
  disabled: boolean;
}

export interface ItemMod {
  mod: string;
  value: number;
  disabled: boolean;
}

export interface Item {
  category: string;
  rarity: string;
  name: Toggleable<string>;
  type: Toggleable<string>;
  requires: Toggleable<number>;
  ilvl: Toggleable<number>;
  implicit: ItemMod[];
  explicit: ItemMod[];
}

const convertToCategory = (itemClass: string) => {
  if (itemClass.includes("Rings")) return "accessory.ring";
  if (itemClass.includes("Foci")) return "armour.focus";
  if (itemClass.includes("Gloves")) return "armour.gloves";
  info("no category found for: " + itemClass);
  return "";
};

const parseModLine = (line: string) => {
  line = line.trim().replace("+", "");

  // Case 1: "Adds 1 to 3(2-3) Cold damage..." or "Adds 13(12-13) to 20(18-20) Fire damage..."
  //          -> average the two leading base numbers
  let m = line.match(
    /^(.*?)(\d+(?:\.\d+)?)(?:\(\d+(?:\.\d+)?-\d+(?:\.\d+)?\))?\s+to\s+(\d+(?:\.\d+)?)(?:\(\d+(?:\.\d+)?-\d+(?:\.\d+)?\))?(.*)$/,
  );
  if (m) {
    const [, pre, lo, hi, post] = m;
    const value = (parseFloat(lo) + parseFloat(hi)) / 2;
    return { mod: `${pre}# to #${post}`, value: value, disabled: false };
  }

  // Case 2: "+71(61-84) to Accuracy Rating" / "33% chance..." -> take leading number, drop (range)
  m = line.match(
    /^(.*?)(\d+(?:\.\d+)?)(\(\d+(?:\.\d+)?-\d+(?:\.\d+)?\))?(.*)$/,
  );
  if (m) {
    const [, pre, num, , post] = m;
    return { mod: `${pre}#${post}`, value: parseFloat(num), disabled: false };
  }

  // Case 3: no numbers at all -> flag mod
  return { mod: line, value: 1, disabled: false };
};

export const parseItem = (item: string) => {
  const lines = item.split("\n");

  const itemStruct: Item = {
    category: "",
    rarity: "",
    name: { value: lines[2], disabled: true },
    type: { value: lines[3], disabled: true },
    requires: { value: 0, disabled: true },
    ilvl: { value: 0, disabled: true },
    implicit: [],
    explicit: [],
  };

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("---")) continue;

    if (lines[i].includes("Item Class")) {
      itemStruct.category = convertToCategory(lines[i]);
      continue;
    }

    if (lines[i].includes("Rarity")) {
      itemStruct.rarity = lines[i].split("Rarity: ")[1].toLowerCase();
      continue;
    }

    if (lines[i].includes("Requires")) {
      itemStruct.requires = {
        value: Number(lines[i].split("Requires: Level ")[1]),
        disabled: false,
      };
      continue;
    }

    if (lines[i].includes("Item Level")) {
      itemStruct.ilvl = {
        value: Number(lines[i].split("Item Level: ")[1]),
        disabled: false,
      };
      continue;
    }

    if (lines[i].includes("Item Level")) {
      itemStruct.ilvl = {
        value: Number(lines[i].split("Item Level: ")[1]),
        disabled: false,
      };
      continue;
    }

    if (lines[i].includes("Implicit")) {
      const increase = parseInt(lines[i].match(/(\d+)%/)?.[0] || "0", 10);
      const mod = parseModLine(lines[i + 1]);
      if (increase > 0) mod.value = mod.value * (1 + increase / 100);
      mod.value = Math.floor(mod.value);
      itemStruct.implicit.push(mod);
      continue;
    }

    if (lines[i].includes("Prefix") || lines[i].includes("Suffix")) {
      const increase = parseInt(lines[i].match(/(\d+)%/)?.[0] || "0", 10);

      const mod = parseModLine(lines[i + 1]);
      if (increase > 0) mod.value = mod.value * (1 + increase / 100);
      mod.value = Math.floor(mod.value);
      itemStruct.explicit.push(mod);

      if (
        !lines[i + 2].includes("Prefix") &&
        !lines[i + 2].includes("Suffix") &&
        !lines[i + 2].includes("---") &&
        lines[i + 2].trim()
      ) {
        const mod = parseModLine(lines[i + 2]);
        if (increase > 0) mod.value = mod.value * (1 + increase / 100);
        mod.value = Math.floor(mod.value);
        itemStruct.explicit.push(mod);
      }
      continue;
    }
  }

  return itemStruct;
};
