import { ErrorBoundary, Show, Suspense } from "solid-js";
import { autoUpdate } from "./UpdaterSettings";
import { ErrorMessage } from "../ErrorMessage";
import { UpdaterCore } from "./UpdaterCore";
import { passthrough } from "@/lib/Passthrough";

function Updater() {
  return (
    <Show when={autoUpdate()}>
      <ErrorBoundary
        fallback={(error, reset) => (
          <Show when={!passthrough()}>
            <ErrorMessage name="Updater " error={error} reset={reset} />
          </Show>
        )}
      >
        <Suspense>
          <UpdaterCore />
        </Suspense>
      </ErrorBoundary>
    </Show>
  );
}

export { Updater };
