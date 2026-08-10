import type { LucideProps } from "lucide-react";
import {
  AtSign,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleUser,
  Code,
  Code2,
  Cog,
  Command,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Folder,
  FolderGit2,
  Gamepad2,
  GitBranch,
  Globe,
  GraduationCap,
  Grid3x3,
  Heart,
  Home,
  KeyRound,
  Link,
  Mail,
  Maximize2,
  Menu,
  MessageSquare,
  MessagesSquare,
  Minimize2,
  Minus,
  Monitor,
  Paintbrush,
  PanelLeft,
  Power,
  Printer,
  Rocket,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Square,
  SquareTerminal,
  Star,
  Terminal,
  User,
  Wand2,
  Wrench,
  X,
} from "lucide-react";

/**
 * Icons available through the ZaidOS <Icon /> wrapper.
 * Union is derived from the map so callers get autocomplete + type errors
 * for unknown names. All icons render with `currentColor` (lucide default),
 * so they inherit the accent/text color of whatever parent they sit in.
 *
 * NOTE: lucide-react 1.x removed brand icons (Github/Linkedin/etc.) — social
 * links in the waybar should use AtSign/Link or a dedicated brand glyph, not
 * a lucide import.
 */
const ICONS = {
  "at-sign": AtSign,
  award: Award,
  "book-open": BookOpen,
  bot: Bot,
  "brain-circuit": BrainCircuit,
  briefcase: Briefcase,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "circle-user": CircleUser,
  "code-2": Code2,
  code: Code,
  cog: Cog,
  command: Command,
  copy: Copy,
  cpu: Cpu,
  download: Download,
  "external-link": ExternalLink,
  "file-down": FileDown,
  "file-text": FileText,
  folder: Folder,
  "folder-git": FolderGit2,
  "gamepad-2": Gamepad2,
  "git-branch": GitBranch,
  globe: Globe,
  "graduation-cap": GraduationCap,
  "grid-3x3": Grid3x3,
  heart: Heart,
  home: Home,
  "key-round": KeyRound,
  link: Link,
  mail: Mail,
  "maximize-2": Maximize2,
  menu: Menu,
  "message-square": MessageSquare,
  "messages-square": MessagesSquare,
  "minimize-2": Minimize2,
  minus: Minus,
  monitor: Monitor,
  paintbrush: Paintbrush,
  "panel-left": PanelLeft,
  power: Power,
  printer: Printer,
  rocket: Rocket,
  search: Search,
  send: Send,
  settings: Settings,
  "sliders-horizontal": SlidersHorizontal,
  sparkles: Sparkles,
  square: Square,
  "square-terminal": SquareTerminal,
  star: Star,
  terminal: Terminal,
  user: User,
  "wand-2": Wand2,
  wrench: Wrench,
  x: X,
} as const;

export type IconName = keyof typeof ICONS;

export type IconProps = Omit<LucideProps, "ref"> & {
  name: IconName;
  /** Render size in px. Defaults to 16 (waybar/titlebar density). */
  size?: number;
};

/**
 * Thin typed wrapper around lucide-react. Decorative by default
 * (aria-hidden) so icon-only buttons must set their own accessible name;
 * pass aria-hidden={false} + aria-label when the icon is informative.
 */
export function Icon({ name, size = 16, ...rest }: IconProps) {
  const Cmp = ICONS[name];
  return <Cmp size={size} aria-hidden {...rest} />;
}
