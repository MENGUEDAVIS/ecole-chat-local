
import React, { useState } from "react";
import { Search, Menu, ChevronLeft, Phone, Video } from "lucide-react";
import Avatar from "./Avatar";
import { User, Conversation } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  users: User[];
  conversations: Conversation[];
  currentUser: User;
  isConnected: boolean;
  onSelectConversation: (id: string) => void;
  selectedConversationId: string | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleActionSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  users,
  conversations,
  currentUser,
  isConnected,
  onSelectConversation,
  selectedConversationId,
  isSidebarOpen,
  onToggleSidebar,
  onToggleActionSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "direct" | "groups" | "channels">("all");
  const isMobile = useIsMobile();

  // Filter conversations based on search and active filter
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === "direct") return conv.type === "private";
    if (activeFilter === "groups") return conv.type === "group" && !conv.category?.includes("channel");
    if (activeFilter === "channels") return conv.type === "group" && conv.category?.includes("channel");
    
    return true;
  });

  const getLastMessagePreview = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return "";
    
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      const attachment = lastMessage.attachments[0];
      if (attachment.type === "image") return "📷 Photo";
      if (attachment.type === "voice") return "🎤 Message vocal";
      return `📎 ${attachment.name}`;
    }
    
    return lastMessage.content.length > 30
      ? `${lastMessage.content.substring(0, 30)}...`
      : lastMessage.content;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date > new Date(now.setDate(now.getDate() - 7))) {
      // Less than a week ago
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isMobile && !isSidebarOpen) return null;

  return (
    <div className={cn(
      "h-screen flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
      isMobile ? (isSidebarOpen ? "fixed z-40 w-full md:w-80" : "hidden") : "w-80 min-w-80"
    )}>
      {/* Header */}
      <div className="bg-ecole-primary dark:bg-gray-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          {isMobile ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleSidebar} 
              className="text-white hover:bg-ecole-primary/80 dark:hover:bg-gray-600 mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleActionSidebar}
              className="text-white hover:bg-ecole-primary/80 dark:hover:bg-gray-600 mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold">École Chat</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 sticky top-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-ecole-primary dark:focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "flex-1 py-3 text-center text-sm font-medium border-b-2",
            activeFilter === "all" 
              ? "border-ecole-primary dark:border-blue-500 text-ecole-primary dark:text-blue-500" 
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Tous
        </button>
        <button
          onClick={() => setActiveFilter("direct")}
          className={cn(
            "flex-1 py-3 text-center text-sm font-medium border-b-2",
            activeFilter === "direct" 
              ? "border-ecole-primary dark:border-blue-500 text-ecole-primary dark:text-blue-500" 
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Privés
        </button>
        <button
          onClick={() => setActiveFilter("groups")}
          className={cn(
            "flex-1 py-3 text-center text-sm font-medium border-b-2",
            activeFilter === "groups" 
              ? "border-ecole-primary dark:border-blue-500 text-ecole-primary dark:text-blue-500" 
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Groupes
        </button>
        <button
          onClick={() => setActiveFilter("channels")}
          className={cn(
            "flex-1 py-3 text-center text-sm font-medium border-b-2",
            activeFilter === "channels" 
              ? "border-ecole-primary dark:border-blue-500 text-ecole-primary dark:text-blue-500" 
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Salons
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {filteredConversations.map((conversation) => {
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          const isGroup = conversation.type === "group";
          const isPinned = conversation.isPinned;
          
          return (
            <div
              key={conversation.id}
              className={cn(
                "p-3 flex items-center cursor-pointer",
                selectedConversationId === conversation.id 
                  ? "bg-gray-100 dark:bg-gray-700" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-750",
                isPinned && "bg-blue-50 dark:bg-blue-900/20"
              )}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="relative">
                <Avatar 
                  src={conversation.avatar} 
                  alt={conversation.name}
                  status={isGroup ? undefined : conversation.participants[0]?.status}
                  className={isGroup ? "bg-ecole-primary/80 dark:bg-blue-600" : ""}
                />
                {isPinned && (
                  <div className="absolute -top-1 -right-1 bg-ecole-primary dark:bg-blue-500 rounded-full p-0.5">
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M240,111.31V80a16,16,0,0,0-16-16H169.37L150.05,44.69A16.12,16.12,0,0,0,136,38.31H120A16,16,0,0,0,104,54.31V111.5L32.67,176.28A8,8,0,0,0,32,186.54a7.93,7.93,0,0,0,13.09,6.07L104,145.12v56.57a16,16,0,0,0,16,16h16a16.12,16.12,0,0,0,14.05-6.38L169.37,192H224a16,16,0,0,0,16-16V144.69a16.12,16.12,0,0,0-9.94-14.81Z"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-800 dark:text-white line-clamp-1">
                    {conversation.name}
                  </h3>
                  {lastMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatTimestamp(lastMessage.timestamp)}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                    {lastMessage ? getLastMessagePreview(conversation) : "Aucun message"}
                  </p>
                  
                  {conversation.unreadCount > 0 && (
                    <div className="ml-2 bg-ecole-primary dark:bg-blue-500 text-white text-xs font-medium rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <p>Aucune conversation trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
