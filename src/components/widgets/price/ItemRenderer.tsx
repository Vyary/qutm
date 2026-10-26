import { Accessor, For, JSX, Show } from "solid-js";
import { produce, type SetStoreFunction } from "solid-js/store";
import {
  CLASSES,
  type Item,
  type MinMax,
  type Prices,
  type Toggleable,
} from "./utils/Types.ts";
import { openUrl } from "@tauri-apps/plugin-opener";
import { createQuery } from "./utils/CreateQuery.ts";
import { enablePassthrough } from "@/lib/Passthrough.ts";

interface ItemRendererProps {
  item: Item;
  setItem: SetStoreFunction<Item>;
  prices: Accessor<Prices[]>;
  timeout: Accessor<number>;
  getPrice: () => void;
}

type GroupType =
  | "TypeFilters"
  | "EquipmentFilters"
  | "ReqFilters"
  | "MapFilters"
  | "MiscFilters";

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
  key: keyof Item[T]["filters"] & string;
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
      class="flex gap-1 items-center justify-between"
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
  modType: "skill" | "enhancement" | "implicit" | "explicit";
  item: Item;
  setItem: SetStoreFunction<Item>;
}) {
  return (
    <div class="space-y-1">
      <For each={props.item[props.modType]}>
        {(mod, i) => (
          <div classList={{ "opacity-40": mod.disabled }}>
            <span class="flex items-center justify-between">
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
  { key: "identified", label: "Identified", color: "badge-error" },
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
  const isArmour = () =>
    CLASSES[props.item.TypeFilters.filters.category.value].type === "armour";
  const isWeapon = () =>
    CLASSES[props.item.TypeFilters.filters.category.value].type === "weapon";
  const isCurrency = () =>
    CLASSES[props.item.TypeFilters.filters.category.value].type === "currency";

  const isWaystone = () =>
    props.item.MapFilters.filters.bonus?.value.min ||
    props.item.MapFilters.filters.iir?.value.min ||
    props.item.MapFilters.filters.magicMonsters?.value.min ||
    props.item.MapFilters.filters.packsize?.value.min ||
    props.item.MapFilters.filters.rareMonsters?.value.min ||
    props.item.MapFilters.filters.revives?.value.min ||
    props.item.MapFilters.filters.tier?.value.min;

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

      <Show when={!isCurrency()}>
        <FilterRow
          label="Item Level: "
          group="TypeFilters"
          key="ilvl"
          item={props.item}
          setItem={props.setItem}
        />
      </Show>

      <Show when={!isWaystone() && !isCurrency()}>
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
          <Show when={isWeapon()}>
            <FilterRow
              label="Attack Speed: "
              group="EquipmentFilters"
              key="aps"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Critical Chance: "
              group="EquipmentFilters"
              key="crit"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="DPS: "
              group="EquipmentFilters"
              key="dps"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Physical DPS: "
              group="EquipmentFilters"
              key="pdps"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Elemental DPS: "
              group="EquipmentFilters"
              key="edps"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Spirit: "
              group="EquipmentFilters"
              key="spirit"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Reload Time: "
              group="EquipmentFilters"
              key="reloadTime"
              item={props.item}
              setItem={props.setItem}
            />
          </Show>
          <Show when={isArmour()}>
            <FilterRow
              label="Armour: "
              group="EquipmentFilters"
              key="ar"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Evasion: "
              group="EquipmentFilters"
              key="ev"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Energy Shield: "
              group="EquipmentFilters"
              key="es"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Runic Ward: "
              group="EquipmentFilters"
              key="ward"
              item={props.item}
              setItem={props.setItem}
            />
            <FilterRow
              label="Block: "
              group="EquipmentFilters"
              key="block"
              item={props.item}
              setItem={props.setItem}
            />
          </Show>
        </FilterGroup>
      </Show>

      <Show when={!isWaystone() && !isCurrency()}>
        <FilterGroup
          label="Requirements"
          disabled={props.item.ReqFilters.disabled}
          onToggle={() => props.setItem("ReqFilters", "disabled", (d) => !d)}
        >
          <FilterRow
            label="Level: "
            group="ReqFilters"
            key="lvl"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Strength: "
            group="ReqFilters"
            key="str"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Dexterity: "
            group="ReqFilters"
            key="dex"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Intelligence: "
            group="ReqFilters"
            key="int"
            item={props.item}
            setItem={props.setItem}
          />
        </FilterGroup>
      </Show>

      <Show when={isWaystone()}>
        <FilterGroup
          label="Map Filters"
          disabled={props.item.MapFilters.disabled}
          onToggle={() => props.setItem("MapFilters", "disabled", (d) => !d)}
        >
          <FilterRow
            label="Tier: "
            group="MapFilters"
            key="tier"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Revives: "
            group="MapFilters"
            key="revives"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Item Rarity: "
            group="MapFilters"
            key="iir"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Pack Size: "
            group="MapFilters"
            key="packsize"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Monster Rarity: "
            group="MapFilters"
            key="rareMonsters"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Monster Effectiveness: "
            group="MapFilters"
            key="magicMonsters"
            item={props.item}
            setItem={props.setItem}
          />
          <FilterRow
            label="Drop Chance: "
            group="MapFilters"
            key="bonus"
            item={props.item}
            setItem={props.setItem}
          />
        </FilterGroup>
      </Show>

      <Show
        when={
          props.item.skill.length > 0 ||
          props.item.enhancement.length > 0 ||
          props.item.implicit.length > 0
        }
      >
        <div class="divider my-0 opacity-50"></div>
      </Show>

      <Show when={props.item.skill.length > 0}>
        <ModList modType="skill" item={props.item} setItem={props.setItem} />
      </Show>

      <Show when={props.item.enhancement.length > 0}>
        <ModList
          modType="enhancement"
          item={props.item}
          setItem={props.setItem}
        />
      </Show>

      <Show when={props.item.implicit.length > 0}>
        <ModList modType="implicit" item={props.item} setItem={props.setItem} />
      </Show>

      <Show when={props.item.explicit.length > 0}>
        <div class="divider my-0 opacity-50"></div>
        <ModList modType="explicit" item={props.item} setItem={props.setItem} />
      </Show>

      <div class="divider my-0 opacity-50"></div>

      <div class="w-full inline-flex justify-between">
        <div>
          <button
            onClick={async () => {
              props.getPrice();
            }}
            class="btn btn-xs btn-soft"
            classList={{
              "btn-disabled": props.timeout() > 0,
              "font-mono": props.timeout() > 0,
            }}
          >
            {props.timeout() > 0
              ? `${(props.timeout() / 1000).toFixed(1)}s`
              : "Recheck price"}
          </button>
        </div>
        <button
          onClick={async () => {
            await openUrl(
              "https://www.pathofexile.com/trade2/search/poe2/Forbidden%20Rites?q=" +
                JSON.stringify(createQuery(props.item)),
            );

            enablePassthrough();
          }}
          class="btn btn-xs btn-soft"
        >
          Trade
        </button>
      </div>

      <For each={props.prices()}>
        {(p) => (
          <div class="flex justify-between px-1">
            <span class="">
              {p.amount >= 1 ? p.amount : p.amount.toFixed(4)} {p.currency}
            </span>
            <span>{p.listed}</span>
          </div>
        )}
      </For>
    </div>
  );
}
