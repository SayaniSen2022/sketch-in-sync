import { useState } from "react";
import Canvas from "@/components/Canvas";
import CloseTabModal from "@/components/CloseTabModal";
import TabBar, { type CanvasTab } from "@/components/TabBar";

function createTab(title: string, isDefault = false): CanvasTab {
  return { id: crypto.randomUUID(), title, isDefault };
}

function App() {
  const [tabs, setTabs] = useState<CanvasTab[]>(() => [createTab("Untitled 1", true)]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id);
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);

  const createNewTab = () => {
    const tab = createTab(`Untitled ${tabs.length + 1}`);
    setTabs([...tabs, tab]);
    setActiveTabId(tab.id);
  };

  const renameTab = (tabId: string, title: string) => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab)),
    );
  };

  const closeTab = (tabId: string) => {
    const tab = tabs.find((candidate) => candidate.id === tabId);
    if (!tab) return;

    const closingIndex = tabs.findIndex((candidate) => candidate.id === tabId);
    const remainingTabs = tabs.filter((candidate) => candidate.id !== tabId);

    if (remainingTabs.length === 0) {
      const replacement = createTab("Untitled 1", true);
      setTabs([replacement]);
      setActiveTabId(replacement.id);
      return;
    }

    setTabs(remainingTabs);
    if (activeTabId === tabId) {
      setActiveTabId(remainingTabs[Math.min(closingIndex, remainingTabs.length - 1)].id);
    }
  };

  const confirmCloseTab = () => {
    if (!pendingCloseTabId) return;
    closeTab(pendingCloseTabId);
    setPendingCloseTabId(null);
  };

  const pendingCloseTab = tabs.find((tab) => tab.id === pendingCloseTabId);

  return (
    <div className="relative">
      <Canvas />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
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
