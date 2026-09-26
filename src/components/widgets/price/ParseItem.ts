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
  mod: string;
  min?: number;
  max?: number;
  disabled: boolean;
}

export interface Item {
  category: string;
  rarity: string;
  name: Toggleable<string>;
  type: Toggleable<string>;
  requires: Toggleable<Requirements>;
  ilvl: Toggleable<number>;
  implicit: ItemMod[];
  explicit: ItemMod[];
}

const parseModLine = (line: string): ItemMod => {
  line = line.trim().replace("+", "").replace(" — Unscalable Value", "");

  // number possibly with a range that itself may contain negative numbers
  const numPattern = String.raw`-?\d+(?:\.\d+)?(?:\(-?\d+(?:\.\d+)?--?\d+(?:\.\d+)?\))?`;

  // Case 1: "Adds 1 to 3(2-3) Cold damage..." or "Adds 13(12-13) to 20(18-20) Fire damage..."
  let m = line.match(
    new RegExp(`^(.*?)(${numPattern})\\s+to\\s+(${numPattern})(.*)$`),
  );
  if (m) {
    const [, pre, loRaw, hiRaw, post] = m;
    const lo = parseFloat(loRaw);
    const hi = parseFloat(hiRaw);
    const value = (lo + hi) / 2;
    return { mod: `${pre}# to #${post}`, min: value, disabled: false };
  }

  // Case 2: "+71(61-84) to Accuracy Rating" / "10(10--10)% reduced Charm Charges used"
  m = line.match(new RegExp(`^(.*?)(${numPattern})(.*)$`));
  if (m) {
    const [, pre, numRaw, post] = m;
    return { mod: `${pre}#${post}`, min: parseFloat(numRaw), disabled: false };
  }

  // Case 3: no numbers at all -> flag mod
  return { mod: line, min: 1, disabled: false };
};

export const parseItem = (item: string) => {
  const lines = item.split("\n");

  // TODO: add quality, corruption, fracture
  const itemStruct: Item = {
    category: "",
    rarity: "",
    name: { value: lines[2], disabled: true },
    type: { value: lines[3], disabled: false },
    requires: { value: {}, disabled: true },
    ilvl: { value: 0, disabled: true },
    implicit: [],
    explicit: [],
  };

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("---")) continue;

    if (lines[i].includes("Item Class")) {
      itemStruct.category = lines[i].split("Item Class: ")[1];
      continue;
    }

    if (lines[i].includes("Rarity")) {
      itemStruct.rarity = lines[i].split("Rarity: ")[1];
      continue;
    }

    if (lines[i].includes("Requires")) {
      const line = lines[i];

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
      if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
      if (mod.min) mod.min = Math.floor(mod.min);
      itemStruct.implicit.push(mod);
      continue;
    }

    // TODO: fix having same more twice
    if (
      lines[i].includes("Prefix") ||
      lines[i].includes("Suffix") ||
      lines[i].includes("Unique")
    ) {
      const increase = parseInt(lines[i].match(/(\d+)%/)?.[0] || "0", 10);

      const mod = parseModLine(lines[i + 1]);
      if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
      if (mod.min) mod.min = Math.floor(mod.min);
      itemStruct.explicit.push(mod);

      if (
        !lines[i + 2].includes("Prefix") &&
        !lines[i + 2].includes("Suffix") &&
        !lines[i + 2].includes("Unique") &&
        !lines[i + 2].includes("---") &&
        lines[i + 2].trim()
      ) {
        const mod = parseModLine(lines[i + 2]);
        if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
        if (mod.min) mod.min = Math.floor(mod.min);
        itemStruct.explicit.push(mod);
      }
      continue;
    }
  }

  return itemStruct;
};
