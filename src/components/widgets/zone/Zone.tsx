import { ErrorBoundary, Show, Suspense } from "solid-js";
import { passthrough } from "@/lib/Passthrough";
import { ZoneWidget } from "./ZoneWidget";
import { showZone } from "./ZoneSettings";
import { ErrorMessage } from "@/components/ErrorMessage";

function Zone() {
  return (
    <Show when={showZone()}>
      <ErrorBoundary
        fallback={(error, reset) => (
          <Show when={!passthrough()}>
            <ErrorMessage name="ZoneWidget " error={error} reset={reset} />
          </Show>
        )}
      >
        <Suspense>
          <ZoneWidget />
        </Suspense>
      </ErrorBoundary>
    </Show>
  );
}

export { Zone };
