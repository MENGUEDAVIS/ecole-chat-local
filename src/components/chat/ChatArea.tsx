
import React, { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { ConversationWithParticipants, MessageWithSender } from "@/services/ChatService";
import { Profile } from "@/types/supabase";
import { Loader2 } from "lucide-react";

interface ChatAreaProps {
  conversation: ConversationWithParticipants | null;
  currentUser: Profile | null;
  users: Profile[];
  isConnected: boolean;
  onSendMessage: (
    conversationId: string,
    content: string,
    attachments?: File[],
    type?: "text" | "voice" | "emoji"
  ) => void;
  onToggleSidebar: () => void;
  onPinMessage?: (conversationId: string, messageId: string) => void;
  onInitiateCall?: (isVideo?: boolean) => void;
  isLoadingMessages: boolean;
  messages: MessageWithSender[];
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUser,
  users,
  isConnected,
  onSendMessage,
  onToggleSidebar,
  onPinMessage,
  onInitiateCall,
  isLoadingMessages,
  messages
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (content: string, attachments?: File[], type: "text" | "voice" | "emoji" = "text") => {
    if (conversation) {
      onSendMessage(conversation.id, content, attachments, type);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <div className="text-lg font-medium dark:text-gray-300">Bienvenue dans École Chat</div>
          <p className="mt-2">Sélectionnez une conversation pour commencer</p>
          <button 
            className="mt-6 px-4 py-2 bg-ecole-primary dark:bg-blue-600 text-white rounded-md hover:bg-ecole-primary/90 dark:hover:bg-blue-700 transition-colors"
            onClick={onToggleSidebar}
          >
            Voir les conversations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader 
        conversation={conversation} 
        isConnected={isConnected} 
        onToggleSidebar={onToggleSidebar}
        onInitiateCall={onInitiateCall}
      />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 messages-container">
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Chargement des messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Aucun message</p>
              <p className="text-sm mt-1">Commencez la conversation !</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                // Assurer la compatibilité avec l'interface Message de chat.ts
                senderId: message.sender_id || '',
              }}
              isCurrentUser={currentUser ? message.sender_id === currentUser.id : false}
              sender={message.sender ? {
                ...message.sender,
                name: message.sender.name || message.sender.full_name || message.sender.username || ''
              } : null}
              onPinMessage={isConnected && onPinMessage ? 
                () => onPinMessage(conversation.id, message.id) : 
                undefined
              }
            />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
      />
    </div>
  );
};

export default ChatArea;
