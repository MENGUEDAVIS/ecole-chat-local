
import React, { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { Conversation, Message, User, Attachment } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";

interface ChatAreaProps {
  conversation: Conversation | null;
  currentUser: User;
  users: User[];
  isConnected: boolean;
  onSendMessage: (
    conversationId: string,
    content: string,
    attachments?: File[],
    type?: "text" | "voice" | "emoji"
  ) => void;
  onToggleSidebar: () => void;
  onPinMessage?: (conversationId: string, messageId: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUser,
  users,
  isConnected,
  onSendMessage,
  onToggleSidebar,
  onPinMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [chatbotTyping, setChatbotTyping] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const getSender = (senderId: string): User | undefined => {
    if (senderId === currentUser.id) {
      return currentUser;
    }
    return users.find((user) => user.id === senderId);
  };

  const handleSendMessage = (content: string, attachments?: File[], type: "text" | "voice" | "emoji" = "text") => {
    if (conversation) {
      onSendMessage(conversation.id, content, attachments, type);
      
      // Simulation de réponse du chatbot si activé
      if (conversation.chatbotEnabled && type === "text" && isConnected) {
        simulateChatbotResponse();
      }
    }
  };
  
  const simulateChatbotResponse = () => {
    // Simule un chatbot qui écrit
    setChatbotTyping(true);
    
    setTimeout(() => {
      setChatbotTyping(false);
      
      if (conversation) {
        const chatbotResponses = [
          "Bonjour! Je suis le chatbot assistant du cours. Comment puis-je vous aider?",
          "Vous pouvez consulter le syllabus du cours dans les fichiers partagés.",
          "La prochaine session aura lieu mardi à 14h en salle B305.",
          "N'oubliez pas de rendre votre devoir avant vendredi 18h.",
          "Pour plus d'informations, consultez la page du cours sur le portail étudiant."
        ];
        
        const randomResponse = chatbotResponses[Math.floor(Math.random() * chatbotResponses.length)];
        
        const botUser = users.find(u => u.role === "staff" && u.name.includes("Bot"));
        
        if (botUser) {
          onSendMessage(
            conversation.id, 
            randomResponse,
            undefined,
            "text"
          );
        }
      }
    }, 2000);
  };
  
  const handleInitiateCall = (isVideo: boolean = false) => {
    if (!isConnected) {
      toast({
        title: "Impossible de démarrer un appel",
        description: "Vous êtes hors ligne. Reconnectez-vous au réseau pour passer un appel.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: isVideo ? "Appel vidéo en cours" : "Appel audio en cours",
      description: `Appel vers ${conversation?.name} en préparation...`,
    });
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
        onInitiateCall={handleInitiateCall}
      />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 messages-container">
        {conversation.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Aucun message</p>
              <p className="text-sm mt-1">Commencez la conversation !</p>
            </div>
          </div>
        ) : (
          conversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUser.id}
              sender={getSender(message.senderId)}
              onPinMessage={isConnected ? 
                () => onPinMessage && onPinMessage(conversation.id, message.id) : 
                undefined
              }
            />
          ))
        )}
        
        {chatbotTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 p-3 rounded-lg animate-pulse flex items-center">
              <span className="mr-2">•</span>
              <span className="mr-2">•</span>
              <span>•</span>
            </div>
          </div>
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
