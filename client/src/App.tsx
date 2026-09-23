import { useCallback, useEffect, useState } from "react";
import Canvas from "@/components/Canvas";
import CloseTabModal from "@/components/CloseTabModal";
import TabBar, { type CanvasTab } from "@/components/TabBar";
import {
  clearStoredDocument,
  loadStoredWorkspace,
  saveStoredWorkspace,
} from "@/canvas/scene/persistence";

function createTab(title: string, isDefault = false): CanvasTab {
  return { id: crypto.randomUUID(), title, isDefault };
}

function App() {
  const [workspace, setWorkspace] = useState(() => loadStoredWorkspace());
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);
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

  const closeTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((candidate) => candidate.id === tabId);
      if (!tab) return;

      const closingIndex = tabs.findIndex((candidate) => candidate.id === tabId);
      const remainingTabs = tabs.filter((candidate) => candidate.id !== tabId);
      clearStoredDocument(tabId);

      if (remainingTabs.length === 0) {
        const replacement = createTab("Untitled-1", true);
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
    if (!closingTabId) return;

    closeTab(closingTabId);
    setClosingTabId(null);
  }, [closingTabId, closeTab]);

  const pendingCloseTab = tabs.find((tab) => tab.id === pendingCloseTabId);

  return (
    <div className="relative">
      <Canvas
        key={activeTabId}
        tabId={activeTabId}
        discardOnUnmount={closingTabId === activeTabId}
        onDiscardReady={handleDiscardReady}
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
      />
      {pendingCloseTab && (
        <CloseTabModal
          tabTitle={pendingCloseTab.title}
          onConfirm={confirmCloseTab}
          onCancel={() => setPendingCloseTabId(null)}
        />
      )}
    </div>
  );
}

export default App;
