import { ErrorMessage } from "@/components/ErrorMessage";
import { passthrough } from "@/lib/Passthrough";
import { ErrorBoundary, Show, Suspense } from "solid-js";
import { PriceWidget } from "./PriceWidget";
import { showPrice } from "./PriceSettings";

function Price() {
  return (
    <Show when={showPrice()}>
      <ErrorBoundary
        fallback={(error, reset) => (
          <Show when={!passthrough()}>
            <ErrorMessage name="Inventory " error={error} reset={reset} />
          </Show>
        )}
      >
        <Suspense>
          <PriceWidget />
        </Suspense>
      </ErrorBoundary>
    </Show>
  );
}

export { Price };
