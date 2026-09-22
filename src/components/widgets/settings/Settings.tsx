import { ErrorBoundary, Show, Suspense } from "solid-js";
import { SettingsWidget } from "./SettingsWidget";
import { showSettings } from "./SettingsSettings";
import { passthrough } from "@/lib/Passthrough";
import { ErrorMessage } from "@/components/ErrorMessage";

function Settings() {
  return (
    <Show when={showSettings()}>
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
    </Show>
  );
}

export { Settings };
