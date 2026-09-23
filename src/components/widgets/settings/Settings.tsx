import { ErrorBoundary, Show, Suspense } from "solid-js";
import { SettingsWidget } from "./SettingsWidget";
import { passthrough } from "@/lib/Passthrough";
import { ErrorMessage } from "@/components/ErrorMessage";

function Settings() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <Show when={!passthrough()}>
          <ErrorMessage name="SettingsWidget " error={error} reset={reset} />
        </Show>
      )}
    >
      <Suspense>
        <SettingsWidget />
      </Suspense>
    </ErrorBoundary>
  );
}

export { Settings };
