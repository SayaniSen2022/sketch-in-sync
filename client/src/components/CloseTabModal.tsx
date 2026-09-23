import { useEffect, useRef } from "react";

type CloseTabModalProps = {
  tabTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function CloseTabModal({ tabTitle, onConfirm, onCancel }: CloseTabModalProps) {
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
        aria-labelledby="close-tab-title"
        aria-describedby="close-tab-message"
        className="w-full max-w-sm border border-white/10 bg-neutral-800 p-5 text-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
      >
        <h2 id="close-tab-title" className="text-lg font-semibold">
          Close {tabTitle}?
        </h2>
        <p id="close-tab-message" className="mt-2 text-sm text-neutral-300">
          Are you sure you want to close the tab? All your changes will be lost.
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
            Confirm
          </button>
        </div>
      </section>
    </div>
  );
}
