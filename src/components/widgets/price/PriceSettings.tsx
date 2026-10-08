import { createSignal, onMount, Show } from "solid-js";
import { store } from "@/lib/Store";
import { scanItemAction } from "./PriceWidget";
import { Shortcut } from "@/components/Shortcut";

const [showPrice, setShowPrice] = createSignal(false);

function PriceSettings() {
  onMount(async () => setShowPrice((await store.get("showPrice")) ?? false));

  return (
    <>
      <div class="flex items-center justify-between">
        <span
          class="cursor-pointer text-sm"
          onClick={async () => {
            const isEnabled = !showPrice();
            setShowPrice(isEnabled);
            await store.set("showPrice", isEnabled);
            await store.save();
          }}
        >
          <div class="flex flex-col">
            <span class="text-sm font-medium">Price</span>
            <span class="text-xs text-base-content/50">Check Item Price</span>
          </div>
        </span>
        <input
          type="checkbox"
          checked={showPrice()}
          onClick={async () => {
            const isEnabled = !showPrice();
            setShowPrice(isEnabled);
            await store.set("showPrice", isEnabled);
            await store.save();
          }}
          class="toggle toggle-sm toggle-success"
        />
      </div>
      <Show when={showPrice()}>
        <Shortcut
          name="Price Item Scan Shortcut"
          action={scanItemAction()}
          alt={true}
          defaultKey="D"
        />
      </Show>
    </>
  );
}

export { PriceSettings, showPrice, setShowPrice };
