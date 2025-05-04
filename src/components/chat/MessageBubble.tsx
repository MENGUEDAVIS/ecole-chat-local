
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Avatar from "./Avatar";
import { Message, User } from "@/types/chat";
import { Clock, Paperclip, Pin, MoreVertical, Mic } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  sender?: User;
  onPinMessage?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isCurrentUser, 
  sender,
  onPinMessage
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      return "";
    }
  };

  const formatTimeSince = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: fr,
      });
    } catch (error) {
      return "";
    }
  };

  const renderMessageContent = () => {
    if (message.type === "voice") {
      const attachment = message.attachments?.[0];
      if (attachment && attachment.url) {
        return (
          <div className="flex items-center mt-1">
            <Mic size={16} className="mr-2" />
            <audio src={attachment.url} controls className="h-8 max-w-[200px]" />
            {attachment.duration && (
              <span className="text-xs ml-2 opacity-70">{Math.round(attachment.duration)}s</span>
            )}
          </div>
        );
      }
      return <div className="text-ecole-meta text-sm">Message vocal indisponible</div>;
    }
    
    return <div className="whitespace-pre-line">{message.content}</div>;
  };

  return (
    <div
      className={cn(
        "flex mb-4 animate-fade-in group",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isCurrentUser && sender && (
        <div className="flex-shrink-0 mr-2 self-end mb-1">
          <Avatar src={sender.avatar} alt={sender.name} size="sm" />
        </div>
      )}
      
      <div className={cn("max-w-[70%]", isCurrentUser ? "items-end" : "items-start")}>
        {!isCurrentUser && sender && (
          <div className="text-xs text-ecole-meta mb-1 ml-1">{sender.name}</div>
        )}
        
        <div className="flex flex-col">
          {message.attachments && message.attachments.length > 0 && message.type !== "voice" && (
            <div className="mb-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={cn(
                    "p-3 rounded-lg flex items-center mb-1",
                    isCurrentUser
                      ? "bg-ecole-primary text-white"
                      : "bg-gray-100 text-ecole-text"
                  )}
                >
                  <Paperclip size={16} className="mr-2" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{attachment.name}</div>
                    <div className="text-xs opacity-80">{attachment.size}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative">
            <div
              className={cn(
                "p-3 rounded-lg shadow-sm",
                message.is_pinned ? "border-l-2 border-ecole-primary" : "",
                isCurrentUser
                  ? "bg-ecole-userMessage text-ecole-text rounded-br-none"
                  : "bg-ecole-otherMessage text-ecole-text rounded-bl-none"
              )}
            >
              {renderMessageContent()}
            </div>
            
            {showActions && onPinMessage && (
              <div className={cn(
                "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
                isCurrentUser ? "left-0 -translate-x-full -ml-2" : "right-0 translate-x-full mr-2"
              )}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-gray-200 rounded-full">
                      <MoreVertical size={16} className="text-ecole-meta" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side={isCurrentUser ? "left" : "right"}>
                    <DropdownMenuItem onClick={onPinMessage} className="flex items-center gap-2">
                      <Pin size={14} />
                      <span>{message.is_pinned ? "Retirer l'épingle" : "Épingler"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          <div
            className={cn(
              "text-xs text-ecole-meta mt-1 flex items-center",
              isCurrentUser ? "justify-end" : "justify-start"
            )}
          >
            {formatTime(message.timestamp)}
            {isCurrentUser && message.status === "pending" && (
              <Clock size={12} className="ml-1 text-ecole-offline" />
            )}
            {message.is_pinned && (
              <Pin size={12} className="ml-1 text-ecole-primary" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
