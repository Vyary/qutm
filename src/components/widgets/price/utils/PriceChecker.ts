import { checkOverviews, overviews, ts } from "@/lib/Overviews";
import { createSignal, onMount } from "solid-js";
import { fetch } from "@tauri-apps/plugin-http";
import { debug, info } from "@tauri-apps/plugin-log";
import { RateLimiter, updateTimes } from "./RateLimiter";
import { Item, Prices } from "./Types";

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
  let s = performance.now();
  await checkOverviews();
  info(`checking overviews took: ${(performance.now() - s).toFixed(2)}ms`);
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

  s = performance.now();
  const rateLimit = RateLimiter();
  if (rateLimit) {
    return { prices: [], timeout: rateLimit };
  }
  info(`ratelimiter took: ${(performance.now() - s).toFixed(2)}ms`);

  s = performance.now();
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

  info(`search req took: ${(performance.now() - s).toFixed(2)}ms`);

  const ipLimits = searchReq.headers.get("x-rate-limit-ip");
  const ipState = searchReq.headers.get("x-rate-limit-ip-state");

  debug(`rate limits: ${ipLimits} -> ${ipState}`);

  s = performance.now();
  updateTimes(ipState ?? "0:10:0,0:60:0,0:300:0,0:21600:0");
  info(`updateTimes took: ${(performance.now() - s).toFixed(2)}ms`);

  const sqData: SearchResult = await searchReq.json();

  if (!sqData.result) {
    return { prices: [], timeout: 0 };
  }

  s = performance.now();
  const searchRes = await fetch(
    "https://www.pathofexile.com/api/trade2/fetch/" +
      sqData?.result?.slice(0, 10).join(","),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  info(`searchRes took: ${(performance.now() - s).toFixed(2)}ms`);

  const srData: SearchResponse = await searchRes.json();

  s = performance.now();
  const prices = srData?.result?.map((r) => {
    return {
      amount: r.listing.price.amount,
      currency: r.listing.price.currency,
      listed: StaticTimeAgo(r.listing.indexed),
    };
  });
  info(`price conversion took: ${(performance.now() - s).toFixed(2)}ms`);

  if (prices?.length) {
    return { prices: prices, timeout: 0 };
  }

  return { prices: [], timeout: 0 };
};

export { PriceCheck };
