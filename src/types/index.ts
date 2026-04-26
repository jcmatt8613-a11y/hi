export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  followers: number;
  following: number;
  pingStreak: number;
  lastPingDate: string;
  joinedDate: string;
  isVerified: boolean;
}

export interface Ping {
  id: string;
  userId: string;
  user: User;
  text: string;
  image?: string;
  likes: number;
  replies: number;
  reposts: number;
  isLiked: boolean;
  isReposted: boolean;
  createdAt: string;
  isPulse?: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'reply' | 'follow' | 'repost';
  fromUser: User;
  ping?: Ping;
  createdAt: string;
  isRead: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  pingCount: number;
}
