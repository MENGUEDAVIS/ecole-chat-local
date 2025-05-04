
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { chatService, ConversationWithParticipants, MessageWithSender } from "@/services/ChatService";
import { Profile } from "@/types/supabase";
import { Conversation, User } from "@/types/chat";

export function useConversationManagement(userId: string | undefined, profile: Profile | null) {
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipants | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Load user's conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (userId) {
        try {
          const userConversations = await chatService.getUserConversations(userId);
          setConversations(userConversations);
        } catch (error) {
          console.error('Error loading conversations:', error);
        }
      }
    };
    
    loadConversations();
    
    // Subscribe to conversation updates
    if (userId) {
      return chatService.subscribeToConversations(userId, loadConversations);
    }
  }, [userId]);

  // Update selected conversation when ID changes
  useEffect(() => {
    if (selectedConversationId) {
      const conversation = conversations.find(c => c.id === selectedConversationId) || null;
      setSelectedConversation(conversation);
      
      // Load messages
      if (conversation) {
        loadMessages(conversation.id);
      }
    } else {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [selectedConversationId, conversations]);

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const conversationMessages = await chatService.getConversationMessages(conversationId);
      setMessages(conversationMessages);
      
      // Subscribe to new messages
      chatService.subscribeToMessages(conversationId, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Select a conversation
  const selectConversation = (id: string) => {
    setSelectedConversationId(id);
  };
  
  // Check URL for contact parameter
  const checkUrlForContact = (users: Profile[], location: any) => {
    if (!userId || !profile) return;
    
    const params = new URLSearchParams(location.search);
    const contactId = params.get('contact');
    
    if (contactId) {
      const existingConversation = conversations.find(
        (conv) => 
          conv.type === "private" && 
          conv.participants.some((p) => p.id === contactId)
      );
      
      if (existingConversation) {
        setSelectedConversationId(existingConversation.id);
      } else {
        // Find corresponding user
        const contactUser = users.find(u => u.id === contactId);
        if (contactUser) {
          startConversation(contactUser);
        }
      }
    }
  };

  // Send a message
  const sendMessage = async (
    conversationId: string,
    content: string,
    attachments?: File[],
    type: "text" | "voice" | "emoji" = "text"
  ) => {
    if (!userId) return;
    
    try {
      await chatService.sendMessage(
        conversationId,
        userId,
        content,
        type,
        attachments
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Pin/unpin a message
  const pinMessage = async (conversationId: string, messageId: string) => {
    try {
      // Find message in state
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;
      
      const message = messages[messageIndex];
      const isPinned = !message.is_pinned;
      
      // Update locally
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...message,
        is_pinned: isPinned
      };
      setMessages(updatedMessages);
      
      // Update in database
      await chatService.pinMessage(messageId, isPinned);
      
      toast.success(isPinned ? "Message épinglé" : "Message désépinglé");
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  // Start a conversation with a user
  const startConversation = async (recipient: Profile) => {
    if (!profile) return;
    
    // Check if conversation exists
    const existingConversation = conversations.find(
      conv => conv.type === "private" && conv.participants.some(p => p.id === recipient.id)
    );
    
    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      return;
    }
    
    // Create new conversation
    try {
      const conversationId = await chatService.createPrivateConversation(profile, recipient);
      setSelectedConversationId(conversationId);
      
      toast.success("Nouvelle conversation", {
        description: `Conversation démarrée avec ${recipient.full_name || recipient.username || "utilisateur"}`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Create a group
  const createGroup = async (
    name: string, 
    participants: Profile[], 
    category: "project" | "club" | "class" | "other",
    visibility: "private" | "public" | "moderated",
    description?: string
  ) => {
    if (!profile) return;
    
    try {
      const groupId = await chatService.createGroupConversation(
        profile,
        name,
        participants,
        category,
        visibility,
        description
      );
      
      setSelectedConversationId(groupId);
      
      toast.success("Groupe créé", {
        description: `Le groupe "${name}" a été créé avec ${participants.length + 1} participant(s).`,
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Convert Profile to User
  const profileToUser = (profile: Profile): User => ({
    id: profile.id,
    name: profile.name || profile.full_name || profile.username || profile.id,
    avatar: profile.avatar_url || undefined,
    status: profile.status as "online" | "offline",
    role: profile.role,
    lastSeen: profile.last_seen,
    // Add Profile properties
    username: profile.username || undefined,
    avatar_url: profile.avatar_url || undefined,
    full_name: profile.full_name || undefined,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  });

  // Convert Profiles to Users
  const profilesToUsers = (profiles: Profile[]): User[] => {
    return profiles.map(profileToUser);
  };

  // Convert ConversationWithParticipants to Conversation
  const conversationToBase = (conversation: ConversationWithParticipants): Conversation => {
    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name || "",
      participants: profilesToUsers(conversation.participants),
      messages: [],
      category: conversation.category,
      visibility: conversation.visibility,
      description: conversation.description,
      avatar: conversation.avatar_url,
      chatbotEnabled: conversation.chatbot_enabled,
      isPinned: conversation.is_pinned,
      createdBy: conversation.created_by,
      // Add properties required for compatibility
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      avatar_url: conversation.avatar_url,
      is_pinned: conversation.is_pinned,
      chatbot_enabled: conversation.chatbot_enabled,
      created_by: conversation.created_by
    };
  };

  // Convert multiple conversations
  const conversationsToBase = (conversations: ConversationWithParticipants[]): Conversation[] => {
    return conversations.map(conversationToBase);
  };

  return {
    conversations,
    selectedConversationId,
    selectedConversation,
    messages,
    isLoadingMessages,
    selectConversation,
    checkUrlForContact,
    sendMessage,
    pinMessage,
    startConversation,
    createGroup,
    profileToUser,
    profilesToUsers,
    conversationToBase,
    conversationsToBase
  };
}
