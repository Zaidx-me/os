"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { OsAppShell, OsButton, OsStatusBar } from "@/components/os";
import type { WindowAppProps } from "@/lib/apps";

const STORAGE_KEY = "zaidos-notes";

interface Note {
  id: string;
  title: string;
  body: string;
  updated: number;
}

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function NotesApp({ setTitle }: WindowAppProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const loaded = loadNotes();
    if (loaded.length === 0) {
      const welcome: Note = {
        id: "welcome",
        title: "Welcome",
        body: "Welcome to Notes.\n\nYour notes are saved in this browser.",
        updated: Date.now(),
      };
      setNotes([welcome]);
      setActiveId("welcome");
      saveNotes([welcome]);
    } else {
      setNotes(loaded);
      setActiveId(loaded[0]!.id);
    }
    hydrated.current = true;
  }, []);

  const active = notes.find((n) => n.id === activeId) ?? null;

  useEffect(() => {
    setTitle?.(active ? `Notes — ${active.title}` : "Notes");
  }, [active, setTitle]);

  const updateActive = useCallback(
    (patch: Partial<Note>) => {
      if (!activeId) return;
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === activeId ? { ...n, ...patch, updated: Date.now() } : n,
        );
        saveNotes(next);
        return next;
      });
    },
    [activeId],
  );

  const addNote = useCallback(() => {
    const note: Note = {
      id: `note-${Date.now()}`,
      title: "Untitled",
      body: "",
      updated: Date.now(),
    };
    setNotes((prev) => {
      const next = [note, ...prev];
      saveNotes(next);
      return next;
    });
    setActiveId(note.id);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveNotes(next);
      setActiveId(next[0]?.id ?? null);
      return next;
    });
  }, []);

  return (
    <OsAppShell
      testId="app-content-notes"
      statusBar={
        <OsStatusBar>
          <span>{notes.length} notes</span>
          <span>{active ? active.title : "No note selected"}</span>
        </OsStatusBar>
      }
    >
      <div className="flex h-full min-h-0">
        <aside className="flex w-44 shrink-0 flex-col border-r border-zaid-border bg-zaid-surface2">
          <div className="flex items-center justify-between border-b border-zaid-border px-2 py-2">
            <span className="text-xs font-semibold text-zaid-text">Notes</span>
            <OsButton
              variant="icon"
              data-testid="notes-new"
              aria-label="New note"
              onClick={addNote}
            >
              <Plus size={16} />
            </OsButton>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {notes.map((note) => (
              <li
                key={note.id}
                className={`flex items-center gap-1 border-b border-zaid-border px-1 py-0.5 ${
                  activeId === note.id ? "bg-zaid-accent text-white" : "bg-zaid-surface2"
                }`}
              >
                <button
                  type="button"
                  data-testid={`notes-item-${note.id}`}
                  onClick={() => setActiveId(note.id)}
                  className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-xs"
                >
                  {note.title}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${note.title}`}
                  onClick={() => deleteNote(note.id)}
                  className="shrink-0 p-1 hover:text-zaid-danger"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {active ? (
          <div className="flex min-w-0 flex-1 flex-col bg-white p-3">
            <input
              data-testid="notes-title"
              value={active.title}
              onChange={(e) => updateActive({ title: e.target.value })}
              className="mb-2 border-b border-zaid-border bg-transparent text-lg font-semibold text-zaid-text outline-none"
            />
            <textarea
              data-testid="notes-body"
              value={active.body}
              onChange={(e) => updateActive({ body: e.target.value })}
              className="bevel-in min-h-0 flex-1 resize-none p-3 font-mono text-sm leading-relaxed text-zaid-text outline-none"
              placeholder="Start typing…"
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white text-sm text-zaid-muted">
            {hydrated.current ? "Create a note to get started." : "Loading…"}
          </div>
        )}
      </div>
    </OsAppShell>
  );
}

export default NotesApp;
