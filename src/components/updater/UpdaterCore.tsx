import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { createSignal, onMount, Show } from "solid-js";

function UpdaterCore() {
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [updateStatus, setUpdateStatus] = createSignal("");
  const [downloaded, setDownloaded] = createSignal(0);
  const [total, setTotal] = createSignal(0);

  const updateCheck = async () => {
    const update = await check();
    if (update) {
      setUpdateStatus(`New update available v${update.version}`);
      setIsUpdating(true);

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setTotal(event.data.contentLength || 0);
            break;
          case "Progress":
            setDownloaded(downloaded() + event.data.chunkLength);
            break;
          case "Finished":
            setUpdateStatus("Download finished. Installing...");
            break;
        }
      });

      setUpdateStatus("Update installed! Relaunching app...");
      await relaunch();
    }
  };

  onMount(() => updateCheck());

  return (
    <Show when={isUpdating()}>
      <div class="fixed bottom-50 right-7 z-100 w-72 bg-base-200/30 backdrop-blur-md rounded-2xl ring-1 ring-base-content/5 px-5 py-3">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm font-semibold text-base-content">
            {updateStatus()}
          </p>
        </div>
        <progress
          class="progress progress-primary w-full"
          value={downloaded()}
          max={total()}
        ></progress>
      </div>
    </Show>
  );
}

export { UpdaterCore };
