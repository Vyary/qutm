import { ErrorBoundary, Show, Suspense } from "solid-js";
import { showInventory } from "./InventorySettings";
import { InventoryWidget } from "./InventoryWidget";
import { passthrough } from "@/lib/Passthrough";
import { ErrorMessage } from "@/components/ErrorMessage";

function Inventory() {
  return (
    <Show when={showInventory()}>
      <ErrorBoundary
        fallback={(error, reset) => (
          <Show when={!passthrough()}>
            <ErrorMessage name="Inventory " error={error} reset={reset} />
          </Show>
        )}
      >
        <Suspense>
          <InventoryWidget shortcut="F2" />
        </Suspense>
      </ErrorBoundary>
    </Show>
  );
}

export { Inventory };
