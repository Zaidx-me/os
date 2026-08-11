import { create } from "zustand";

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  time: number;
  read: boolean;
}

interface NotificationStore {
  items: NotificationItem[];
  toasts: NotificationItem[];
  push: (title: string, body?: string) => void;
  dismissToast: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

let seq = 0;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  items: [],
  toasts: [],
  push: (title, body) => {
    const item: NotificationItem = {
      id: `ntf-${++seq}`,
      title,
      body,
      time: Date.now(),
      read: false,
    };
    set((s) => ({
      items: [item, ...s.items].slice(0, 50),
      toasts: [item, ...s.toasts].slice(0, 4),
    }));
    window.setTimeout(() => {
      get().dismissToast(item.id);
    }, 4500);
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
  clearAll: () => set({ items: [], toasts: [] }),
}));

export function pushNotification(title: string, body?: string): void {
  useNotificationStore.getState().push(title, body);
}

export const selectNotifications = (s: NotificationStore) => s.items;
export const selectToasts = (s: NotificationStore) => s.toasts;
export const selectUnreadCount = (s: NotificationStore) =>
  s.items.filter((n) => !n.read).length;
