import { passthrough } from "@/lib/Passthrough";
import { ErrorBoundary, JSX, Show, Suspense } from "solid-js";

export function Guard(props: {
  name: string;
  show: boolean;
  children: JSX.Element;
}) {
  return (
    <Show when={props.show}>
      <ErrorBoundary
        fallback={(error, reset) => (
          <Show when={!passthrough()}>
            <section class="flex flex-col gap-4 rounded-box border border-base-content/10 bg-base-200 p-4 select-none">
              <header class="flex items-center justify-between gap-4">
                <h3 class="text-xs font-semibold uppercase tracking-wider opacity-60">
                  {props.name}
                </h3>
                <span class="badge badge-error badge-sm font-semibold">
                  Error
                </span>
              </header>

              <div class="flex items-start gap-2 text-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="mt-0.5 h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span class="text-sm font-mono break-words min-w-0">
                  {String(error)}
                </span>
              </div>

              <button class="btn btn-soft btn-sm" onClick={() => reset()}>
                Restart
              </button>
            </section>
          </Show>
        )}
      >
        <Suspense>{props.children}</Suspense>
      </ErrorBoundary>
    </Show>
  );
}
