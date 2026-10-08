import { overviews, ts } from "@/lib/Overviews";
import { Item } from "./ParseItem";
import { Prices } from "./PriceWidget";
import { createSignal, onMount } from "solid-js";
import { fetch } from "@tauri-apps/plugin-http";

export interface Listing {
  indexed: string;
  price: {
    amount: number;
    currency: string;
  };
  fee: number;
}

export interface SearchItem {
  listing: Listing;
}

export interface SearchResponse {
  result: SearchItem[];
}

export interface SearchResult {
  id: string;
  complexity: number;
  result: string[];
  total: number;
  inexact: boolean;
}

function StaticTimeAgo(timestamp: string) {
  const [text, setText] = createSignal("");

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

const PriceCheck = async (item: Item, query: string): Promise<Prices[]> => {
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

  const searchReq = await fetch(
    "https://www.pathofexile.com/api/trade2/search/poe2/Forbidden%20Rites",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: query,
    },
  );

  const sqData: SearchResult = await searchReq.json();

  const searchRes = await fetch(
    "https://www.pathofexile.com/api/trade2/fetch/" +
      sqData.result.slice(0, 10).join(","),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const srData: SearchResponse = await searchRes.json();

  const prices = srData?.result?.map((r) => {
    return {
      amount: r.listing.price.amount,
      currency: r.listing.price.currency,
      listed: StaticTimeAgo(r.listing.indexed),
    };
  });

  if (prices?.length) {
    return prices;
  }

  return [];
};

export { PriceCheck };
