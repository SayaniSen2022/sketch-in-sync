import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";

export type CanvasTab = {
  id: string;
  title: string;
  isDefault: boolean;
};

type TabBarProps = {
  tabs: CanvasTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCreateTab: () => void;
  onRenameTab: (tabId: string, title: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTab: (tabId: string, destinationIndex: number) => void;
};

const DRAG_START_DISTANCE = 6;

export default function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCreateTab,
  onRenameTab,
  onCloseTab,
  onReorderTab,
}: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const tabBarRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    tabId: string;
    pointerId: number;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const beginRenaming = (tab: CanvasTab) => {
    setEditingTabId(tab.id);
    setDraftTitle(tab.title);
    requestAnimationFrame(() => titleInputRef.current?.select());
  };

  const finishRenaming = () => {
    if (!editingTabId) return;

    const title = draftTitle.trim();
    if (title) onRenameTab(editingTabId, title);
    setEditingTabId(null);
  };

  const finishDragging = () => {
    const drag = dragRef.current;
    if (!drag) return;

    dragRef.current = null;
    setDraggedTabId(null);

    if (drag.isDragging) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

  const handleLabelPointerDown = (event: React.PointerEvent<HTMLButtonElement>, tabId: string) => {
    if (event.button !== 0) return;

    dragRef.current = {
      tabId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLabelPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const movedDistance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.isDragging && movedDistance < DRAG_START_DISTANCE) return;

    if (!drag.isDragging) {
      drag.isDragging = true;
      setDraggedTabId(drag.tabId);
    }

    const tabBar = tabBarRef.current;
    if (!tabBar) return;

    const tabElements = Array.from(tabBar.querySelectorAll<HTMLElement>("[data-tab-id]"));
    const destinationIndex = tabElements.findIndex((tabElement) => {
      const bounds = tabElement.getBoundingClientRect();
      return event.clientX < bounds.left + bounds.width / 2;
    });
    const targetIndex = destinationIndex === -1 ? tabs.length - 1 : destinationIndex;

    onReorderTab(drag.tabId, targetIndex);
  };

  const handleLabelPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishDragging();
  };

  return (
    <nav
      ref={tabBarRef}
      aria-label="Canvas tabs"
      className="absolute z-[200] top-0 left-0 flex w-full items-center overflow-hidden border border-white/10 bg-neutral-950 text-white shadow-xl"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isEditing = tab.id === editingTabId;

        return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            className={`flex w-40 min-w-0 shrink items-center gap-1 border-r border-neutral-700 px-2 py-1 text-sm ${
              draggedTabId === tab.id
                ? "cursor-grabbing bg-neutral-500 opacity-60"
                : isActive
                  ? "bg-neutral-600"
                  : "hover:bg-neutral-700"
            }`}
          >
            {isEditing ? (
              <input
                ref={titleInputRef}
                aria-label="Tab name"
                className="w-24 rounded bg-neutral-900 px-1 outline-none ring-cyan-400 focus:ring-1"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={finishRenaming}
                onKeyDown={(event) => {
                  if (event.key === "Enter") finishRenaming();
                  if (event.key === "Escape") setEditingTabId(null);
                }}
              />
            ) : (
              <button
                type="button"
                className={`min-w-0 flex-1 touch-none truncate text-left ${
                  draggedTabId === tab.id ? "cursor-grabbing" : "cursor-grab"
                }`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (suppressClickRef.current) return;
                  onSelectTab(tab.id);
                }}
                onDoubleClick={() => {
                  if (!dragRef.current) beginRenaming(tab);
                }}
                onPointerDown={(event) => handleLabelPointerDown(event, tab.id)}
                onPointerMove={handleLabelPointerMove}
                onPointerUp={handleLabelPointerUp}
                onPointerCancel={finishDragging}
                title={`${tab.title} — double-click to rename`}
              >
                {tab.title}
              </button>
            )}
            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              title={`Close ${tab.title}`}
              className="shrink-0 cursor-pointer rounded p-0.5 text-neutral-300 hover:bg-neutral-500 hover:text-white"
              onClick={() => onCloseTab(tab.id)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        aria-label="New tab"
        title="New tab"
        className="shrink-0 cursor-pointer border-l border-neutral-700 p-1 text-neutral-300 hover:bg-neutral-700 hover:text-white"
        onClick={onCreateTab}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
