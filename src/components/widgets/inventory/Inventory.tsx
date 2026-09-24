import { ErrorBoundary, Show, Suspense } from "solid-js";
import { showInventory } from "./InventorySettings";
import { InventoryWidget } from "./InventoryWidget";
import { passthrough } from "@/lib/Passthrough";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SnipSelect } from "@/components/widgets/inventory/SnipSelect";
import { setStashArea } from "./StashScanner";
import { info } from "@tauri-apps/plugin-log";

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
          <SnipSelect
            onSelect={(r) => {
              setStashArea(r);
              info(JSON.stringify(r));
            }}
          />
        </Suspense>
      </ErrorBoundary>
    </Show>
  );
}

export { Inventory };
