import { overviews, ts } from "@/lib/Overviews";
import { Item } from "./ParseItem";
import { Prices } from "./PriceWidget";
import { info } from "@tauri-apps/plugin-log";
import { createSignal, onMount } from "solid-js";

function StaticTimeAgo(timestamp: string) {
  // Start with an empty string or a generic fallback
  const [text, setText] = createSignal("");

  info(timestamp);

  onMount(() => {
    const past = new Date(timestamp).getTime();
    const diffSeconds = Math.floor((Date.now() - past) / 1000);

    if (diffSeconds < 60) {
      setText("just now");
    } else {
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) {
        setText(`${diffMinutes}m ago`);
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) {
          setText(`${diffHours}h ago`);
        } else {
          setText(`${Math.floor(diffHours / 24)}d ago`);
        }
      }
    }
  });

  return text();
}

const PriceCheck = (item: Item): Prices[] => {
  info(item.name.value);

  const itemO = overviews[item.name.value];
  if (itemO) {
    const maxCurr = itemO.maxVolumeCurrency;
    return [
      {
        amount:
          itemO.prices[
            maxCurr == "exalted"
              ? "exalted"
              : maxCurr == "chaos"
                ? "chaos"
                : "divine"
          ],
        currency: itemO.maxVolumeCurrency,
        listed: StaticTimeAgo(ts()),
      },
    ];
  }

  return [
    { amount: 5, currency: "chaos", listed: "1h ago" },
    { amount: 6, currency: "divine", listed: "3h ago" },
    { amount: 7, currency: "divine", listed: "1d ago" },
    { amount: 8, currency: "divine", listed: "12h ago" },
    { amount: 9, currency: "divine", listed: "10h ago" },
    { amount: 11, currency: "divine", listed: "just now" },
    { amount: 25, currency: "divine", listed: "1w ago" },
    { amount: 50, currency: "divine", listed: "1h ago" },
    { amount: 100, currency: "divine", listed: "1h ago" },
    { amount: 1, currency: "mirror", listed: "1h ago" },
  ];
};

export { PriceCheck };
