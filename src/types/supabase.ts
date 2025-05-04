
export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  full_name: string | null;
  role: 'student' | 'teacher' | 'staff';
  created_at: string;
  updated_at: string;
  last_seen: string;
  status: 'online' | 'offline';
};

export type Conversation = {
  id: string;
  type: 'private' | 'group' | 'channel';
  name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: 'project' | 'club' | 'class' | 'course' | 'admin' | 'other';
  visibility?: 'private' | 'public' | 'moderated';
  description?: string | null;
  avatar_url?: string | null;
  chatbot_enabled?: boolean;
  is_pinned?: boolean;
};

export type ConversationParticipant = {
  conversation_id: string;
  user_id: string;
  joined_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'failed';
  type?: 'text' | 'voice' | 'emoji';
  is_pinned?: boolean;
};

export type Attachment = {
  id: string;
  message_id: string;
  name: string;
  type: 'image' | 'document' | 'voice' | 'other';
  url: string;
  size?: string;
  duration?: number;
};

export type Call = {
  id: string;
  conversation_id: string;
  initiated_by: string | null;
  start_time: string;
  end_time?: string | null;
  is_video: boolean;
  status: 'ongoing' | 'ended' | 'missed';
};

export type CallParticipant = {
  call_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string | null;
};
