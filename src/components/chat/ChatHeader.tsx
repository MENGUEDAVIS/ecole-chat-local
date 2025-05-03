
import React from "react";
import { ArrowLeft, CloudOff, Search, Upload } from "lucide-react";
import Avatar from "./Avatar";
import { Conversation } from "@/types/chat";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatHeaderProps {
  conversation: Conversation;
  isConnected: boolean;
  onToggleSidebar: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, isConnected, onToggleSidebar }) => {
  const isMobile = useIsMobile();

  const getParticipantString = () => {
    if (conversation.type === "private") {
      const participant = conversation.participants[0];
      return participant ? 
        participant.role === "teacher" ? "Professeur" : 
        participant.role === "student" ? "Élève" : "Personnel" 
        : "";
    } else {
      const count = conversation.participants.length;
      return `${count} participant${count > 1 ? "s" : ""}`;
    }
  };

  return (
    <div className="border-b border-gray-200 p-3 flex items-center justify-between bg-white shadow-sm">
      <div className="flex items-center">
        {isMobile && (
          <button 
            onClick={onToggleSidebar}
            className="mr-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
          >
            <ArrowLeft size={20} className="text-ecole-primary" />
          </button>
        )}
        
        <Avatar
          src={conversation.avatar}
          alt={conversation.name}
          status={conversation.type === "private" ? conversation.participants[0]?.status : undefined}
        />
        
        <div className="ml-3">
          <div className="font-bold text-ecole-text">{conversation.name}</div>
          <div className="text-xs text-ecole-meta">
            {getParticipantString()}
          </div>
        </div>
      </div>

      <div className="flex items-center">
        {!isConnected && (
          <div className="mr-3 flex items-center text-xs text-ecole-offline animate-pulse-subtle">
            <CloudOff size={16} className="mr-1" />
            <span className="hidden sm:inline">Hors ligne</span>
          </div>
        )}
        
        <button className="p-2 text-ecole-meta hover:bg-gray-100 rounded-full focus:outline-none">
          <Search size={18} />
        </button>
        
        <button className="p-2 text-ecole-meta hover:bg-gray-100 rounded-full focus:outline-none">
          <Upload size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
