
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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium">Bienvenue dans École Chat</div>
          <p className="mt-2">Sélectionnez une conversation pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <ChatHeader 
        conversation={conversation} 
        isConnected={isConnected} 
        onToggleSidebar={onToggleSidebar}
        onInitiateCall={handleInitiateCall}
      />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 messages-container">
        {conversation.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-ecole-meta">
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
            <div className="bg-gray-100 text-ecole-meta p-3 rounded-lg animate-pulse flex items-center">
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
