"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";

import { OsAppShell, OsButton, OsInput, OsStatusBar } from "@/components/os";
import type { WindowAppProps } from "@/lib/apps";
import { bumpFilesystem, useFilesystemStore } from "@/store/filesystem";

export function EditorApp({ setTitle }: WindowAppProps) {
  const fs = useFilesystemStore((s) => s.fs);
  const [path, setPath] = useState("~/README.md");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [dirty, setDirty] = useState(false);
  const loadedPath = useRef<string | null>(null);

  const loadFile = useCallback(
    (target: string) => {
      const res = fs.cat(target);
      if (!res.ok) {
        setStatus(res.reason === "missing" ? "File not found" : "Not a file");
        return;
      }
      setPath(target);
      setContent(res.lines.join("\n"));
      setDirty(false);
      setStatus("");
      loadedPath.current = target;
      setTitle?.(`Editor — ${target}`);
    },
    [fs, setTitle],
  );

  useEffect(() => {
    if (loadedPath.current === null) {
      loadFile("~/README.md");
    }
  }, [loadFile]);

  const save = useCallback(() => {
    const err = fs.write(path, content);
    if (err) {
      setStatus(err);
      return;
    }
    bumpFilesystem();
    setDirty(false);
    setStatus("Saved");
    window.setTimeout(() => setStatus(""), 1500);
  }, [content, fs, path]);

  return (
    <OsAppShell
      testId="app-content-editor"
      statusBar={
        <OsStatusBar>
          <span>{dirty ? "Modified" : "Saved"}</span>
          <span>{status || path}</span>
        </OsStatusBar>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-zaid-border bg-zaid-surface2 px-3 py-2">
        <span className="text-xs font-semibold text-zaid-text">Editor</span>
        <OsInput
          data-testid="editor-path"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadFile(path);
          }}
          className="min-w-0 flex-1"
        />
        <OsButton data-testid="editor-save" variant="primary" onClick={save}>
          <Save size={12} />
          Save
        </OsButton>
      </div>
      <textarea
        data-testid="editor-content"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setDirty(true);
        }}
        spellCheck={false}
        className="bevel-in m-2 min-h-0 flex-1 resize-none p-3 font-mono text-sm leading-relaxed text-zaid-text outline-none"
      />
      </div>
    </OsAppShell>
  );
}

export default EditorApp;
