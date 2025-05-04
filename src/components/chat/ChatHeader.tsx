import React, { useState } from "react";
import { 
  ArrowLeft, 
  CloudOff, 
  Search, 
  Upload, 
  PhoneCall, 
  Video,
  Pin,
  Info,
  Users
} from "lucide-react";
import Avatar from "./Avatar";
import { ConversationWithParticipants } from "@/services/ChatService";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import PinnedMessages from "./PinnedMessages";
import { MessageWithSender } from "@/services/ChatService";

interface ChatHeaderProps {
  conversation: ConversationWithParticipants;
  isConnected: boolean;
  onToggleSidebar: () => void;
  onInitiateCall?: (isVideo?: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  conversation, 
  isConnected, 
  onToggleSidebar,
  onInitiateCall 
}) => {
  const isMobile = useIsMobile();
  const [showPinned, setShowPinned] = useState(false);

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

  const getConversationType = () => {
    if (conversation.type === "group") {
      if (conversation.category === "project") return "(Projet)";
      if (conversation.category === "club") return "(Club)";
      if (conversation.category === "class") return "(Classe)";
      return "";
    }
    if (conversation.type === "channel") {
      if (conversation.category === "course") return "(Cours)";
      if (conversation.category === "admin") return "(Administration)";
      return "";
    }
    return "";
  };

  const getConversationVisibility = () => {
    if (conversation.visibility === "private") return "🔒";
    if (conversation.visibility === "public") return "🌍";
    if (conversation.visibility === "moderated") return "👁️";
    return "";
  };

  const handleInitiateVoiceCall = () => {
    if (onInitiateCall) onInitiateCall(false);
  };

  const handleInitiateVideoCall = () => {
    if (onInitiateCall) onInitiateCall(true);
  };

  // Convertir les messages épinglés au format MessageWithSender
  const pinnedMessages = conversation.messages 
    ? conversation.messages
        .filter(msg => msg.is_pinned)
        .map(msg => ({
          ...msg,
          sender_id: msg.senderId || msg.sender_id || null,
          timestamp: msg.timestamp || new Date().toISOString(),
          status: (msg.status || 'sent') as 'sent' | 'pending' | 'failed',
          type: (msg.type || 'text') as 'text' | 'voice' | 'emoji',
          is_pinned: true,
          sender: msg.sender || null
        }))
    : [];

  const isPinnedMessages = pinnedMessages.length > 0;

  return (
    <>
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
            src={conversation.avatar_url || undefined}
            alt={conversation.name || ''}
            status={conversation.type === "private" && conversation.participants[0] ? conversation.participants[0].status as "online" | "offline" | undefined : undefined}
          />
          
          <div className="ml-3">
            <div className="font-bold text-ecole-text flex items-center">
              {conversation.name}
              {" "}
              <span className="text-xs ml-1 font-normal text-ecole-meta">
                {getConversationType()} {getConversationVisibility()}
              </span>
            </div>
            <div className="text-xs text-ecole-meta">
              {getParticipantString()}
              {conversation.type !== "private" && conversation.description && (
                <span className="ml-1 hidden sm:inline">• {conversation.description}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isConnected && (
            <div className="mr-3 flex items-center text-xs text-ecole-offline animate-pulse-subtle">
              <CloudOff size={16} className="mr-1" />
              <span className="hidden sm:inline">Hors ligne</span>
            </div>
          )}
          
          {isPinnedMessages && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`text-ecole-meta hover:bg-gray-100 ${showPinned ? 'text-ecole-primary' : ''}`}
                    onClick={() => setShowPinned(!showPinned)}
                  >
                    <Pin size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Messages épinglés</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-ecole-meta hover:bg-gray-100 hover:text-ecole-primary"
                  onClick={handleInitiateVoiceCall}
                  disabled={!isConnected}
                >
                  <PhoneCall size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Appel audio</p>
              </TooltipContent>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-ecole-meta hover:bg-gray-100 hover:text-ecole-primary"
                  onClick={handleInitiateVideoCall}
                  disabled={!isConnected}
                >
                  <Video size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Appel vidéo</p>
              </TooltipContent>
            </TooltipProvider>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-ecole-meta hover:bg-gray-100 hover:text-ecole-primary"
            title="Rechercher"
          >
            <Search size={18} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-ecole-meta hover:bg-gray-100 hover:text-ecole-primary"
            title="Partager un fichier"
          >
            <Upload size={18} />
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-ecole-meta hover:bg-gray-100 hover:text-ecole-primary"
                >
                  <Info size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Informations</p>
              </TooltipContent>
            </TooltipProvider>
        </div>
      </div>
      
      {/* Drawer pour les messages épinglés */}
      {showPinned && isPinnedMessages && (
        <div className="border-b border-gray-200 bg-ecole-primary/5 p-2 animate-fade-in">
          <PinnedMessages 
            messages={pinnedMessages as MessageWithSender[]}
            conversation={conversation}
            onClose={() => setShowPinned(false)}
          />
        </div>
      )}
    </>
  );
};

export default ChatHeader;
