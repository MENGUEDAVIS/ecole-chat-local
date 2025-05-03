
import React, { useState, useEffect } from "react";
import ThemeToggle from "@/components/chat/ThemeToggle";
import Sidebar from "@/components/chat/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import { mockUsers, mockConversations, currentUser, userState } from "@/data/mockData";
import { Conversation, Message } from "@/types/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(userState.isConnected);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
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
  };

  // Handle sending a message
  const handleSendMessage = (
    conversationId: string,
    content: string,
    attachments?: File[]
  ) => {
    const now = new Date();
    const newMessage: Message = {
      id: `msg-${conversationId}-${now.getTime()}`,
      content,
      senderId: currentUser.id,
      timestamp: now.toISOString(),
      status: isConnected ? "sent" : "pending",
      attachments: attachments
        ? attachments.map((file, index) => ({
            id: `attach-${now.getTime()}-${index}`,
            name: file.name,
            type: file.type.startsWith("image/")
              ? "image"
              : file.type.startsWith("application/")
                ? "document"
                : "other",
            url: "#",
            size: `${Math.round(file.size / 1024)} KB`,
          }))
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

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  ) || null;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        users={mockUsers}
        conversations={conversations}
        currentUser={currentUser}
        isConnected={isConnected}
        onSelectConversation={handleSelectConversation}
        selectedConversationId={selectedConversationId}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      
      <ChatArea
        conversation={selectedConversation}
        currentUser={currentUser}
        users={mockUsers}
        isConnected={isConnected}
        onSendMessage={handleSendMessage}
        onToggleSidebar={toggleSidebar}
      />
      
      <ThemeToggle />
    </div>
  );
};

export default Index;
