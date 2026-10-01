import { EllipsisVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  loadStoredDocument,
  loadStoredWorkspace,
  type StoredCanvasTab,
} from "@/canvas/scene/persistence";
import ExportMenuDetails from "./ExportMenuDetails";

type ExportMenuProps = {
  activeTabId: string;
};

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getTabFilename(tab: StoredCanvasTab): string {
  const title = tab.title
    .trim()
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, " ");

  return `${title || "untitled"}.json`;
}

const ExportMenu = ({ activeTabId }: ExportMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const exportTab = () => {
    const workspace = loadStoredWorkspace();
    const tab = workspace.tabs.find((item) => item.id === activeTabId);
    if (!tab) return;

    downloadJson(
      {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        tab,
        document: loadStoredDocument(activeTabId),
      },
      getTabFilename(tab),
    );
    setOpen(false);
  };

  const exportWorkspace = () => {
    const workspace = loadStoredWorkspace();
    const documents = Object.fromEntries(
      workspace.tabs.map((tab) => [tab.id, loadStoredDocument(tab.id)]),
    );

    downloadJson(
      {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        workspace,
        documents,
      },
      "sketch-workspace.json",
    );
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative text-white flex items-center">
      <button
        type="button"
        aria-label="Export options"
        aria-expanded={open}
        title="Export options"
        className="cursor-pointer rounded p-0.5 text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
        onClick={() => setOpen((previous) => !previous)}
      >
        <EllipsisVertical size={18} aria-hidden="true" />
      </button>
      {open && <ExportMenuDetails onExportTab={exportTab} onExportWorkspace={exportWorkspace} />}
    </div>
  );
};

export default ExportMenu;
