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
};

export default function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCreateTab,
  onRenameTab,
  onCloseTab,
}: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <nav
      aria-label="Canvas tabs"
      className="absolute z-[200] top-0 left-0 flex w-full items-center overflow-x-auto border border-white/10 bg-neutral-800 text-white shadow-xl"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isEditing = tab.id === editingTabId;

        return (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-2 py-1 border-r border-neutral-800 text-sm ${
              isActive ? "bg-neutral-600" : "hover:bg-neutral-700"
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
                className="max-w-36 truncate text-left"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSelectTab(tab.id)}
                onDoubleClick={() => beginRenaming(tab)}
                title={`${tab.title} — double-click to rename`}
              >
                {tab.title}
              </button>
            )}
            {!tab.isDefault && (
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                title={`Close ${tab.title}`}
                className="rounded p-0.5 text-neutral-300 hover:bg-neutral-500 hover:text-white"
                onClick={() => onCloseTab(tab.id)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        aria-label="New tab"
        title="New tab"
        className="rounded p-1 text-neutral-300 hover:bg-neutral-700 hover:text-white"
        onClick={onCreateTab}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
