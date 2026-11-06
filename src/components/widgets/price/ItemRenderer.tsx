import { Accessor, For, JSX, onMount, Show } from "solid-js";
import { produce, type SetStoreFunction } from "solid-js/store";
import {
  CLASSES,
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
import { league } from "../settings/Settings.tsx";

interface ItemRendererProps {
  item: Item;
  setItem: SetStoreFunction<Item>;
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
  setItem: SetStoreFunction<Item>;
}) {
  const filters = (i: Item) =>
    i[props.group].filters as unknown as Record<
      string,
      Toggleable<MinMax> | undefined
    >;
  const range = () => filters(props.item)[props.key];

  return (
    <div
      class="flex gap-1 items-center justify-between max-h-6"
      classList={{
        "opacity-40": range()?.disabled ?? true,
      }}
    >
      <span
        class="cursor-pointer"
        onClick={() =>
          props.setItem(
            produce((s) => {
              filters(s)[props.key] ??= {
                value: {},
                disabled: true,
              };
              filters(s)[props.key]!.disabled =
                !filters(s)[props.key]!.disabled;
            }),
          )
        }
      >
        {props.label}
      </span>
      <InputRange
        min={range()?.value.min}
        max={range()?.value.max}
        onInput={(valueType: "min" | "max", value: number | undefined) => {
          props.setItem(
            produce((s) => {
              filters(s)[props.key] ??= {
                value: {},
                disabled: false,
              };
              filters(s)[props.key]!.value[valueType] = value;
            }),
          );
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
  setItem: SetStoreFunction<Item>;
}) {
  const filters = (i: Item) =>
    i[props.group].filters as unknown as Record<
      string,
      Toggleable<boolean> | undefined
    >;
  const bool = () => filters(props.item)[props.key];

  const selected = () => {
    const v = bool()?.value;
    return v === undefined ? "Any" : v ? "Yes" : "No";
  };

  let detailsRef!: HTMLDetailsElement;

  const handleSelect = (choice: "Any" | "Yes" | "No") => {
    detailsRef.removeAttribute("open");
    props.setItem(
      produce((s) => {
        if (choice === "Any") {
          delete filters(s)[props.key];
        } else {
          filters(s)[props.key] = {
            value: choice === "Yes",
            disabled: false,
          };
        }
      }),
    );
  };

  const toggleDisabled = () =>
    props.setItem(
      produce((s) => {
        const f = filters(s)[props.key];
        if (f) f.disabled = !f.disabled;
      }),
    );

  return (
    <div class="flex gap-1 items-center justify-between max-h-6">
      <span
        class="cursor-pointer"
        classList={{ "opacity-40": bool()?.disabled ?? true }}
        onClick={toggleDisabled}
      >
        {props.label}
      </span>
      <details ref={detailsRef} class="dropdown dropdown-end">
        <summary class="btn btn-xs btn-soft btn-outline w-16">
          {selected()}
        </summary>
        <ul class="menu dropdown-content bg-base-200 border border-base-content/5 rounded-box z-1 w-52 p-2 shadow-sm">
          <For each={["Any", "Yes", "No"] as const}>
            {(choice) => (
              <li>
                <a onClick={() => handleSelect(choice)}>{choice}</a>
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
        class="divider my-0 cursor-pointer"
        classList={{
          "opacity-50": props.disabled,
        }}
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
          class="cursor-pointer"
          classList={{ "opacity-40": props.el?.disabled }}
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
  setItem: SetStoreFunction<Item>;
}) {
  return (
    <div class="space-y-1">
      <For each={props.item[props.modType]}>
        {(mod, i) => (
          <div classList={{ "opacity-40": mod.disabled }}>
            <span class="flex items-center justify-between gap-1">
              <div class="inline-flex items-center gap-1">
                <InputRange
                  min={mod.min}
                  max={mod.max}
                  onInput={(
                    valueType: "min" | "max",
                    value: number | undefined,
                  ) => {
                    props.setItem(props.modType, i(), valueType, value);
                  }}
                />
                <div
                  class="cursor-pointer"
                  onClick={() =>
                    props.setItem(props.modType, i(), "disabled", (d) => !d)
                  }
                >
                  {mod.mod}
                </div>
              </div>
              <div
                class="cursor-pointer text-xs "
                classList={{
                  "opacity-40": mod.fractured?.disabled,
                  "badge badge-xs badge-soft badge-warning": mod.fractured
                    ? true
                    : false,
                }}
                onClick={() => {
                  props.setItem(
                    props.modType,
                    i(),
                    "fractured",
                    "disabled",
                    (d) => !d,
                  );
                }}
              >
                {mod.fractured ? "Fractured" : ""}
              </div>
              <Show when={isRune(mod) ? mod : null} keyed>
                {(rune) => {
                  const overview = overviews[rune.name || ""];
                  const maxC = overview?.maxVolumeCurrency || "exalted";
                  const curr =
                    overview?.prices?.[
                      maxC as "exalted" | "chaos" | "divine"
                    ] || 0;
                  return (
                    <Show when={rune.name}>
                      <div class="flex flex-col items-end justify-center text-xs opacity-60 max-h-6">
                        <div class="flex gap-1">
                          <Show when={rune.count > 1}>
                            <div>{`${rune.count} x `}</div>
                          </Show>
                          <div>{`${rune.name}`}</div>
                        </div>
                        <div class="-mt-1">{`${formatValue(rune.count * curr)} ${maxC}`}</div>
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

const FLAGS = [
  { key: "corrupted", label: "Corrupted", color: "badge-error" },
  { key: "twiceCorrupted", label: "Twice Corrupted", color: "badge-error" },
  { key: "mirrored", label: "Mirrored", color: "badge-info" },
  { key: "sanctified", label: "Sanctified", color: "badge-warning" },
];

function FlagBadge(props: { item: Item; setItem: SetStoreFunction<Item> }) {
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
                class={`cursor-pointer badge badge-sm badge-soft ${f.color}`}
                classList={{ "opacity-40": flag()?.disabled }}
                onClick={() =>
                  props.setItem(
                    "MiscFilters",
                    "filters",
                    f.key as keyof Item["MiscFilters"]["filters"],
                    "disabled",
                    (d) => !d,
                  )
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
  const catType = () => CLASSES[cat()]?.type;

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

  onMount(() => {
    const c = CLASSES[props.item.TypeFilters.filters.category.value];
    if (!c)
      return error(
        `no category found for: ${props.item.TypeFilters.filters.category.value}`,
      );
  });

  return (
    <div class="flex flex-col gap-1 justify-center p-4 text-sm">
      <div class="flex items-center justify-between">
        <ToggleableRow
          label=""
          el={props.item.name}
          onToggle={() => props.setItem("name", "disabled", (d) => !d)}
        />
        <FlagBadge item={props.item} setItem={props.setItem} />
      </div>

      <ToggleableRow
        label=""
        el={props.item.type}
        onToggle={() => props.setItem("type", "disabled", (d) => !d)}
      />

      <Show when={catType() && !isCurrency()}>
        <ToggleableRow
          label="Rarity: "
          el={props.item.TypeFilters.filters.rarity}
          onToggle={() =>
            props.setItem(
              "TypeFilters",
              "filters",
              "rarity",
              "disabled",
              (d) => !d,
            )
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
            props.setItem("EquipmentFilters", "disabled", (d) => !d)
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
          onToggle={() => props.setItem("ReqFilters", "disabled", (d) => !d)}
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
          onToggle={() => props.setItem("MapFilters", "disabled", (d) => !d)}
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
          onToggle={() => props.setItem("MiscFilters", "disabled", (d) => !d)}
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
        <div class="divider my-0 opacity-50"></div>
      </Show>

      <For each={["skill", "enhancement", "runes", "implicit"] as const}>
        {(type) => (
          <Show when={props.item[type].length > 0}>
            <ModList modType={type} item={props.item} setItem={props.setItem} />
          </Show>
        )}
      </For>

      <Show when={props.item.explicit.length > 0}>
        <div class="divider my-0 opacity-50"></div>
        <ModList modType="explicit" item={props.item} setItem={props.setItem} />
      </Show>

      <div class="divider my-0 opacity-50"></div>

      <Show when={!props.ovPrice()}>
        <div class="w-full inline-flex justify-between">
          <div>
            <button
              onClick={async () => {
                props.getPrice();
              }}
              class="btn btn-xs btn-soft btn-outline w-16"
              classList={{
                "btn-disabled": props.timeout() > 0,
                "font-mono": props.timeout() > 0,
              }}
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
                  JSON.stringify(createQuery(props.item)),
              );

              enablePassthrough();
            }}
            class="btn btn-xs btn-soft btn-outline w-16"
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
