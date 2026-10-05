type ExportMenuDetailsProps = {
  onExportTab: () => void;
  onExportWorkspace: () => void;
  onOpen: () => void;
};

const ExportMenuDetails = ({ onExportTab, onExportWorkspace, onOpen }: ExportMenuDetailsProps) => {
  return (
    <div className="absolute right-0 bottom-full z-210 mb-2 w-44 border border-white/10 bg-neutral-800 p-1 text-sm text-white shadow-xl">
      <button
        type="button"
        className="block w-full cursor-pointer px-2 py-1 text-left hover:bg-neutral-700"
        onClick={onExportTab}
      >
        Export Tab
      </button>
      <button
        type="button"
        className="block w-full cursor-pointer px-2 py-1 text-left hover:bg-neutral-700"
        onClick={onExportWorkspace}
      >
        Export Workspace
      </button>
      <button
        type="button"
        className="block w-full cursor-pointer px-2 py-1 text-left hover:bg-neutral-700"
        onClick={onOpen}
      >
        Open
      </button>
    </div>
  );
};

export default ExportMenuDetails;
