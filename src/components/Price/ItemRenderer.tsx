import {
  type Item,
  type Rune,
  type MinMax,
  type Prices,
  type Toggleable,
} from "./utils/Types.ts";
import { openUrl } from "@tauri-apps/plugin-opener";
import { createQuery } from "./utils/CreateQuery.ts";
import { enablePassthrough } from "@/lib/Passthrough.ts";
import { error } from "@tauri-apps/plugin-log";
import { overviews } from "@/lib/Overviews.ts";
import { Accessor, For, onSettled, Show, StoreSetter } from "solid-js";
import { JSX } from "@solidjs/web/jsx-runtime";
import { ITEM_CLASSES } from "./utils/ItemClasses.ts";
import { league } from "../Settings/Settings.tsx";
import { emptyItem } from "./utils/PriceState.ts";

interface ItemRendererProps {
  item: Item;
  setItem: StoreSetter<Item>;
  prices: Accessor<Prices[]>;
  timeout: Accessor<number>;
  getPrice: () => void;
  ovPrice: Accessor<boolean>;
}

type GroupType =
  | "TypeFilters"
  | "EquipmentFilters"
  | "ReqFilters"
  | "MapFilters"
  | "MiscFilters";

function isRune(item: any): item is Rune {
  return item && typeof item === "object" && "count" in item && "mod" in item;
}

const filtersOf = <V = MinMax,>(i: Item, group: GroupType) =>
  i[group].filters as unknown as Record<string, Toggleable<V> | undefined>;

function formatValue(value: number) {
  if (!value) return 0;

  return value >= 1
    ? value % 1 === 0
      ? value
      : value.toFixed(2)
    : value.toFixed(4);
}

function InputRange(props: {
  min?: number;
  max?: number;
  onInput: (valueType: "min" | "max", value: number | undefined) => void;
}): JSX.Element {
  const input = (placeholder: string, valueType: "min" | "max") => (
    <input
      type="text"
      placeholder={placeholder}
      class="input input-xs w-16"
      value={props[valueType] ?? ""}
      onInput={(e) => {
        const val = e.currentTarget.value;
        props.onInput(valueType, val === "" ? undefined : Number(val));
      }}
    />
  );

  return (
    <div class="inline-flex gap-1">
      {input("Min", "min")}
      <span class="opacity-40">-</span>
      {input("Max", "max")}
    </div>
  );
}

function FilterRow<T extends GroupType>(props: {
  label: string;
  group: T;
  key: string;
  item: Item;
  setItem: StoreSetter<Item>;
}) {
  const range = () => filtersOf(props.item, props.group)[props.key];

  return (
    <div
      class={[
        "flex gap-1 items-center justify-between max-h-6",
        { "opacity-40": range()?.disabled ?? true },
      ]}
    >
      <span
        class="cursor-pointer"
        onClick={() => {
          const group = props.group;
          const key = props.key;
          props.setItem((s) => {
            const f = filtersOf(s, group);
            const entry = (f[key] ??= { value: {}, disabled: true });
            entry.disabled = !entry.disabled;
          });
        }}
      >
        {props.label}
      </span>
      <InputRange
        min={range()?.value.min}
        max={range()?.value.max}
        onInput={(valueType: "min" | "max", value: number | undefined) => {
          const group = props.group;
          const key = props.key;
          props.setItem((s) => {
            const f = filtersOf(s, group);
            const entry = (f[key] ??= { value: {}, disabled: false });
            entry.value[valueType] = value;
          });
        }}
      />
    </div>
  );
}

function BooleanRow<T extends GroupType>(props: {
  label: string;
  group: T;
  key: string;
  item: Item;
  setItem: StoreSetter<Item>;
}) {
  const bool = () => filtersOf<boolean>(props.item, props.group)[props.key];

  const selected = () => {
    const v = bool()?.value;
    return v === undefined ? "Any" : v ? "Yes" : "No";
  };

  let detailsRef!: HTMLDetailsElement;

  const handleSelect = (choice: "Any" | "Yes" | "No") => {
    detailsRef.removeAttribute("open");

    const group = props.group;
    const key = props.key;
    props.setItem((s) => {
      if (choice === "Any") {
        delete filtersOf<boolean>(s, group)[key];
      } else {
        filtersOf<boolean>(s, group)[key] = {
          value: choice === "Yes",
          disabled: false,
        };
      }
    });
  };

  const toggleDisabled = () => {
    const group = props.group;
    const key = props.key;
    props.setItem((s) => {
      const f = filtersOf<boolean>(s, group)[key];
      if (f) f.disabled = !f.disabled;
    });
  };

  return (
    <div class="flex gap-1 items-center justify-between max-h-6">
      <span
        class={["cursor-pointer", { "opacity-40": bool()?.disabled ?? true }]}
        onClick={toggleDisabled}
      >
        {props.label}
      </span>
      <details ref={detailsRef} class="dropdown dropdown-end">
        <summary class="btn btn-xs  btn-soft w-16">{selected()}</summary>
        <ul class="menu dropdown-content bg-base-200 border border-base-content/5 rounded-box z-1 w-52 p-2 shadow-sm">
          <For each={["Any", "Yes", "No"] as const} keyed={false}>
            {(choice) => (
              <li>
                <a onClick={() => handleSelect(choice())}>{choice()}</a>
              </li>
            )}
          </For>
        </ul>
      </details>
    </div>
  );
}

function FilterGroup(props: {
  label: string;
  disabled: boolean;
  onToggle: () => void;
  children: JSX.Element;
}) {
  return (
    <div class="flex flex-col gap-1">
      <div
        class={[
          "divider my-0 cursor-pointer",
          { "opacity-50": props.disabled },
        ]}
        onClick={() => props.onToggle()}
      >
        {props.label}
      </div>
      <Show when={!props.disabled}>{props.children}</Show>
    </div>
  );
}

function ToggleableRow(props: {
  label: string;
  el: Toggleable<string> | undefined;
  onToggle: () => void;
}) {
  return (
    <Show when={props.el?.value}>
      <div>
        <button
          class={["cursor-pointer", { "opacity-40": props.el?.disabled }]}
          onClick={() => props.onToggle()}
        >
          {props.label}
          {props.el?.value}
        </button>
      </div>
    </Show>
  );
}

function ModList(props: {
  modType: "skill" | "enhancement" | "implicit" | "explicit" | "runes";
  item: Item;
  setItem: StoreSetter<Item>;
}) {
  return (
    <div class="space-y-1">
      <For each={props.item[props.modType]}>
        {(mod, i) => (
          <div class={{ "opacity-40": mod.disabled }}>
            <span class="flex items-center justify-between gap-1">
              <div class="inline-flex items-center gap-1">
                <InputRange
                  min={mod.min}
                  max={mod.max}
                  onInput={(
                    valueType: "min" | "max",
                    value: number | undefined,
                  ) => {
                    const modType = props.modType;
                    const j = i();
                    props.setItem((s) => {
                      s[modType][j][valueType] = value;
                    });
                  }}
                />
                <div
                  class="cursor-pointer"
                  onClick={() => {
                    const modType = props.modType;
                    const j = i();
                    props.setItem((s) => {
                      s[modType][j].disabled = !s[modType][j].disabled;
                    });
                  }}
                >
                  {mod.mod}
                </div>
              </div>
              <div
                class={[
                  "cursor-pointer text-xs ",
                  {
                    "opacity-40": mod.fractured?.disabled,
                  },
                  {
                    "badge badge-xs badge-soft badge-warning": mod.fractured
                      ? true
                      : false,
                  },
                ]}
                onClick={() => {
                  const modType = props.modType;
                  const j = i();
                  props.setItem((s) => {
                    const fractured = s[modType][j]!.fractured;
                    if (fractured) fractured.disabled = !fractured.disabled;
                  });
                }}
              >
                {mod.fractured ? "Fractured" : ""}
              </div>
              <Show when={isRune(mod) ? mod : null}>
                {(rune) => {
                  const name = () => rune().name;
                  const overview = () => overviews[name() ?? ""];
                  const maxC = () => overview()?.maxVolumeCurrency || "exalted";
                  const curr = () =>
                    overview()?.prices?.[
                      maxC() as "exalted" | "chaos" | "divine"
                    ] || 0;

                  return (
                    <Show when={name()}>
                      <div class="flex flex-col items-end justify-center text-xs opacity-60 max-h-6">
                        <div class="flex gap-1">
                          <Show when={rune().count > 1}>
                            <div>{`${rune().count} x `}</div>
                          </Show>
                          <div>{name()}</div>
                        </div>
                        <div class="-mt-1">
                          {`${formatValue(rune().count * curr())} ${maxC()}`}
                        </div>
                      </div>
                    </Show>
                  );
                }}
              </Show>
            </span>
          </div>
        )}
      </For>
    </div>
  );
}

function CloseButton(props: { setItem: StoreSetter<Item> }) {
  return (
    <button
      class="btn btn-circle btn-ghost btn-sm text-base-content/40 hover:text-error hover:bg-error/10"
      onClick={() => props.setItem(() => emptyItem)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  );
}

const FLAGS = [
  { key: "corrupted", label: "Corrupted", color: "badge-error" },
  { key: "twiceCorrupted", label: "Twice Corrupted", color: "badge-error" },
  { key: "mirrored", label: "Mirrored", color: "badge-info" },
  { key: "sanctified", label: "Sanctified", color: "badge-warning" },
];

function FlagBadge(props: { item: Item; setItem: StoreSetter<Item> }) {
  return (
    <For each={FLAGS}>
      {(f) => {
        const flag = () =>
          props.item.MiscFilters.filters[
            f.key as keyof Item["MiscFilters"]["filters"]
          ];
        return (
          <Show when={flag()?.value}>
            <div>
              <span
                class={[
                  `cursor-pointer badge badge-sm badge-soft ${f.color}`,
                  { "opacity-40": flag()?.disabled },
                ]}
                onClick={() =>
                  props.setItem((s) => {
                    const key = f.key as keyof Item["MiscFilters"]["filters"];
                    const filter = s.MiscFilters.filters[key];
                    if (filter) filter.disabled = !filter.disabled;
                  })
                }
              >
                {f.label}
              </span>
            </div>
          </Show>
        );
      }}
    </For>
  );
}

export function ItemRenderer(props: ItemRendererProps) {
  const cat = () => props.item.TypeFilters.filters.category.value;
  const rarity = () => props.item.TypeFilters.filters.rarity?.value;
  const catType = () => ITEM_CLASSES[cat()]?.type;

  const isArmour = () => catType() === "armour";
  const isWeapon = () => catType() === "weapon";
  const isCurrency = () => catType() === "currency" || rarity() === "Currency";
  const isSceptre = () =>
    props.item.TypeFilters.filters.category.value === "Sceptres";
  const hasReq = () =>
    [
      "armour",
      "weapon",
      "caster",
      "belt",
      "quiver",
      "accessory",
      "gem",
      "flask",
      "charm",
    ].includes(catType());
  const hasQuality = () =>
    [
      "armour",
      "weapon",
      "caster",
      "accessory",
      "gem",
      "flask",
      "charm",
      "jewel",
    ].includes(catType());
  const isWaystone = () => catType() === "waystone";
  const isGem = () => catType() === "gem" || catType() === "support";

  onSettled(() => {
    const c = ITEM_CLASSES[props.item.TypeFilters.filters.category.value];
    if (!c) {
      error(
        `no category found for: ${props.item.TypeFilters.filters.category.value}`,
      );
    }
  });

  return (
    <div class="flex flex-col gap-1 justify-center p-4 text-sm">
      <div class="flex items-center justify-between">
        <ToggleableRow
          label=""
          el={props.item.name}
          onToggle={() =>
            props.setItem((s) => {
              const name = s.name;
              if (name) name.disabled = !name.disabled;
            })
          }
        />
        <div class="flex items-center justify-center gap-2">
          <FlagBadge item={props.item} setItem={props.setItem} />
          <CloseButton setItem={props.setItem} />
        </div>
      </div>

      <ToggleableRow
        label=""
        el={props.item.type}
        onToggle={() =>
          props.setItem((s) => {
            const type = s.type;
            if (type) type.disabled = !type.disabled;
          })
        }
      />

      <Show when={catType() && !isCurrency()}>
        <ToggleableRow
          label="Rarity: "
          el={props.item.TypeFilters.filters.rarity}
          onToggle={() =>
            props.setItem((s) => {
              const rarity = s.TypeFilters.filters.rarity;
              if (rarity) rarity.disabled = !rarity.disabled;
            })
          }
        />
      </Show>

      <Show when={catType() && !isCurrency() && !isGem()}>
        <FilterRow
          label="Item Level: "
          group="TypeFilters"
          key="ilvl"
          item={props.item}
          setItem={props.setItem}
        />
      </Show>

      <Show when={hasQuality()}>
        <FilterRow
          label="Quality: "
          group="TypeFilters"
          key="quality"
          item={props.item}
          setItem={props.setItem}
        />
      </Show>

      <Show when={isWeapon() || isArmour()}>
        <FilterGroup
          label="Equipment Filters"
          disabled={props.item.EquipmentFilters.disabled}
          onToggle={() =>
            props.setItem((s) => {
              const ef = s.EquipmentFilters;
              if (ef) ef.disabled = !ef.disabled;
            })
          }
        >
          <FilterRow
            label="Sockets: "
            group="EquipmentFilters"
            key="sockets"
            item={props.item}
            setItem={props.setItem}
          />
          <Show when={isSceptre()}>
            <FilterRow
              label="Spirit: "
              group="EquipmentFilters"
              key="spirit"
              item={props.item}
              setItem={props.setItem}
            />
          </Show>
          <Show when={isWeapon() && !isSceptre()}>
            <For
              each={[
                ["aps", "Attack Speed: "],
                ["crit", "Critical Chance: "],
                ["dps", "DPS: "],
                ["pdps", "Physical DPS: "],
                ["edps", "Elemental DPS: "],
                ["reloadTime", "Reload Time: "],
              ]}
            >
              {([k, l]) => (
                <FilterRow
                  label={l}
                  group="EquipmentFilters"
                  key={k}
                  item={props.item}
                  setItem={props.setItem}
                />
              )}
            </For>
          </Show>
          <Show when={isArmour()}>
            <For
              each={[
                ["ar", "Armour: "],
                ["ev", "Evasion: "],
                ["es", "Energy Shield: "],
                ["ward", "Runic Ward: "],
                ["block", "Block: "],
                ["reloadTime", "Reload Time: "],
              ]}
            >
              {([k, l]) => (
                <FilterRow
                  label={l}
                  group="EquipmentFilters"
                  key={k}
                  item={props.item}
                  setItem={props.setItem}
                />
              )}
            </For>
          </Show>
        </FilterGroup>
      </Show>

      <Show when={hasReq()}>
        <FilterGroup
          label="Requirements"
          disabled={props.item.ReqFilters.disabled}
          onToggle={() =>
            props.setItem((s) => {
              const rf = s.ReqFilters;
              if (rf) rf.disabled = !rf.disabled;
            })
          }
        >
          <For
            each={[
              ["lvl", "Level: "],
              ["str", "Strength: "],
              ["dex", "Dexterity: "],
              ["int", "Intelligence: "],
            ]}
          >
            {([k, l]) => (
              <FilterRow
                label={l}
                group="ReqFilters"
                key={k}
                item={props.item}
                setItem={props.setItem}
              />
            )}
          </For>
        </FilterGroup>
      </Show>

      <Show when={isWaystone()}>
        <FilterGroup
          label="Map Filters"
          disabled={props.item.MapFilters.disabled}
          onToggle={() =>
            props.setItem((s) => {
              const mf = s.MapFilters;
              if (mf) mf.disabled = !mf.disabled;
            })
          }
        >
          <For
            each={[
              ["tier", "Tier: "],
              ["revives", "Revives: "],
              ["iir", "Item Rarity: "],
              ["packsize", "Pack Size: "],
              ["rareMonsters", "Monster Rarity: "],
              ["magicMonsters", "Monster Effectiveness: "],
              ["bonus", "Drop Chance: "],
            ]}
          >
            {([k, l]) => (
              <FilterRow
                label={l}
                group="MapFilters"
                key={k}
                item={props.item}
                setItem={props.setItem}
              />
            )}
          </For>
        </FilterGroup>
      </Show>

      <Show when={catType() && !isCurrency()}>
        <FilterGroup
          label="Miscellaneous"
          disabled={props.item.MiscFilters.disabled}
          onToggle={() =>
            props.setItem((s) => {
              const mf = s.MiscFilters;
              if (mf) mf.disabled = !mf.disabled;
            })
          }
        >
          <Show when={isGem()}>
            <FilterRow
              label="Gem Level: "
              group="MiscFilters"
              key="gemLevel"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Gem Sockets: "
              group="MiscFilters"
              key="gemSockets"
              item={props.item}
              setItem={props.setItem}
            />
          </Show>
          <For
            each={[
              {
                label: "Identified: ",
                key: "identified",
                block: ["twiceCorrupted", "fractured", "sanctified"] as const,
                show: true,
              },
              {
                label: "Corrupted: ",
                key: "corrupted",
                block: ["twiceCorrupted", "mirrored", "sanctified"] as const,
                show: true,
              },
              {
                label: "Twice Corrupted: ",
                key: "twiceCorrupted",
                block: [
                  "corrupted",
                  "mirrored",
                  "sanctified",
                  "veiled",
                ] as const,
                show: props.item.MiscFilters.filters.identified?.value != false,
              },
              {
                label: "Mirrored: ",
                key: "mirrored",
                block: [
                  "corrupted",
                  "twiceCorrupted",
                  "sanctified",
                  "veiled",
                ] as const,
                show: true,
              },
              {
                label: "Fractured: ",
                key: "fractured",
                block: ["veiled"] as const,
                show:
                  props.item.MiscFilters.filters.identified?.value != false &&
                  !isWaystone(),
              },
              {
                label: "Sanctified: ",
                key: "sanctified",
                block: [
                  "corrupted",
                  "twiceCorrupted",
                  "mirrored",
                  "veiled",
                ] as const,
                show: props.item.MiscFilters.filters.identified?.value != false,
              },
              {
                label: "Unrevealed: ",
                key: "veiled",
                block: [
                  "fractured",
                  "twiceCorrupted",
                  "mirrored",
                  "sanctified",
                ] as const,
                show: true,
              },
            ]}
          >
            {(row) => (
              <Show
                when={
                  !row.block.some(
                    (k) => props.item.MiscFilters.filters[k]?.value === true,
                  ) && row.show
                }
              >
                <BooleanRow
                  label={row.label}
                  group="MiscFilters"
                  key={row.key}
                  item={props.item}
                  setItem={props.setItem}
                />
              </Show>
            )}
          </For>
        </FilterGroup>
      </Show>

      <Show
        when={
          props.item.skill.length > 0 ||
          props.item.enhancement.length > 0 ||
          props.item.runes.length > 0 ||
          props.item.implicit.length > 0
        }
      >
        <div class="divider my-0 opacity-50" />
      </Show>

      <For each={["skill", "enhancement", "runes", "implicit"] as const}>
        {(type) => (
          <Show when={props.item[type].length > 0}>
            <ModList modType={type} item={props.item} setItem={props.setItem} />
          </Show>
        )}
      </For>

      <Show when={props.item.explicit.length > 0}>
        <div class="divider my-0 opacity-50" />
        <ModList modType="explicit" item={props.item} setItem={props.setItem} />
      </Show>

      <div class="divider my-0 opacity-50" />

      <Show when={!props.ovPrice()}>
        <div class="w-full inline-flex justify-between">
          <div>
            <button
              onClick={async () => {
                props.getPrice();
              }}
              class={[
                "btn btn-xs btn-soft w-16",
                {
                  "btn-disabled": props.timeout() > 0,
                  "font-mono": props.timeout() > 0,
                },
              ]}
            >
              {props.timeout() > 0
                ? `${(props.timeout() / 1000).toFixed(1)}s`
                : "Recheck"}
            </button>
          </div>
          <button
            onClick={async () => {
              await openUrl(
                `https://www.pathofexile.com/trade2/search/poe2/${league()}?q=` +
                  JSON.stringify(createQuery(props.item)()),
              );

              enablePassthrough();
            }}
            class="btn btn-xs btn-soft w-16"
          >
            Trade
          </button>
        </div>
      </Show>

      <For each={props.prices()}>
        {(p) => (
          <div class="flex justify-between px-1">
            <span class="">
              {formatValue(p.amount)} {p.currency}
            </span>
            <span>{p.listed}</span>
          </div>
        )}
      </For>
    </div>
  );
}
