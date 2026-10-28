import { useCallback, useRef, useState } from 'react';

const EDGE = 80; // px from the top/bottom of the window where dragging scrolls the page
const STEP = 14;

/**
 * Drag-to-reorder for a vertical list. Works with mouse, touch and pen
 * (pointer events, so phones work too) and with the keyboard: focus the
 * handle and use the up/down arrows. The list reorders live while dragging
 * and `onReorder(ids)` runs once, on drop, with the new order.
 *
 * @param {string[]} ids  Ids of the items that can be dragged, in their current order.
 * @param {(ids: string[]) => void} onReorder
 */
export function useSortable(ids, onReorder) {
  const [drag, setDrag] = useState(null); // { id, order } while dragging
  const nodes = useRef(new Map());

  const register = useCallback(
    (id) => (el) => {
      if (el) nodes.current.set(id, el);
      else nodes.current.delete(id);
    },
    [],
  );

  /** Items sorted by the live drag order (unknown items keep their place at the end). */
  const arrange = (items) => {
    if (!drag) return items;
    const pos = new Map(drag.order.map((id, i) => [id, i]));
    return [...items].sort((a, b) => (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity));
  };

  const move = (id, delta) => {
    const i = ids.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = [...ids];
    next.splice(i, 1);
    next.splice(j, 0, id);
    onReorder(next);
  };

  const handleProps = (id) => ({
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDrag({ id, order: ids });
    },
    onPointerMove: (e) => {
      if (drag?.id !== id) return;
      const y = e.clientY;
      if (y < EDGE) window.scrollBy(0, -STEP);
      else if (y > window.innerHeight - EDGE) window.scrollBy(0, STEP);
      setDrag((d) => {
        if (!d) return d;
        // New position = how many of the other items have their middle above the pointer.
        let target = 0;
        for (const other of d.order) {
          if (other === d.id) continue;
          const r = nodes.current.get(other)?.getBoundingClientRect();
          if (r && y > r.top + r.height / 2) target++;
        }
        if (d.order.indexOf(d.id) === target) return d;
        const order = d.order.filter((x) => x !== d.id);
        order.splice(target, 0, d.id);
        return { ...d, order };
      });
    },
    onPointerUp: () => {
      if (drag?.id !== id) return;
      const changed = drag.order.some((x, i) => x !== ids[i]);
      setDrag(null);
      if (changed) onReorder(drag.order);
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown: (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        move(id, e.key === 'ArrowUp' ? -1 : 1);
      }
    },
    style: { touchAction: 'none' },
  });

  return { draggingId: drag?.id ?? null, register, arrange, handleProps };
}
