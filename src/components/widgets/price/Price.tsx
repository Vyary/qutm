import { ErrorMessage } from "@/components/ErrorMessage";
import { passthrough } from "@/lib/Passthrough";
import { ErrorBoundary, Show, Suspense } from "solid-js";
import { PriceWidget } from "./PriceWidget";

function Price() {
  return (
    <Show when={true}>
      <ErrorBoundary
        fallback={(error, reset) => (
          <Show when={!passthrough()}>
            <ErrorMessage name="Inventory " error={error} reset={reset} />
          </Show>
        )}
      >
        <Suspense>
          <PriceWidget shortcut="Alt+D" />
        </Suspense>
      </ErrorBoundary>
    </Show>
  );
}

export { Price };
