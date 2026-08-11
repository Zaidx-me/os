"use client";

import { useState } from "react";
import Image from "next/image";
import { OsAppShell, OsPanel, OsStatusBar } from "@/components/os";
import { PICTURES } from "@/content/pictures";
import type { WindowAppProps } from "@/lib/apps";

export function PhotosApp(_props: WindowAppProps) {
  const [selected, setSelected] = useState(PICTURES[0]!);

  return (
    <OsAppShell
      testId="app-content-photos"
      statusBar={
        <OsStatusBar>
          <span>Pictures — {PICTURES.length} photos</span>
          <span>{selected.title}</span>
        </OsStatusBar>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-4 p-4 lg:flex-row">
        <OsPanel className="relative min-h-64 flex-1 overflow-hidden p-0">
          <Image
            data-testid="photos-viewer"
            src={selected.src}
            alt={selected.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <p className="text-lg font-semibold text-white">{selected.title}</p>
            {selected.location && (
              <p className="text-sm text-white/80">{selected.location}</p>
            )}
          </div>
        </OsPanel>

        <div className="grid grid-cols-3 gap-2 lg:w-56 lg:grid-cols-2">
          {PICTURES.map((photo) => (
            <button
              key={photo.id}
              type="button"
              data-testid={`photos-thumb-${photo.id}`}
              onClick={() => setSelected(photo)}
              className={`relative aspect-square overflow-hidden rounded-xl transition-all ${
                selected.id === photo.id
                  ? "ring-2 ring-zaid-accent ring-offset-2"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.title}
                fill
                className="object-cover"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      </div>
    </OsAppShell>
  );
}

export default PhotosApp;
