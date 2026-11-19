import { For, Show } from "solid-js";
import { WidgetBase } from "../WidgetBase";

export function Price() {
  return (
    <Show when={item.TypeFilters.filters.category.value}>
      <WidgetBase
        name="price"
        defaultPos={{ x: 50, y: 170 }}
        defaultTransparency={85}
        transparencySlider={true}
        extraPanel={item.MiscFilters.filters.identified?.value === false}
        extraChildren={<ItemPicker />}
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

function ItemPicker() {
  return (
    <div class="aura aura-dual">
      <div class="flex flex-col gap-1 bg-base-200 rounded-2xl">
        <For each={eligible()}>
          {(i) => (
            <div
              class="cursor-pointer"
              onClick={() => {
                setItem(
                  produce((s) => {
                    s.type ??= {
                      value: s.name!.value.replace("Exceptional ", ""),
                      disabled: false,
                    };
                    s.type = {
                      value: s.name!.value.replace("Exceptional ", ""),
                      disabled: false,
                    };
                    s.name ??= { value: i.name, disabled: false };
                    s.name = { value: i.name, disabled: false };
                  }),
                );
                getPrice();
              }}
            >
              <img src={i.image} class="w-10 h-12 object-contain" />
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
