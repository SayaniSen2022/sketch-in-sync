import { useEffect, useRef, useState } from "react";
import { Copy, Share2, X } from "lucide-react";

const ShareButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const closeDialog = () => {
    setIsDialogOpen(false);
    requestAnimationFrame(() => shareButtonRef.current?.focus());
  };

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (!isDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements =
        dialogRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDialogOpen]);

  return (
    <>
      <button
        ref={shareButtonRef}
        type="button"
        className="absolute right-4 bottom-4 z-[150] flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-sm font-medium text-white shadow-xl transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        onClick={openDialog}
      >
        <Share2 size={18} aria-hidden="true" />
        Share
      </button>

      {isDialogOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={closeDialog}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
            aria-describedby="share-dialog-description"
            className="w-full max-w-sm rounded-lg border border-white/10 bg-neutral-800 p-5 text-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="share-dialog-title" className="text-lg font-semibold">
                  Share this board
                </h2>
                <p id="share-dialog-description" className="mt-2 text-sm text-neutral-300">
                  Live sharing will be available once collaboration is enabled.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close share dialog"
                className="cursor-pointer rounded p-1 text-neutral-300 hover:bg-neutral-700 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300"
                onClick={closeDialog}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-medium" htmlFor="share-link">
              Share link
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="share-link"
                type="text"
                value="Available when live sharing is enabled"
                disabled
                className="min-w-0 flex-1 rounded border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-400 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                className="flex cursor-not-allowed items-center gap-1 rounded border border-white/10 px-3 py-2 text-sm text-neutral-500"
              >
                <Copy size={16} aria-hidden="true" />
                Copy
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="cursor-pointer rounded bg-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-cyan-300"
                onClick={closeDialog}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default ShareButton;
