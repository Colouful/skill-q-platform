"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AdminSortableListItem = {
  id: string;
  title: string;
  subtitle?: string;
};

function SortableRow<T extends AdminSortableListItem>({
  item,
  index,
  total,
  onMove,
  renderActions,
}: {
  item: T;
  index: number;
  total: number;
  onMove: (id: string, direction: -1 | 1) => void;
  renderActions?: (item: T) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "flex items-center justify-between gap-3 border-2 border-[var(--pixel-border)] px-2 py-1",
        isDragging ? "bg-[var(--pixel-cyan)]/10 shadow-[4px_4px_0_0_var(--pixel-border)] opacity-90" : "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm border-2 border-[var(--pixel-border)] text-[var(--pixel-muted)] transition hover:bg-[var(--pixel-cyan)]/10 hover:text-[var(--pixel-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pixel-cyan)]/40"
          aria-label={`拖拽排序 ${item.title}`}
          style={{ touchAction: "none" }}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0">
          <p className="text-sm text-[var(--pixel-fg)]">{item.title}</p>
          {item.subtitle ? (
            <p className="text-xs text-[var(--pixel-muted)]">{item.subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {renderActions ? renderActions(item) : null}
        <Button
          type="button"
          variant="outline"
          className="h-8 border-2 border-[var(--pixel-border)] px-2"
          disabled={index === 0}
          onClick={() => onMove(item.id, -1)}
        >
          上移
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 border-2 border-[var(--pixel-border)] px-2"
          disabled={index === total - 1}
          onClick={() => onMove(item.id, 1)}
        >
          下移
        </Button>
      </div>
    </div>
  );
}

export function AdminSortableList<T extends AdminSortableListItem>({
  items,
  emptyText,
  onChange,
  renderActions,
}: {
  items: T[];
  emptyText: string;
  onChange: (items: T[]) => void;
  renderActions?: (item: T) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function moveByDirection(id: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    onChange(arrayMove(items, index, nextIndex));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    onChange(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return (
      <div className="rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-2">
        <p className="text-xs text-[var(--pixel-muted)]">{emptyText}</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-2">
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              onMove={moveByDirection}
              renderActions={renderActions}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
