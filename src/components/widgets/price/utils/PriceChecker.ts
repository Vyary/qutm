import { checkOverviews, overviews, ts } from "@/lib/Overviews";
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
  const past = Date.parse(timestamp);
  if (Number.isNaN(past)) return "";

  const s = Math.floor((Date.now() - past) / 1000);
  if (s < 60) return "just now";

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  return `${Math.floor(h / 24)}d ago`;
}

export const OverviewsPrice = async (item: Item): Promise<Prices[]> => {
  let s = performance.now();
  await checkOverviews();
  info(`checking overviews took: ${(performance.now() - s).toFixed(2)}ms`);
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
        listed: StaticTimeAgo(new Date(ts()).toISOString()),
      },
    ];
  }

  return [];
};

const PriceCheck = async (query: string): Promise<PriceCheckResult> => {
  let s = performance.now();
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

  info(`search request took: ${(performance.now() - s).toFixed(2)}ms`);

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
  info(`search result took: ${(performance.now() - s).toFixed(2)}ms`);

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
