"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Folder } from "lucide-react";
import { OsButton, OsInput } from "@/components/os";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { setModalOpen } from "@/lib/hotkeys";
import {
  selectActiveDialog,
  useDialogStore,
  type DialogState,
} from "@/lib/os/dialog";
import { useFilesystemStore } from "@/store/filesystem";

export { osAlert, osConfirm, osOpenDialog, osPrompt } from "@/lib/os/dialog";

export default function OsDialogHost() {
  const active = useDialogStore(selectActiveDialog);
  const dismiss = useDialogStore((s) => s.dismiss);
  const panelRef = useRef<HTMLDivElement>(null);
  const [promptValue, setPromptValue] = useState("");
  const [browseDir, setBrowseDir] = useState<string | null>(null);
  const fs = useFilesystemStore((s) => s.fs);

  useFocusTrap(panelRef, active !== null);

  useEffect(() => {
    setModalOpen(active !== null);
    return () => setModalOpen(false);
  }, [active]);

  useEffect(() => {
    if (active?.kind === "prompt") setPromptValue(active.defaultValue ?? "");
    if (active?.kind === "open") {
      setBrowseDir(active.directory ?? fs.pwd());
    }
  }, [active, fs]);

  const openEntries = useMemo(() => {
    if (active?.kind !== "open" || browseDir === null) return [];
    return fs.ls(browseDir) ?? [];
  }, [active, browseDir, fs]);

  if (active === null) return null;

  return (
    <>
      <div
        data-testid="os-dialog-backdrop"
        className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-[2px]"
        onClick={() => {
          if (active.kind === "alert") dismiss(undefined);
          else if (active.kind === "confirm") dismiss(false);
          else dismiss(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        ref={panelRef}
        data-testid="os-dialog"
        role="dialog"
        aria-label={active.title}
        className="window-glass hairline rofi-launcher fixed left-1/2 top-[20%] z-[90] w-[min(92vw,24rem)] -translate-x-1/2 p-4 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-sm font-semibold text-zaid-text">{active.title}</h2>

        {active.kind === "open" ? (
          <div data-testid="os-dialog-open-list" className="mb-4 max-h-48 overflow-y-auto">
            <p className="mb-2 truncate text-[10px] text-zaid-muted">{browseDir}</p>
            {browseDir !== fs.pwd() && browseDir !== "/" && (
              <button
                type="button"
                className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-zaid-surface2"
                onClick={() => {
                  const parent = browseDir!.replace(/\/[^/]+$/, "") || "/";
                  setBrowseDir(parent);
                }}
              >
                <Folder size={14} className="text-zaid-muted" /> ..
              </button>
            )}
            {openEntries.map((entry) => (
              <button
                key={entry.name}
                type="button"
                data-testid={`os-dialog-entry-${entry.name}`}
                onClick={() => {
                  if (entry.type === "dir") {
                    setBrowseDir(`${browseDir}/${entry.name}`.replace("//", "/"));
                  } else {
                    dismiss(entry.name);
                  }
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-zaid-surface2"
              >
                {entry.type === "dir" ? (
                  <Folder size={14} className="text-zaid-accent" />
                ) : (
                  <FileText size={14} className="text-zaid-accent" />
                )}
                {entry.name}
              </button>
            ))}
          </div>
        ) : active.kind === "prompt" ? (
          <div className="mb-4">
            <p className="mb-3 text-xs text-zaid-muted">{active.message}</p>
            <OsInput
              data-testid="os-dialog-prompt-input"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") dismiss(promptValue);
              }}
            />
          </div>
        ) : (
          <p className="mb-4 text-xs leading-relaxed text-zaid-muted">{active.message}</p>
        )}

        <DialogActions dialog={active} promptValue={promptValue} onDismiss={dismiss} />
      </div>
    </>
  );
}

function DialogActions({
  dialog,
  promptValue,
  onDismiss,
}: {
  dialog: DialogState;
  promptValue: string;
  onDismiss: (value: unknown) => void;
}) {
  if (dialog.kind === "alert") {
    return (
      <div className="flex justify-end">
        <OsButton data-testid="os-dialog-ok" variant="primary" onClick={() => onDismiss(undefined)}>
          OK
        </OsButton>
      </div>
    );
  }

  if (dialog.kind === "confirm") {
    return (
      <div className="flex justify-end gap-2">
        <OsButton data-testid="os-dialog-cancel" variant="ghost" onClick={() => onDismiss(false)}>
          Cancel
        </OsButton>
        <OsButton data-testid="os-dialog-ok" variant="primary" onClick={() => onDismiss(true)}>
          OK
        </OsButton>
      </div>
    );
  }

  if (dialog.kind === "prompt") {
    return (
      <div className="flex justify-end gap-2">
        <OsButton data-testid="os-dialog-cancel" variant="ghost" onClick={() => onDismiss(null)}>
          Cancel
        </OsButton>
        <OsButton
          data-testid="os-dialog-ok"
          variant="primary"
          onClick={() => onDismiss(promptValue)}
        >
          OK
        </OsButton>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <OsButton data-testid="os-dialog-cancel" variant="ghost" onClick={() => onDismiss(null)}>
        Cancel
      </OsButton>
    </div>
  );
}
