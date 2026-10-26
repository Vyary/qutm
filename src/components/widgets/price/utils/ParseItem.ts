import { info, warn } from "@tauri-apps/plugin-log";
import { findModId } from "./CreateQuery";
import { Item, ItemMod } from "./Types";

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
    const value = Math.floor((Number(low) + Number(high)) / 2);

    const id = findModId(modType, mod);
    if (id) {
      info(
        `XtoX matched: "${mod}" (${modType}) id=${id}, range ${low}-${high} -> min=${value}`,
      );
      multiLineMod = "";
      return {
        id: id,
        mod: mod,
        min: value,
        disabled: false,
      };
    }

    warn(
      `XtoX regex matched but no mod id found: "${mod}" (${modType}), raw="${line}"`,
    );
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

    info(`template="${mod}" numbers=[${modValues.join(", ")}]`);

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
          multiLineMod = "";
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
    info(`no match for "${line}", retrying with multi-line buffer`);
    multiLineMod += line.trim() + "\n";
    return parseModLine(modType, multiLineMod, true);
  }

  info(`unmatched (${modType}): raw="${line}"`);
  return { id: "", mod: "", disabled: false };
};

export const parseItem = (item: string) => {
  const lines = item.split("\n");

  const itemStruct: Item = {
    name: { value: "", disabled: true },
    TypeFilters: { filters: { category: { value: "", disabled: true } } },
    EquipmentFilters: { filters: {}, disabled: true },
    ReqFilters: { filters: {}, disabled: true },
    MapFilters: { filters: {}, disabled: true },
    MiscFilters: { filters: {}, disabled: true },
    enhancement: [],
    implicit: [],
    explicit: [],
    skill: [],
  };

  itemStruct.name = { value: lines[2].trim(), disabled: true };

  if (!lines[3].includes("---")) {
    itemStruct.type = { value: lines[3].trim(), disabled: false };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("---")) continue;

    // Type Filters
    if (line.includes("Item Class: ")) {
      const c = line.split("Item Class: ")[1].trim();

      itemStruct.TypeFilters.filters.category = { value: c, disabled: false };
      continue;
    }

    if (line.includes("Item Level: ")) {
      const ilvl = Number(line.split("Item Level: ")[1]);

      if (ilvl >= 75) {
        itemStruct.TypeFilters.filters.ilvl = {
          value: { min: ilvl },
          disabled: false,
        };
        continue;
      }

      itemStruct.TypeFilters.filters.ilvl = {
        value: { min: ilvl },
        disabled: true,
      };
      continue;
    }

    if (line.includes("Quality")) {
      const match = line.match(/\+(\d+)%/);

      if (match) {
        const quality = Number(match[1]);

        if (quality > 20) {
          itemStruct.TypeFilters.filters.quality = {
            value: { min: quality },
            disabled: false,
          };
          continue;
        }

        itemStruct.TypeFilters.filters.quality = {
          value: { min: quality },
          disabled: true,
        };
      }

      continue;
    }

    const rarity = line.match(/^Rarity: (?<rarity>\w+)/)?.groups?.rarity;
    if (rarity) {
      itemStruct.TypeFilters.filters.rarity = {
        value: rarity,
        disabled: false,
      };
      continue;
    }

    // Equipment Filters

    if (line.includes("Armour: ")) {
      const match = line.match(/(\d+)/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.ar = {
          value: { min: value },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }
    }

    if (line.includes("Critical Hit Chance: ")) {
      const match = line.match(/(\d+?.\d+)%/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.crit = {
          value: { min: value },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }
    }

    if (line.includes("Block chance: ")) {
      const match = line.match(/(\d+)%/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.block = {
          value: { min: value },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }
    }

    if (line.includes("Attacks per Second: ")) {
      const match = line.match(/(\d+?.\d+)/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.aps = {
          value: { min: value },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }
    }

    const match = line.match(/Physical Damage: (\d[\d,]*)-(\d[\d,]*)/);
    if (match) {
      const min = Number(match[1].replace(/,/g, ""));
      const max = Number(match[2].replace(/,/g, ""));
      const value = (min + max) / 2;

      itemStruct.EquipmentFilters.filters.pdps = {
        value: { min: value },
        disabled: false,
      };

      itemStruct.EquipmentFilters.disabled = false;
      continue;
    }

    const edpsMatch = line.match(/Elemental Damage:\s*(.+)/);
    if (edpsMatch) {
      const damageRanges = edpsMatch[1].split(",");
      let totalAverageDamage = 0;

      for (const range of damageRanges) {
        const rangeMatch = range.trim().match(/(\d[\d,]*)-(\d[\d,]*)/);
        if (rangeMatch) {
          const min = Number(rangeMatch[1].replace(/,/g, ""));
          const max = Number(rangeMatch[2].replace(/,/g, ""));
          totalAverageDamage += (min + max) / 2;
        }
      }

      itemStruct.EquipmentFilters.filters.edps = {
        value: { min: totalAverageDamage },
        disabled: false,
      };

      itemStruct.EquipmentFilters.disabled = false;
      continue;
    }

    if (line.includes("Energy Shield: ")) {
      const match = line.match(/(\d+)/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.es = {
          value: { min: value },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }
    }

    if (line.includes("Evasion Rating: ")) {
      const match = line.match(/(\d+)/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.ev = {
          value: { min: value },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }
    }

    if (line.includes("Reload Time: ")) {
      const match = line.match(/(\d+?.\d+)/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.reloadTime = {
          value: { min: value },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }
    }

    if (line.includes("Spirit: ")) {
      const match = line.match(/(\d+)/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.spirit = {
          value: { min: value },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }
    }

    if (line.includes("Sockets: ")) {
      const s = line.split("Sockets: ")[1];
      const sockets = s.split("S").length - 1;

      if (sockets > 1) {
        itemStruct.EquipmentFilters.filters.sockets = {
          value: { min: sockets },
          disabled: false,
        };

        itemStruct.EquipmentFilters.disabled = false;
        continue;
      }

      itemStruct.EquipmentFilters.filters.sockets = {
        value: { min: sockets },
        disabled: true,
      };
      continue;
    }

    if (line.includes("Runic Ward: ")) {
      const match = line.match(/(\d+)/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.EquipmentFilters.filters.ward = {
          value: { min: value },
          disabled: false,
        };
        continue;
      }
    }

    // Requirements Filters
    if (line.includes("Requires")) {
      const levelMatch = line.match(/Level (\d+)/);
      const strMatch = line.match(/(\d+)\s*(?:\([^)]*\)\s*)?Str/);
      const dexMatch = line.match(/(\d+)\s*(?:\([^)]*\)\s*)?Dex/);
      const intMatch = line.match(/(\d+)\s*(?:\([^)]*\)\s*)?Int/);

      itemStruct.ReqFilters = {
        filters: {
          lvl: {
            value: { max: levelMatch ? Number(levelMatch[1]) : undefined },
            disabled: true,
          },
          str: {
            value: { max: strMatch ? Number(strMatch[1]) : undefined },
            disabled: true,
          },
          dex: {
            value: { max: dexMatch ? Number(dexMatch[1]) : undefined },
            disabled: true,
          },
          int: {
            value: { max: intMatch ? Number(intMatch[1]) : undefined },
            disabled: true,
          },
        },
        disabled: true,
      };

      continue;
    }

    // Map Filters
    if (itemStruct.TypeFilters.filters.category?.value == "Waystones") {
      info(line);

      const waystoneTier = line.match(/Waystone \(Tier\s*(?<t>\d+)\)/)?.groups
        ?.t;
      if (waystoneTier) {
        itemStruct.MapFilters.filters.tier = {
          value: { min: Number(waystoneTier) },
          disabled: false,
        };
        continue;
      }

      const waystoneME = line.match(/Monster Effectiveness:\s*\+(?<me>\d+)%/)
        ?.groups?.me;
      if (waystoneME) {
        itemStruct.MapFilters.filters.magicMonsters = {
          value: { min: Number(waystoneME) },
          disabled: false,
        };
        continue;
      }

      const waystoneMR = line.match(/Monster Rarity:\s*\+(?<mr>\d+)%/)?.groups
        ?.mr;
      if (waystoneMR) {
        itemStruct.MapFilters.filters.rareMonsters = {
          value: { min: Number(waystoneMR) },
          disabled: false,
        };
        continue;
      }

      const waystoneDC = line.match(/Waystone Drop Chance:\s*\+(?<dc>\d+)%/)
        ?.groups?.dc;
      if (waystoneDC) {
        itemStruct.MapFilters.filters.bonus = {
          value: { min: Number(waystoneDC) },
          disabled: false,
        };
        continue;
      }

      const waystonePS = line.match(/Pack Size:\s*\+(?<ps>\d+)%/)?.groups?.ps;
      if (waystonePS) {
        itemStruct.MapFilters.filters.packsize = {
          value: { min: Number(waystonePS) },
          disabled: false,
        };
        continue;
      }

      const waystoneIR = line.match(/Item Rarity:\s*\+(?<ir>\d+)%/)?.groups?.ir;
      if (waystoneIR) {
        itemStruct.MapFilters.filters.iir = {
          value: { min: Number(waystoneIR) },
          disabled: false,
        };
        continue;
      }

      const waystoneR = line.match(/Revives Available:\s*(?<r>\d+)\s/)?.groups
        ?.r;
      if (waystoneR) {
        itemStruct.MapFilters.filters.revives = {
          value: { min: Number(waystoneR) },
          disabled: false,
        };
        continue;
      }

      itemStruct.MapFilters.disabled = false;
    }

    // Misc Filters
    // no use for crafted, desecrated

    if (
      itemStruct.TypeFilters.filters.category.value == "Skill Gems" &&
      line.includes("Level: ")
    ) {
      const match = line.match(/(\d+)/);

      if (match) {
        const value = Number(match[1]);

        itemStruct.MiscFilters.filters.gemLevel = {
          value: { min: value },
          disabled: false,
        };
        continue;
      }
    }

    if (
      itemStruct.TypeFilters.filters.category.value == "Skill Gems" &&
      line.includes("Sockets: ")
    ) {
      const s = line.split("Sockets: ")[1];
      const sockets = s.split("G").length - 1;

      itemStruct.MiscFilters.filters.gemSockets = {
        value: { min: sockets },
        disabled: false,
      };
      continue;
    }

    if (line === "Unidentified") {
      itemStruct.MiscFilters.filters.identified = {
        value: false,
        disabled: false,
      };
      continue;
    }

    if (line === "Corrupted") {
      itemStruct.MiscFilters.filters.corrupted = {
        value: true,
        disabled: false,
      };
      continue;
    }

    if (line === "Twice Corrupted") {
      itemStruct.MiscFilters.filters.twiceCorrupted = {
        value: true,
        disabled: false,
      };
      continue;
    }

    if (line === "Sanctified") {
      itemStruct.MiscFilters.filters.sanctified = {
        value: true,
        disabled: false,
      };
      continue;
    }

    if (line === "Mirrored") {
      itemStruct.MiscFilters.filters.mirrored = {
        value: true,
        disabled: false,
      };
      continue;
    }

    if (itemStruct.TypeFilters.filters.category?.value != "Waystones") {
      if (line.includes("Enhancement")) {
        const increase = parseInt(line.match(/(\d+)%/)?.[0] || "0", 10);

        for (let j = 1; j <= 3; i++) {
          if (
            lines[i + j].includes("Enhancement") ||
            lines[i + j].includes("---") ||
            !lines[i + j].trim()
          ) {
            break;
          }

          const mod = parseModLine("enchant", lines[i + j]);
          if (mod.mod == "") continue;

          if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
          if (mod.min) mod.min = Math.floor(mod.min);

          itemStruct.enhancement.push(mod);
          info(
            `enhancement added: "${mod.mod}" id=${mod.id} min=${mod.min} max=${mod.max} disabled=${mod.disabled}\n`,
          );
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
            break;
          }

          const mod = parseModLine("implicit", lines[i + j]);
          if (mod.mod == "") continue;

          if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
          if (mod.min) mod.min = Math.floor(mod.min);

          itemStruct.implicit.push(mod);
          info(
            `implicit added: "${mod.mod}" id=${mod.id} min=${mod.min} max=${mod.max} disabled=${mod.disabled}\n`,
          );
        }

        continue;
      }

      if (line.includes("Grants Skill")) {
        const mod = parseModLine("skill", line);
        if (mod.mod == "") continue;

        itemStruct.skill.push(mod);
        info(
          `skill added: "${mod.mod}" id=${mod.id} min=${mod.min} max=${mod.max} disabled=${mod.disabled}\n`,
        );
        continue;
      }
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
          break;
        }

        const mod = parseModLine("explicit", lines[i + j]);
        if (mod.mod == "") continue;

        if (fractured) mod.fractured = { value: true, disabled: true };
        if (tier > 2) mod.disabled = true;
        if (itemStruct.TypeFilters.filters.category?.value == "Waystones")
          mod.disabled = true;

        if (increase > 0 && mod.min) mod.min = mod.min * (1 + increase / 100);
        if (mod.min) mod.min = Math.floor(mod.min);

        const modIndex = itemStruct.explicit.findIndex(
          (item) => item.mod == mod.mod,
        );
        if (modIndex === -1) {
          itemStruct.explicit.push(mod);
          info(
            `explicit added: "${mod.mod}" id=${mod.id} min=${mod.min} max=${mod.max} disabled=${mod.disabled}\n`,
          );

          continue;
        }
        if (modIndex > -1 && itemStruct.explicit[modIndex].min && mod.min) {
          const before = itemStruct.explicit[modIndex].min;
          itemStruct.explicit[modIndex].min += mod.min;
          info(
            `explicit merged: "${mod.mod}" min ${before} + ${mod.min} = ${itemStruct.explicit[modIndex].min}\n`,
          );
          continue;
        }

        itemStruct.explicit.push(mod);
        info(`explicit duplicate not merged: "${mod.mod}"\n`);
      }
    }
  }

  if (itemStruct.type?.value === "") {
    itemStruct.type.disabled = true;
    itemStruct.name.disabled = false;
  }

  if (itemStruct.TypeFilters.filters.rarity?.value === "Unique") {
    itemStruct.name.disabled = false;
  }

  return itemStruct;
};
