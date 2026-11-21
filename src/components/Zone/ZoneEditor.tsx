import { passthrough } from "@/lib/Passthrough";
import { createSignal, For, Show } from "solid-js";
import { towns } from "./utils/Towns";
import { changeZone, tracker } from "./utils/Tracker";
import {
  addGroup,
  addTask,
  changeAction,
  changeDoneQuote,
  changePreq,
  changePrev,
  changeReward,
  changeTask,
  deleteGroup,
  guide,
  moveGroupDown,
  moveGroupUp,
  moveTaskDown,
  moveTaskUp,
  removeTask,
} from "./utils/Guide";
import { RTL } from "../Settings/Settings";

export const [openEditor, setOpenEditor] = createSignal(false);

export function ZoneEditor() {
  return (
    <Show when={openEditor()}>
      <div
        class={{
          hidden: passthrough(),
        }}
      >
        <div class="px-4 py-3 max-h-200 overflow-y-auto flex flex-col gap-4 min-w-170">
          <div class="sticky top-0 z-10 backdrop-blur-md flex gap-4 items-center justify-between px-2 py-1">
            <div class="flex flex-col">
              <span class="text-sm font-semibold truncate">
                {towns[tracker.zone]}
              </span>
              <span class="text-xs text-base-content/50 font-mono">
                {tracker.zone}
              </span>
            </div>

            <div class="form-control w-full px-1 py-2">
              <input
                type="text"
                list="towns"
                placeholder="Select Zone..."
                class="input input-sm input-bordered w-full max-w-xs"
                onChange={(e) => changeZone(e.currentTarget.value)}
              />

              <datalist id="towns">
                <For each={Object.entries(towns)}>
                  {([tc, tn]) => <option value={tc}>{tn}</option>}
                </For>
              </datalist>
            </div>
          </div>

          <For each={guide[tracker.zone]?.guide}>
            {(z, i) => {
              const [showConfirm, setShowConfirm] = createSignal(false);
              return (
                <div class="bg-base-200/40 rounded-xl border border-base-content/5 p-4 flex flex-col gap-4 card">
                  <div class="flex items-end gap-2">
                    <div class="flex flex-col gap-1 text-base-content/40">
                      <button
                        class="hover:text-base-content transition-colors"
                        onClick={() => moveGroupUp(tracker.zone, i())}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        class="hover:text-base-content transition-colors"
                        onClick={() => moveGroupDown(tracker.zone, i())}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>

                    <div class="flex flex-1 items-center gap-2">
                      <label class="flex flex-col flex-1 gap-1">
                        <span class="text-[10px] uppercase tracking-wider text-base-content/50 font-semibold pl-1">
                          Previous
                        </span>
                        <input
                          type="text"
                          value={z.prev || ""}
                          placeholder="None"
                          class="input input-sm input-bordered bg-transparent focus:bg-base-100 transition-colors w-full"
                          onChange={(e) =>
                            changePrev(tracker.zone, i(), e.target.value)
                          }
                        />
                      </label>
                      <label class="flex flex-col flex-1 gap-1">
                        <span class="text-[10px] uppercase tracking-wider text-base-content/50 font-semibold pl-1">
                          Prerequisite
                        </span>
                        <input
                          type="text"
                          value={z.preq ? z.preq.join(", ") : ""}
                          placeholder="None"
                          class="input input-sm input-bordered bg-transparent focus:bg-base-100 transition-colors w-full"
                          onChange={(e) =>
                            changePreq(tracker.zone, i(), e.target.value)
                          }
                        />
                      </label>
                    </div>

                    <div>
                      <button
                        class="btn btn-circle btn-ghost btn-sm text-base-content/40 hover:text-error hover:bg-error/10"
                        onClick={() => setShowConfirm((s) => !s)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                      <ConfirmModal
                        class={{ hidden: !showConfirm() }}
                        text="Group"
                      >
                        <button
                          class="btn btn-sm btn-ghost"
                          onClick={() => setShowConfirm(false)}
                        >
                          Cancel
                        </button>
                        <button
                          class="btn btn-sm btn-error"
                          onClick={() => deleteGroup(tracker.zone, i())}
                        >
                          Delete
                        </button>
                      </ConfirmModal>
                    </div>
                  </div>

                  <ul class="flex flex-col gap-2 text-xs">
                    <For each={z.tasks}>
                      {(t, j) => {
                        const [showConfirm, setShowConfirm] =
                          createSignal(false);

                        return (
                          <li>
                            <div class="flex items-center gap-4">
                              <div class="flex flex-col gap-1 text-base-content/40">
                                <button
                                  class="hover:text-base-content"
                                  onClick={() =>
                                    moveTaskUp(tracker.zone, i(), j())
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  >
                                    <path d="m18 15-6-6-6 6" />
                                  </svg>
                                </button>
                                <button
                                  class="hover:text-base-content"
                                  onClick={() =>
                                    moveTaskDown(tracker.zone, i(), j())
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  >
                                    <path d="m6 9 6 6 6-6" />
                                  </svg>
                                </button>
                              </div>

                              <div class="flex flex-col flex-1">
                                <input
                                  type="text"
                                  value={t.text}
                                  placeholder="Task description..."
                                  class="input w-full"
                                  onChange={(e) =>
                                    changeTask(
                                      tracker.zone,
                                      i(),
                                      j(),
                                      e.target.value,
                                    )
                                  }
                                />
                                <input
                                  type="text"
                                  value={t.reward || ""}
                                  placeholder="Reward..."
                                  class="input input-xs w-full"
                                  onChange={(e) =>
                                    changeReward(
                                      tracker.zone,
                                      i(),
                                      j(),
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div class="flex flex-col">
                                <select
                                  class="select select-xs max-w-30 bg-base-300"
                                  value={
                                    t.show ? "Show" : t.hide ? "Hide" : "Action"
                                  }
                                  onInput={(e) => {
                                    changeAction(
                                      tracker.zone,
                                      i(),
                                      j(),
                                      e.currentTarget.value as "Show" | "Hide",
                                    );
                                  }}
                                >
                                  <option disabled selected>
                                    Action
                                  </option>
                                  <option>Show</option>
                                  <option>Hide</option>
                                </select>
                                <input
                                  type="text"
                                  value={t.condition || ""}
                                  placeholder="Condition..."
                                  class="input"
                                  onChange={(e) =>
                                    changeDoneQuote(
                                      tracker.zone,
                                      i(),
                                      j(),
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div>
                                <button
                                  class="btn btn-circle btn-ghost btn-sm text-base-content/40 hover:text-error hover:bg-error/10"
                                  onClick={() => setShowConfirm((s) => !s)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  >
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                  </svg>
                                </button>
                                <ConfirmModal
                                  class={[{ hidden: !showConfirm() }]}
                                  text="Task"
                                >
                                  <button
                                    class="btn btn-sm btn-ghost"
                                    onClick={() => setShowConfirm(false)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    class="btn btn-sm btn-error"
                                    onClick={() =>
                                      removeTask(tracker.zone, i(), j())
                                    }
                                  >
                                    Delete
                                  </button>
                                </ConfirmModal>
                              </div>
                            </div>
                          </li>
                        );
                      }}
                    </For>
                  </ul>

                  <button
                    class="btn btn-sm btn-dash w-full border-base-content/20 hover:border-base-content/40 text-base-content/60 hover:text-base-content hover:bg-base-100/50  mt-2"
                    onClick={() => addTask(tracker.zone, i())}
                  >
                    + Add Task
                  </button>
                </div>
              );
            }}
          </For>

          <Show when={tracker.zone}>
            <div class="p-2">
              <button
                class="btn btn-dash border-base-content/30 text-base-content/70 hover:text-base-content hover:bg-base-content/5 w-full"
                onClick={() => addGroup(tracker.zone)}
              >
                + Add Zone Group
              </button>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

function ConfirmModal(props: any) {
  return (
    <div
      class={[
        "absolute left-1/2 -translate-x-1/2 card w-96 card-sm shadow-sm bg-base-300 z-10",
        props.class,
      ]}
    >
      <div class="card-body">
        <h2 class="card-title">Delete {props.text}</h2>
        <p>Are you sure you want to delete this {props.text.toLowerCase()}?</p>
        <div class="justify-end card-actions">{props.children}</div>
      </div>
    </div>
  );
}

export function ZoneEditorSettings() {
  return (
    <Show when={!passthrough()}>
      <div
        class={[
          "absolute top-1 h-5 w-1 cursor-pointer p-1 text-base-content/50 hover:text-base-content transition-colors z-11",
          { "right-7": !RTL() },
          { "left-1": RTL() },
        ]}
        onMouseDown={() => setOpenEditor((s) => !s)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-square-pen-icon lucide-square-pen"
        >
          <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
        </svg>
      </div>
    </Show>
  );
}
