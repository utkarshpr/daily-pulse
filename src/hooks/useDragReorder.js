import { useRef, useState } from 'react';

// Returns a set of handlers for HTML5 drag-and-drop reorder.
// Caller passes the list and an onReorder(newList) callback.
export function useDragReorder(items, onReorder, key = 'id') {
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  const onDragStart = (id) => (e) => {
    dragId.current = id;
    try { e.dataTransfer.effectAllowed = 'move'; } catch { /* ignore */ }
  };

  const onDragOver = (id) => (e) => {
    e.preventDefault();
    if (dragOverId !== id) setDragOverId(id);
  };

  const onDragLeave = () => setDragOverId(null);

  const onDrop = (id) => (e) => {
    e.preventDefault();
    const from = dragId.current;
    dragId.current = null;
    setDragOverId(null);
    if (!from || from === id) return;
    const fromIdx = items.findIndex((x) => x[key] === from);
    const toIdx = items.findIndex((x) => x[key] === id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
  };

  const onDragEnd = () => {
    dragId.current = null;
    setDragOverId(null);
  };

  return { onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, dragOverId };
}
