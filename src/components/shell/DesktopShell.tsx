"use client";

import dynamic from "next/dynamic";
import ContextMenu from "@/components/wm/ContextMenu";
import DesktopIcons from "@/components/wm/DesktopIcons";
import Wallpaper from "@/components/wm/Wallpaper";
import Waybar from "@/components/wm/Waybar";
import Dock from "@/components/wm/Dock";
import { WorkspaceView } from "@/components/wm/WorkspaceView";
import OsServices from "@/components/os/OsServices";

/** Overlays — code-split; not needed for first paint. */
const Launcher = dynamic(() => import("@/components/wm/Launcher"), {
  ssr: false,
});
const Switcher = dynamic(() => import("@/components/wm/Switcher"), {
  ssr: false,
});

/**
 * Full Hyprland-style desktop shell (hidden on mobile via page.tsx branch).
 */
export default function DesktopShell() {
  return (
    <>
      <Wallpaper />
      <DesktopIcons />
      <WorkspaceView />
      <Waybar />
      <Dock />
      <ContextMenu />
      <Launcher />
      <Switcher />
      <OsServices />
    </>
  );
}
