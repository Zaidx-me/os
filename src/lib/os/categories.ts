import type { AppId } from "@/components/ui/AppIcon";

export interface AppCategory {
  id: string;
  label: string;
  apps: AppId[];
}

/** Launcher grouping — order defines sidebar / section order. */
export const APP_CATEGORIES: readonly AppCategory[] = [
  {
    id: "system",
    label: "System",
    apps: ["terminal", "browser", "files", "settings", "monitor", "editor"],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    apps: ["about", "projects", "skills", "experience", "resume", "contact", "articles"],
  },
  {
    id: "tools",
    label: "Tools",
    apps: ["calculator", "notes", "chat"],
  },
  {
    id: "media",
    label: "Media",
    apps: ["music", "photos"],
  },
  {
    id: "games",
    label: "Games",
    apps: ["chess", "snake"],
  },
] as const;

export function categoryForApp(appId: AppId): AppCategory | undefined {
  return APP_CATEGORIES.find((cat) => cat.apps.includes(appId));
}
