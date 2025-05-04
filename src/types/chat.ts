export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline";
  role: "student" | "teacher" | "staff";
  lastSeen?: string;
  // Add Profile properties to make User and Profile more compatible
  username?: string; 
  avatar_url?: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  status: "sent" | "pending" | "failed";
  attachments?: Attachment[];
  type?: "text" | "voice" | "emoji";
  isPinned?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "document" | "voice" | "other";
  url: string;
  size?: string;
  duration?: number; // Pour les messages vocaux (en secondes)
}

export interface Conversation {
  id: string;
  type: "private" | "group" | "channel";
  name: string;
  participants: User[];
  messages: Message[];
  unreadCount?: number;
  lastMessage?: Message;
  avatar?: string;
  pinnedMessages?: Message[];
  category?: "project" | "club" | "class" | "course" | "admin" | "other";
  visibility?: "private" | "public" | "moderated";
  createdBy?: string; // ID de l'utilisateur créateur
  created_by?: string; // Added for compatibility
  description?: string;
  chatbotEnabled?: boolean;
  isPinned?: boolean;
  // Add for compatibility with ConversationWithParticipants
  created_at?: string;
  updated_at?: string;
  avatar_url?: string;
  is_pinned?: boolean;
  chatbot_enabled?: boolean;
}

export interface UserState {
  currentUser: User;
  isConnected: boolean;
  lastSyncTime?: string;
}

export interface Call {
  id: string;
  conversationId: string;
  startTime: string;
  endTime?: string;
  participants: User[];
  status: "ongoing" | "ended" | "missed";
  initiatedBy: string;
  isVideo?: boolean;
}

// Interface pour les filtres et la recherche
export interface ConversationFilters {
  type?: "private" | "group" | "channel";
  category?: "project" | "club" | "class" | "course" | "admin" | "other";
  visibility?: "private" | "public" | "moderated";
  search?: string;
}
