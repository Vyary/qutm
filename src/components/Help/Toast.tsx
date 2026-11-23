import { info } from "@tauri-apps/plugin-log";

export function Toast(props: { title: string; description: string }) {
  return (
    <div class="toast">
      <div class="alert">
        <div>
          <div class="flex items-center justify-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>

            <div>
              <h3 class="text-sm font-semibold">
                {props.title ?? "Quick tour"}
              </h3>
              <p class="mt-1 text-xs leading-relaxed text-base-content/60">
                {props.description ??
                  "Learn where everything lives in under a minute."}
              </p>
            </div>
          </div>

          <div class="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              onClick={() => info("dismissed")}
            >
              Not now
            </button>
            <button
              type="button"
              class="btn btn-primary btn-xs"
              onClick={() => info("start")}
            >
              Show me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
