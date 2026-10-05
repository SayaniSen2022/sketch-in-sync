import { EllipsisVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  isCanvasDocument,
  isCanvasWorkspace,
  loadStoredDocument,
  loadStoredWorkspace,
  type CanvasDocument,
  type CanvasWorkspace,
  type StoredCanvasTab,
} from "@/canvas/scene/persistence";
import ExportMenuDetails from "./ExportMenuDetails";

type ExportMenuProps = {
  activeTabId: string;
  onImportTab: (tab: StoredCanvasTab, document: CanvasDocument) => void;
  onImportWorkspace: (
    workspace: CanvasWorkspace,
    documents: Record<string, CanvasDocument>,
  ) => void;
};

type ImportedFile =
  | { kind: "tab"; tab: StoredCanvasTab; document: CanvasDocument }
  | { kind: "workspace"; workspace: CanvasWorkspace; documents: Record<string, CanvasDocument> };

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

function parseImportedFile(value: unknown): ImportedFile {
  if (!isRecord(value) || value.exportVersion !== 1) {
    throw new Error("This file is not a supported Sketch in Sync export.");
  }

  if (isStoredCanvasTab(value.tab) && isCanvasDocument(value.document)) {
    return { kind: "tab", tab: value.tab, document: value.document };
  }

  if (isCanvasWorkspace(value.workspace) && isRecord(value.documents)) {
    const documents: Record<string, CanvasDocument> = {};

    for (const tab of value.workspace.tabs) {
      const document = value.documents[tab.id];
      if (!isCanvasDocument(document)) {
        throw new Error(`The export does not contain valid canvas data for “${tab.title}”.`);
      }
      documents[tab.id] = document;
    }

    return { kind: "workspace", workspace: value.workspace, documents };
  }

  throw new Error("The selected JSON does not contain a valid tab or workspace export.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredCanvasTab(value: unknown): value is StoredCanvasTab {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    typeof value.isDefault === "boolean"
  );
}

const ExportMenu = ({ activeTabId, onImportTab, onImportWorkspace }: ExportMenuProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openFilePicker = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const importedFile = parseImportedFile(JSON.parse(await file.text()) as unknown);

      if (importedFile.kind === "tab") {
        onImportTab(importedFile.tab, importedFile.document);
      } else {
        onImportWorkspace(importedFile.workspace, importedFile.documents);
      }

      setOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to open this file.");
      setOpen(false);
    }
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
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />
      {open && (
        <ExportMenuDetails
          onExportTab={exportTab}
          onExportWorkspace={exportWorkspace}
          onOpen={openFilePicker}
        />
      )}
      {error && (
        <p className="absolute right-0 bottom-full mb-2 w-64 text-xs text-red-300">{error}</p>
      )}
    </div>
  );
};

export default ExportMenu;
