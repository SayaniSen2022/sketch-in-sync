import { useEffect, useRef } from "react";

type ImportWorkspaceModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ImportWorkspaceModal({ onConfirm, onCancel }: ImportWorkspaceModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onCancel}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="import-workspace-title"
        aria-describedby="import-workspace-message"
        className="w-full max-w-sm border border-white/10 bg-neutral-800 p-5 text-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
      >
        <h2 id="import-workspace-title" className="text-lg font-semibold">
          Replace workspace?
        </h2>
        <p id="import-workspace-message" className="mt-2 text-sm text-neutral-300">
          Opening this workspace will replace all current tabs and their canvas data.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            className="bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bg-red-600 px-3 py-1.5 text-sm hover:bg-red-500"
            onClick={onConfirm}
          >
            Replace
          </button>
        </div>
      </section>
    </div>
  );
}
