import { useCallback, useEffect, useRef, useState } from "react";
import Canvas from "@/components/Canvas";
import type { CanvasHistory } from "@/canvas/CanvasEngine";
import CloseTabModal from "@/components/CloseTabModal";
import ImportWorkspaceModal from "@/components/ImportWorkspaceModal";
import TabBar, { type CanvasTab } from "@/components/TabBar";
import {
  saveCanvasDocument,
  type CanvasDocument,
  type CanvasWorkspace,
  clearStoredDocument,
  loadStoredWorkspace,
  saveStoredWorkspace,
  type StoredCanvasTab,
} from "@/canvas/scene/persistence";

function createTab(title: string, isDefault = false): CanvasTab {
  return { id: crypto.randomUUID(), title, isDefault };
}

function App() {
  const [workspace, setWorkspace] = useState(() => loadStoredWorkspace());
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);
  const [pendingWorkspaceImport, setPendingWorkspaceImport] = useState<{
    workspace: CanvasWorkspace;
    documents: Record<string, CanvasDocument>;
  } | null>(null);
  const [replacingWorkspace, setReplacingWorkspace] = useState(false);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const tabHistoriesRef = useRef(new Map<string, CanvasHistory>());
  const tabs: CanvasTab[] = workspace.tabs;
  const activeTabId = workspace.activeTabId;

  useEffect(() => {
    saveStoredWorkspace(tabs, activeTabId);
  }, [tabs, activeTabId]);

  const createNewTab = () => {
    const tab = createTab(`Untitled ${tabs.length + 1}`);
    setWorkspace({ tabs: [...tabs, tab], activeTabId: tab.id });
  };

  const renameTab = (tabId: string, title: string) => {
    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      tabs: currentWorkspace.tabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab)),
    }));
  };

  const reorderTab = (tabId: string, destinationIndex: number) => {
    setWorkspace((currentWorkspace) => {
      const sourceIndex = currentWorkspace.tabs.findIndex((tab) => tab.id === tabId);
      if (sourceIndex === -1) return currentWorkspace;

      const clampedDestination = Math.max(
        0,
        Math.min(destinationIndex, currentWorkspace.tabs.length - 1),
      );
      if (sourceIndex === clampedDestination) return currentWorkspace;

      const nextTabs = [...currentWorkspace.tabs];
      const [tab] = nextTabs.splice(sourceIndex, 1);
      nextTabs.splice(clampedDestination, 0, tab);

      return { ...currentWorkspace, tabs: nextTabs };
    });
  };

  const importTab = (importedTab: StoredCanvasTab, document: CanvasDocument) => {
    const tab = createTab(importedTab.title);
    saveCanvasDocument(document, tab.id);
    setWorkspace((currentWorkspace) => ({
      tabs: [...currentWorkspace.tabs, tab],
      activeTabId: tab.id,
    }));
  };

  const requestWorkspaceImport = (
    importedWorkspace: CanvasWorkspace,
    documents: Record<string, CanvasDocument>,
  ) => {
    setPendingWorkspaceImport({ workspace: importedWorkspace, documents });
  };

  const closeTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((candidate) => candidate.id === tabId);
      if (!tab) return;

      const closingIndex = tabs.findIndex((candidate) => candidate.id === tabId);
      const remainingTabs = tabs.filter((candidate) => candidate.id !== tabId);
      clearStoredDocument(tabId);
      tabHistoriesRef.current.delete(tabId);

      if (remainingTabs.length === 0) {
        const replacement = createTab("Untitled 1", true);
        setWorkspace({ tabs: [replacement], activeTabId: replacement.id });
        return;
      }

      setWorkspace({
        tabs: remainingTabs,
        activeTabId:
          activeTabId === tabId
            ? remainingTabs[Math.min(closingIndex, remainingTabs.length - 1)].id
            : activeTabId,
      });
    },
    [activeTabId, tabs],
  );

  const confirmCloseTab = () => {
    if (!pendingCloseTabId) return;
    if (pendingCloseTabId === activeTabId) {
      setClosingTabId(pendingCloseTabId);
    } else {
      closeTab(pendingCloseTabId);
    }
    setPendingCloseTabId(null);
  };

  const handleDiscardReady = useCallback(() => {
    if (closingTabId) {
      closeTab(closingTabId);
      setClosingTabId(null);
      return;
    }

    if (!replacingWorkspace || !pendingWorkspaceImport) return;

    tabs.forEach((tab) => clearStoredDocument(tab.id));
    pendingWorkspaceImport.workspace.tabs.forEach((tab) => {
      saveCanvasDocument(pendingWorkspaceImport.documents[tab.id], tab.id);
    });
    saveStoredWorkspace(
      pendingWorkspaceImport.workspace.tabs,
      pendingWorkspaceImport.workspace.activeTabId,
    );
    tabHistoriesRef.current.clear();
    setWorkspace(pendingWorkspaceImport.workspace);
    setWorkspaceRevision((revision) => revision + 1);
    setPendingWorkspaceImport(null);
    setReplacingWorkspace(false);
  }, [closingTabId, closeTab, pendingWorkspaceImport, replacingWorkspace, tabs]);

  const pendingCloseTab = tabs.find((tab) => tab.id === pendingCloseTabId);

  return (
    <div className="relative">
      <Canvas
        key={`${activeTabId}:${workspaceRevision}`}
        tabId={activeTabId}
        discardOnUnmount={closingTabId === activeTabId || replacingWorkspace}
        onDiscardReady={handleDiscardReady}
        getInitialHistory={() => tabHistoriesRef.current.get(activeTabId)}
        onHistoryChange={(history) => tabHistoriesRef.current.set(activeTabId, history)}
        onImportTab={importTab}
        onImportWorkspace={requestWorkspaceImport}
      />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={(tabId) =>
          setWorkspace((currentWorkspace) => ({ ...currentWorkspace, activeTabId: tabId }))
        }
        onCreateTab={createNewTab}
        onRenameTab={renameTab}
        onCloseTab={setPendingCloseTabId}
        onReorderTab={reorderTab}
      />
      {pendingCloseTab && (
        <CloseTabModal
          tabTitle={pendingCloseTab.title}
          onConfirm={confirmCloseTab}
          onCancel={() => setPendingCloseTabId(null)}
        />
      )}
      {pendingWorkspaceImport && !replacingWorkspace && (
        <ImportWorkspaceModal
          onConfirm={() => setReplacingWorkspace(true)}
          onCancel={() => setPendingWorkspaceImport(null)}
        />
      )}
    </div>
  );
}

export default App;
