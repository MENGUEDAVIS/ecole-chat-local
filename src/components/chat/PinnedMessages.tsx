
import React from "react";
import { Message, Conversation, User } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PinnedMessagesProps {
  messages: Message[];
  conversation: Conversation;
  onClose: () => void;
}

const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  messages,
  conversation,
  onClose
}) => {
  if (messages.length === 0) return null;

  const getSenderName = (senderId: string): string => {
    const participant = conversation.participants.find(p => p.id === senderId);
    return participant?.name || "Utilisateur inconnu";
  };

  const formatTime = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: fr
      });
    } catch (error) {
      return "";
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Messages épinglés</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X size={16} />
        </Button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {messages.map(message => (
          <div 
            key={message.id} 
            className="bg-white rounded-lg p-2 text-sm shadow-sm border border-gray-100"
          >
            <div className="flex justify-between text-xs text-ecole-meta mb-1">
              <span className="font-medium">{getSenderName(message.senderId)}</span>
              <span>{formatTime(message.timestamp)}</span>
            </div>
            <p className="line-clamp-2">{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinnedMessages;
