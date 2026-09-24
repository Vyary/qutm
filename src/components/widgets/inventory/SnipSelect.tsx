import { createSignal, Show } from "solid-js";

export type Region = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

const [activeSelect, setActiveSelect] = createSignal(false);

function SnipSelect(props: { onSelect: (r: Region) => void }) {
  const [start, setStart] = createSignal<{ x: number; y: number } | null>(null);
  const [cur, setCur] = createSignal<{ x: number; y: number } | null>(null);

  const rect = () => {
    const s = start(),
      c = cur();
    if (!s || !c) return null;
    return {
      left: Math.min(s.x, c.x),
      top: Math.min(s.y, c.y),
      width: Math.abs(c.x - s.x),
      height: Math.abs(c.y - s.y),
    };
  };

  const reset = () => {
    setActiveSelect(false);
    setStart(null);
    setCur(null);
  };

  const onDown = (e: MouseEvent) => {
    setStart({ x: e.clientX, y: e.clientY });
    setCur({ x: e.clientX, y: e.clientY });
  };

  const onMove = (e: MouseEvent) => {
    if (start()) setCur({ x: e.clientX, y: e.clientY });
  };

  const onUp = (e: MouseEvent) => {
    const s = start();
    if (s) {
      props.onSelect({
        startX: s.x,
        startY: s.y,
        endX: e.clientX,
        endY: e.clientY,
      });
    }
    reset();
  };

  return (
    <Show when={activeSelect()}>
      <div
        class="fixed inset-0 z-50 cursor-crosshair bg-black/30 select-none"
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onKeyDown={(e) => e.key === "Escape" && reset()}
        tabindex={0}
        ref={(el) => queueMicrotask(() => el.focus())}
      >
        <Show when={rect()}>
          {(r) => (
            <div
              class="absolute border-2 border-primary bg-primary/20"
              style={{
                left: `${r().left}px`,
                top: `${r().top}px`,
                width: `${r().width}px`,
                height: `${r().height}px`,
              }}
            />
          )}
        </Show>
      </div>
    </Show>
  );
}

export { SnipSelect, activeSelect, setActiveSelect };
