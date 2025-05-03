import React, { useState, useEffect } from "react";
import ThemeToggle from "@/components/chat/ThemeToggle";
import Sidebar from "@/components/chat/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import ActionsSidebar from "@/components/chat/ActionsSidebar";
import { mockUsers, mockConversations, currentUser, userState } from "@/data/mockData";
import { Conversation, Message, User } from "@/types/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(userState.isConnected);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isActionSidebarOpen, setIsActionSidebarOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate connection status changes
    const interval = setInterval(() => {
      const newStatus = Math.random() > 0.7;
      setIsConnected(newStatus);
      
      if (!userState.isConnected && newStatus) {
        toast({
          title: "Connexion rétablie",
          description: "Vous êtes maintenant connecté au réseau local.",
          variant: "default",
        });
      } else if (userState.isConnected && !newStatus) {
        toast({
          title: "Connexion perdue",
          description: "Vous êtes maintenant en mode hors ligne.",
          variant: "destructive",
        });
      }
      
      userState.isConnected = newStatus;
    }, 20000); // Check every 20 seconds
    
    return () => clearInterval(interval);
  }, [toast]);

  // Handle selecting a conversation
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    
    // Mark as read when selecting
    setConversations(
      conversations.map((conv) =>
        conv.id === id ? { ...conv, unreadCount: 0 } : conv
      )
    );
    
    // Close sidebar on mobile when selecting a conversation
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = (
    conversationId: string,
    content: string,
    attachments?: File[],
    type: "text" | "voice" | "emoji" = "text"
  ) => {
    const now = new Date();
    const newMessage: Message = {
      id: `msg-${conversationId}-${now.getTime()}`,
      content,
      senderId: currentUser.id,
      timestamp: now.toISOString(),
      status: isConnected ? "sent" : "pending",
      type,
      attachments: attachments
        ? attachments.map((file, index) => {
            const isVoice = file.type.startsWith("audio/");
            return {
              id: `attach-${now.getTime()}-${index}`,
              name: file.name,
              type: file.type.startsWith("image/")
                ? "image"
                : isVoice
                  ? "voice"
                  : file.type.startsWith("application/")
                    ? "document"
                    : "other",
              url: URL.createObjectURL(file), // Pour la prévisualisation locale
              size: `${Math.round(file.size / 1024)} KB`,
              duration: isVoice ? Math.floor(Math.random() * 30) + 5 : undefined, // Simulation pour les messages vocaux
            };
          })
        : undefined,
    };

    setConversations(
      conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: newMessage,
            }
          : conv
      )
    );

    if (!isConnected) {
      toast({
        title: "Message en attente",
        description: "Votre message sera envoyé automatiquement lorsque la connexion sera rétablie.",
        variant: "default",
      });
    }
  };
  
  // Handle pinning a message
  const handlePinMessage = (conversationId: string, messageId: string) => {
    setConversations(
      conversations.map((conv) => {
        if (conv.id !== conversationId) return conv;
        
        const messageIndex = conv.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) return conv;
        
        const updatedMessages = [...conv.messages];
        const message = updatedMessages[messageIndex];
        
        // Toggle pinned status
        updatedMessages[messageIndex] = {
          ...message,
          isPinned: !message.isPinned
        };
        
        // Update pinnedMessages collection
        let pinnedMessages = conv.pinnedMessages || [];
        
        if (message.isPinned) {
          // If it was pinned and we're unpinning it
          pinnedMessages = pinnedMessages.filter(msg => msg.id !== messageId);
        } else {
          // If it wasn't pinned and we're pinning it
          pinnedMessages = [...pinnedMessages, {...updatedMessages[messageIndex], isPinned: true}];
        }
        
        return {
          ...conv,
          messages: updatedMessages,
          pinnedMessages
        };
      })
    );
    
    toast({
      title: "Message épinglé",
      description: "Le message a été épinglé dans la conversation.",
    });
  };
  
  // Handle creating a new group
  const handleCreateGroup = (
    name: string, 
    participants: User[], 
    category: "project" | "club" | "class" | "other",
    visibility: "private" | "public" | "moderated",
    description?: string
  ) => {
    const now = new Date();
    const newGroupId = `c${conversations.length + 1}`;
    
    const newGroup: Conversation = {
      id: newGroupId,
      type: "group",
      name: name,
      participants: [...participants, currentUser], // Include current user
      messages: [],
      unreadCount: 0,
      avatar: "",
      category,
      visibility,
      description,
      createdBy: currentUser.id,
    };
    
    setConversations([...conversations, newGroup]);
    setSelectedConversationId(newGroupId);
    
    toast({
      title: "Groupe créé",
      description: `Le groupe "${name}" a été créé avec ${participants.length + 1} participant(s).`,
    });
  };
  
  // Handle starting a direct message conversation
  const handleStartConversation = (userId: string) => {
    // Check if conversation already exists
    const existingConversation = conversations.find(
      (conv) => 
        conv.type === "private" && 
        conv.participants.some((p) => p.id === userId)
    );
    
    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      return;
    }
    
    // Create new conversation
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) return;
    
    const newConvId = `c${conversations.length + 1}`;
    const newConversation: Conversation = {
      id: newConvId,
      type: "private",
      name: user.name,
      participants: [user],
      messages: [],
      unreadCount: 0,
      avatar: user.avatar,
    };
    
    setConversations([...conversations, newConversation]);
    setSelectedConversationId(newConvId);
    
    toast({
      title: "Nouvelle conversation",
      description: `Conversation démarrée avec ${user.name}.`,
    });
  };

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  ) || null;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (isMobile && isActionSidebarOpen) {
      setIsActionSidebarOpen(false);
    }
  };
  
  const toggleActionSidebar = () => {
    setIsActionSidebarOpen(!isActionSidebarOpen);
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      <ActionsSidebar 
        isOpen={isActionSidebarOpen}
        onToggle={toggleActionSidebar}
        users={mockUsers}
        currentUser={currentUser}
        onStartConversation={handleStartConversation}
        onCreateGroup={handleCreateGroup}
      />
      
      <Sidebar
        users={mockUsers}
        conversations={conversations}
        currentUser={currentUser}
        isConnected={isConnected}
        onSelectConversation={handleSelectConversation}
        selectedConversationId={selectedConversationId}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onToggleActionSidebar={toggleActionSidebar}
      />
      
      <div className="flex flex-col flex-1 h-full">
        <ChatArea
          conversation={selectedConversation}
          currentUser={currentUser}
          users={mockUsers}
          isConnected={isConnected}
          onSendMessage={handleSendMessage}
          onToggleSidebar={toggleSidebar}
          onPinMessage={handlePinMessage}
        />
      </div>
      
      <ThemeToggle />
    </div>
  );
};

export default Index;
