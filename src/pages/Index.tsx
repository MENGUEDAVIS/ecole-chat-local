import React, { useState, useEffect, useCallback } from "react";
import ThemeToggle from "@/components/chat/ThemeToggle";
import Sidebar from "@/components/chat/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import ActionsSidebar from "@/components/chat/ActionsSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { chatService, ConversationWithParticipants, MessageWithSender } from "@/services/ChatService";
import { toast } from "@/components/ui/sonner";
import { Profile } from "@/types/supabase";
import { supabase } from "@/integrations/supabase/client";
import CallDialog from "@/components/chat/CallDialog";
import CallScreen from "@/components/chat/CallScreen";
import webRTCService from "@/services/WebRTCService";

const Index = () => {
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipants | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(navigator.onLine);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isActionSidebarOpen, setIsActionSidebarOpen] = useState<boolean>(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<{
    callId: string;
    callerId: string;
    isVideo: boolean;
  } | null>(null);
  const [activeCall, setActiveCall] = useState<{
    callId: string;
    participants: { id: string; name: string }[];
    isVideo: boolean;
  } | null>(null);
  const [callerProfile, setCallerProfile] = useState<Profile | null>(null);
  
  const isMobile = useIsMobile();
  const { toast: showToast } = useToast();
  const location = useLocation();
  const { user, profile } = useAuth();

  // Surveiller l'état de la connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      showToast({
        title: "Connexion rétablie",
        description: "Vous êtes maintenant connecté au réseau.",
        variant: "default",
      });
    };
    
    const handleOffline = () => {
      setIsConnected(false);
      showToast({
        title: "Connexion perdue",
        description: "Vous êtes maintenant en mode hors ligne.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*');
          
          if (data) {
            // Assurez-vous que les données ont le bon type
            const typedProfiles: Profile[] = data.map(profile => ({
              ...profile,
              role: profile.role as 'student' | 'teacher' | 'staff',
              status: profile.status as 'online' | 'offline',
              name: profile.full_name || profile.username || profile.id
            }));
            setUsers(typedProfiles);
          }
        } catch (error) {
          console.error('Error loading users:', error);
        }
      }
    };
    
    loadUsers();
  }, [user]);

  // Charger les conversations de l'utilisateur
  useEffect(() => {
    const loadConversations = async () => {
      if (user) {
        try {
          const userConversations = await chatService.getUserConversations(user.id);
          setConversations(userConversations);
        } catch (error) {
          console.error('Error loading conversations:', error);
        }
      }
    };
    
    loadConversations();
    
    // S'abonner aux mises à jour des conversations
    if (user) {
      return chatService.subscribeToConversations(user.id, loadConversations);
    }
  }, [user]);

  // Vérifier le paramètre URL contact
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const contactId = params.get('contact');
    
    if (contactId && user) {
      const existingConversation = conversations.find(
        (conv) => 
          conv.type === "private" && 
          conv.participants.some((p) => p.id === contactId)
      );
      
      if (existingConversation) {
        setSelectedConversationId(existingConversation.id);
      } else {
        // Trouver l'utilisateur correspondant
        const contactUser = users.find(u => u.id === contactId);
        if (contactUser && profile) {
          handleStartConversation(contactUser);
        }
      }
    }
  }, [location.search, conversations, users, user, profile]);

  // Mettre à jour la conversation sélectionnée
  useEffect(() => {
    if (selectedConversationId) {
      const conversation = conversations.find(c => c.id === selectedConversationId) || null;
      setSelectedConversation(conversation);
      
      // Charger les messages
      if (conversation) {
        loadMessages(conversation.id);
      }
    } else {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [selectedConversationId, conversations]);

  // Configurer le service WebRTC
  useEffect(() => {
    if (user) {
      webRTCService.init(user.id, {
        onIncomingCall: handleIncomingCall,
        onCallAccepted: (callId, participantId) => {
          toast.success("Appel connecté", {
            description: "L'autre participant a rejoint l'appel"
          });
        },
        onCallEnded: (callId) => {
          setActiveCall(null);
          toast.info("Appel terminé");
        }
      });
    }
    
    return () => {
      webRTCService.dispose();
    };
  }, [user, users]);

  // Charger les messages d'une conversation
  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const conversationMessages = await chatService.getConversationMessages(conversationId);
      setMessages(conversationMessages);
      
      // S'abonner aux nouveaux messages
      chatService.subscribeToMessages(conversationId, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Gérer la selection d'une conversation
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    
    // Fermer la sidebar sur mobile
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Gérer l'envoi d'un message
  const handleSendMessage = async (
    conversationId: string,
    content: string,
    attachments?: File[],
    type: "text" | "voice" | "emoji" = "text"
  ) => {
    if (!user || !profile) return;
    
    try {
      await chatService.sendMessage(
        conversationId,
        user.id,
        content,
        type,
        attachments
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (!isConnected) {
        showToast({
          title: "Message en attente",
          description: "Votre message sera envoyé automatiquement lorsque la connexion sera rétablie.",
          variant: "default",
        });
      }
    }
  };
  
  // Gérer l'épinglage d'un message
  const handlePinMessage = async (conversationId: string, messageId: string) => {
    try {
      // Trouver le message dans l'état
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;
      
      const message = messages[messageIndex];
      const isPinned = !message.is_pinned;
      
      // Mettre à jour localement
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...message,
        is_pinned: isPinned
      };
      setMessages(updatedMessages);
      
      // Mettre à jour dans la base de données
      await chatService.pinMessage(messageId, isPinned);
      
      toast.success(isPinned ? "Message épinglé" : "Message désépinglé");
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };
  
  // Gérer la création d'un groupe
  const handleCreateGroup = async (
    name: string, 
    participants: Profile[], 
    category: "project" | "club" | "class" | "other",
    visibility: "private" | "public" | "moderated",
    description?: string
  ) => {
    if (!profile) return;
    
    try {
      const groupId = await chatService.createGroupConversation(
        profile,
        name,
        participants,
        category,
        visibility,
        description
      );
      
      setSelectedConversationId(groupId);
      
      showToast({
        title: "Groupe créé",
        description: `Le groupe "${name}" a été créé avec ${participants.length + 1} participant(s).`,
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };
  
  // Gérer le démarrage d'une conversation
  const handleStartConversation = async (recipient: Profile) => {
    if (!user || !profile) return;
    
    // Vérifier si une conversation existe déjà
    const existingConversation = conversations.find(
      conv => conv.type === "private" && conv.participants.some(p => p.id === recipient.id)
    );
    
    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      return;
    }
    
    // Créer une nouvelle conversation
    try {
      const conversationId = await chatService.createPrivateConversation(profile, recipient);
      setSelectedConversationId(conversationId);
      
      toast.success("Nouvelle conversation", {
        description: `Conversation démarrée avec ${recipient.full_name || recipient.username || "utilisateur"}`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Gérer les appels
  const handleInitiateCall = async (isVideo: boolean = false) => {
    if (!isConnected) {
      toast.error("Impossible de démarrer un appel", {
        description: "Vous êtes hors ligne. Reconnectez-vous au réseau pour passer un appel.",
      });
      return;
    }
    
    if (!selectedConversation || !user || !profile) {
      toast.error("Impossible de démarrer un appel", {
        description: "Aucune conversation sélectionnée.",
      });
      return;
    }
    
    try {
      toast.info(isVideo ? "Appel vidéo en cours" : "Appel audio en cours", {
        description: `Appel vers ${selectedConversation.name || "conversation"} en préparation...`,
      });
      
      // Récupérer les IDs des participants
      const participantIds = selectedConversation.participants
        .filter(p => p.id !== user.id)
        .map(p => p.id);
      
      // Démarrer l'appel
      const callId = await webRTCService.startCall(
        selectedConversation.id,
        participantIds,
        isVideo
      );
      
      // Définir l'appel actif
      setActiveCall({
        callId,
        participants: [
          { id: user.id, name: profile.full_name || profile.username || "Vous" },
          ...selectedConversation.participants
            .filter(p => p.id !== user.id)
            .map(p => ({ 
              id: p.id, 
              name: p.full_name || p.username || "Participant" 
            }))
        ],
        isVideo
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error("Erreur lors du démarrage de l'appel", {
        description: "Veuillez vérifier votre connexion et les permissions du navigateur.",
      });
    }
  };
  
  // Gérer les appels entrants
  const handleIncomingCall = useCallback(async (callId: string, callerId: string, isVideo: boolean) => {
    // Récupérer le profil de l'appelant
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', callerId)
        .single();
      
      if (data) {
        const typedProfile: Profile = {
          ...data,
          role: data.role as 'student' | 'teacher' | 'staff',
          status: data.status as 'online' | 'offline',
          name: data.full_name || data.username || data.id
        };
        setCallerProfile(typedProfile);
        setIncomingCallData({ callId, callerId, isVideo });
        setIsIncomingCall(true);
      }
    } catch (error) {
      console.error('Error getting caller profile:', error);
    }
  }, []);
  
  // Répondre à un appel
  const handleAnswerCall = async () => {
    if (!incomingCallData || !callerProfile || !user || !profile) return;
    
    try {
      await webRTCService.answerCall(
        incomingCallData.callId, 
        incomingCallData.callerId, 
        incomingCallData.isVideo
      );
      
      // Trouver ou créer une conversation avec l'appelant
      let conversationId = "";
      const existingConversation = conversations.find(
        conv => conv.type === "private" && conv.participants.some(p => p.id === incomingCallData.callerId)
      );
      
      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        conversationId = await chatService.createPrivateConversation(profile, callerProfile);
      }
      
      // Définir l'appel actif
      setActiveCall({
        callId: incomingCallData.callId,
        participants: [
          { id: user.id, name: profile.full_name || profile.username || "Vous" },
          { id: callerProfile.id, name: callerProfile.full_name || callerProfile.username || "Appelant" }
        ],
        isVideo: incomingCallData.isVideo
      });
      
      // Fermer la boîte de dialogue d'appel entrant
      setIsIncomingCall(false);
      setIncomingCallData(null);
      
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error("Erreur lors de la réponse à l'appel", {
        description: "Veuillez vérifier votre connexion et les permissions du navigateur.",
      });
    }
  };
  
  // Refuser un appel
  const handleDeclineCall = async () => {
    if (!incomingCallData) return;
    
    try {
      // Mettre fin à l'appel
      await webRTCService.endCurrentCall();
      
      // Fermer la boîte de dialogue d'appel entrant
      setIsIncomingCall(false);
      setIncomingCallData(null);
      
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };
  
  // Terminer un appel
  const handleEndCall = () => {
    setActiveCall(null);
  };

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
        users={users}
        currentUser={profile}
        onStartConversation={handleStartConversation}
        onCreateGroup={handleCreateGroup}
      />
      
      <Sidebar
        users={users}
        conversations={conversations}
        currentUser={profile}
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
          currentUser={profile}
          users={users}
          isConnected={isConnected}
          onSendMessage={handleSendMessage}
          onToggleSidebar={toggleSidebar}
          onPinMessage={handlePinMessage}
          onInitiateCall={handleInitiateCall}
          isLoadingMessages={isLoadingMessages}
          messages={messages}
        />
      </div>
      
      <ThemeToggle />
      
      {/* Boîte de dialogue d'appel entrant */}
      <CallDialog 
        isOpen={isIncomingCall}
        caller={callerProfile}
        isVideo={incomingCallData?.isVideo || false}
        onAnswer={handleAnswerCall}
        onDecline={handleDeclineCall}
      />
      
      {/* Écran d'appel */}
      {activeCall && (
        <CallScreen
          callId={activeCall.callId}
          participants={activeCall.participants}
          isVideo={activeCall.isVideo}
          onEnd={handleEndCall}
        />
      )}
    </div>
  );
};

export default Index;
