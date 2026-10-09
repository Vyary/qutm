import { overviews, ts } from "@/lib/Overviews";
import { Item } from "./ParseItem";
import { Prices } from "./PriceWidget";
import { createSignal, onMount } from "solid-js";
import { fetch } from "@tauri-apps/plugin-http";
import { info } from "@tauri-apps/plugin-log";
import { RateLimiter, updateTimes } from "./RateLimiter";

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

export interface PriceCheckResult {
  prices: Prices[];
  timeout: number;
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

const PriceCheck = async (
  item: Item,
  query: string,
): Promise<PriceCheckResult> => {
  const itemO = overviews[item.name.value];
  if (itemO) {
    const maxCurr = itemO.maxVolumeCurrency;
    return {
      prices: [
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
      ],
      timeout: 0,
    };
  }

  const rateLimit = RateLimiter();
  if (rateLimit) {
    return { prices: [], timeout: rateLimit };
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

  const ipLimits = searchReq.headers.get("x-rate-limit-ip");
  const ipState = searchReq.headers.get("x-rate-limit-ip-state");

  info(`rate limits: ${ipLimits} -> ${ipState}`);

  updateTimes(ipState ?? "0:10:0,0:60:0,0:300:0,0:21600:0");

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
    return { prices: prices, timeout: 0 };
  }

  return { prices: [], timeout: 0 };
};

export { PriceCheck };
