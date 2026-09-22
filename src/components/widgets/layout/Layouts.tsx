import { ErrorBoundary, Show, Suspense } from "solid-js";
import { LayoutWidget } from "./LayoutWidget";
import { passthrough } from "@/lib/Passthrough";
import { ErrorMessage } from "@/components/ErrorMessage";
import { showLayout } from "./LayoutSettings";

function Layouts() {
  return (
    <Show when={showLayout()}>
      <ErrorBoundary
        fallback={(error, reset) => (
          <Show when={!passthrough()}>
            <ErrorMessage name="LayoutWidget " error={error} reset={reset} />
          </Show>
        )}
      >
        <Suspense>
          <LayoutWidget />
        </Suspense>
      </ErrorBoundary>
    </Show>
  );
}

export { Layouts };
