import { createSignal, For, onSettled, Show } from "solid-js";
import { WidgetBase } from "../WidgetBase";
import { loadOverviews, overviewPrice } from "@/lib/Overviews";
import {
  getPrice,
  hasCategory,
  item,
  ovPrice,
  prices,
  sameBaseOverviews,
  scanItem,
  selectItemBase,
  setItem,
  timeout,
} from "./utils/PriceState";
import { ItemRenderer } from "./ItemRenderer";
import { createShortcut } from "@/lib/Shortcut";
import { loadMods } from "./utils/Mods";

export const [showPrice, setShowPrice] = createSignal(true);

export function Price() {
  createShortcut("itemScan", "Alt+D", false, scanItem);

  onSettled(() => {
    loadMods();
    loadOverviews();
  });

  return (
    <Show when={hasCategory()}>
      <WidgetBase
        name="price"
        defaultPos={{ x: 50, y: 170 }}
        defaultTransparency={85}
        transparencySlider
        extraPanel={item.MiscFilters.filters.identified?.value === false}
        extraChildren={
          <ItemPicker
            filteredOverviews={sameBaseOverviews()}
            chooseAction={selectItemBase}
          />
        }
      >
        <ItemRenderer
          item={item}
          setItem={setItem}
          prices={prices}
          timeout={timeout}
          getPrice={getPrice}
          ovPrice={ovPrice}
        />
      </WidgetBase>
    </Show>
  );
}

function ItemPicker(props: {
  filteredOverviews: overviewPrice[];
  chooseAction: (item: overviewPrice) => void;
}) {
  return (
    <div class="aura aura-dual">
      <div class="flex flex-col gap-1 bg-base-200 rounded-2xl">
        <For each={props.filteredOverviews} keyed={false}>
          {(item) => (
            <div
              class="cursor-pointer"
              onClick={() => props.chooseAction(item())}
            >
              <img src={item().image} class="w-10 h-12 object-contain" />
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
