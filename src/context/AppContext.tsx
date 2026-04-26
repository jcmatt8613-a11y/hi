import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, Ping, Notification, Conversation } from '../types';
import { currentUser, samplePings, sampleNotifications, sampleConversations } from '../data/sampleData';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  user: User;
  setUser: (user: User) => void;
  pings: Ping[];
  addPing: (text: string, image?: string) => void;
  toggleLike: (pingId: string) => void;
  toggleRepost: (pingId: string) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  unreadNotifCount: number;
  conversations: Conversation[];
  sendMessage: (convId: string, text: string) => void;
  isQuickPingOpen: boolean;
  setQuickPingOpen: (open: boolean) => void;
  isCreateOpen: boolean;
  setCreateOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(currentUser);
  const [pings, setPings] = useState<Ping[]>(samplePings);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [conversations, setConversations] = useState<Conversation[]>(sampleConversations);
  const [isQuickPingOpen, setQuickPingOpen] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const addPing = useCallback((text: string, image?: string) => {
    const newPing: Ping = {
      id: uuidv4(),
      userId: user.id,
      user,
      text,
      image,
      likes: 0,
      replies: 0,
      reposts: 0,
      isLiked: false,
      isReposted: false,
      createdAt: new Date().toISOString(),
    };
    setPings(prev => [newPing, ...prev]);

    setUser(prev => {
      const now = new Date();
      const last = prev.lastPingDate ? new Date(prev.lastPingDate) : null;
      const isToday = last && last.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = last && last.toDateString() === yesterday.toDateString();

      let newStreak = prev.pingStreak;
      if (isToday) {
        // Already posted today — streak stays the same
      } else if (isYesterday) {
        newStreak = prev.pingStreak + 1;
      } else {
        newStreak = 1;
      }

      return {
        ...prev,
        pingStreak: newStreak,
        lastPingDate: now.toISOString(),
      };
    });
  }, [user]);

  const toggleLike = useCallback((pingId: string) => {
    setPings(prev => prev.map(p => {
      if (p.id !== pingId) return p;
      return {
        ...p,
        isLiked: !p.isLiked,
        likes: p.isLiked ? p.likes - 1 : p.likes + 1,
      };
    }));
  }, []);

  const toggleRepost = useCallback((pingId: string) => {
    setPings(prev => prev.map(p => {
      if (p.id !== pingId) return p;
      return {
        ...p,
        isReposted: !p.isReposted,
        reposts: p.isReposted ? p.reposts - 1 : p.reposts + 1,
      };
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const sendMessage = useCallback((convId: string, text: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id !== convId) return conv;
      const newMsg = {
        id: uuidv4(),
        senderId: user.id,
        text,
        createdAt: new Date().toISOString(),
      };
      return {
        ...conv,
        messages: [...conv.messages, newMsg],
        lastMessage: text,
        lastMessageTime: new Date().toISOString(),
      };
    }));
  }, [user.id]);

  return (
    <AppContext.Provider value={{
      user, setUser,
      pings, addPing, toggleLike, toggleRepost,
      notifications, markNotificationRead, unreadNotifCount,
      conversations, sendMessage,
      isQuickPingOpen, setQuickPingOpen,
      isCreateOpen, setCreateOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
