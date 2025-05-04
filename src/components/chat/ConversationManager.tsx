
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useConnection } from "@/contexts/ConnectionContext";
import { useCallManagement } from "@/hooks/useCallManagement";
import { useConversationManagement } from "@/hooks/useConversationManagement";
import { Profile } from "@/types/supabase";
import CallDialog from "@/components/chat/CallDialog";
import CallScreen from "@/components/chat/CallScreen";

interface ConversationManagerProps {
  render: (props: {
    conversations: any[];
    selectedConversation: any | null;
    users: Profile[];
    messages: any[];
    isLoadingMessages: boolean;
    isSidebarOpen: boolean;
    isActionSidebarOpen: boolean;
    isConnected: boolean;
    onToggleSidebar: () => void;
    onToggleActionSidebar: () => void;
    onSelectConversation: (id: string) => void;
    onSendMessage: (conversationId: string, content: string, attachments?: File[], type?: "text" | "voice" | "emoji") => void;
    onPinMessage: (conversationId: string, messageId: string) => void;
    onStartConversation: (recipient: Profile) => void;
    onCreateGroup: (name: string, participants: Profile[], category: "project" | "club" | "class" | "other", visibility: "private" | "public" | "moderated", description?: string) => void;
    onInitiateCall: (isVideo?: boolean) => void;
    profileToUser: (profile: Profile) => any;
    profilesToUsers: (profiles: Profile[]) => any[];
    conversationsToBase: (conversations: any[]) => any[];
  }) => React.ReactNode;
}

const ConversationManager: React.FC<ConversationManagerProps> = ({ render }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isActionSidebarOpen, setIsActionSidebarOpen] = useState<boolean>(false);
  
  const { isConnected } = useConnection();
  const { user, profile } = useAuth();
  const location = useLocation();

  const {
    conversations,
    selectedConversationId,
    selectedConversation,
    messages,
    isLoadingMessages,
    selectConversation,
    checkUrlForContact,
    sendMessage,
    pinMessage,
    startConversation,
    createGroup,
    profileToUser,
    profilesToUsers,
    conversationsToBase
  } = useConversationManagement(user?.id, profile);

  const {
    isIncomingCall,
    incomingCallData,
    activeCall,
    callerProfile,
    initCallService,
    initiateCall,
    answerCall,
    declineCall,
    endCall
  } = useCallManagement(user?.id, profile);

  // Check URL for contact parameter
  useEffect(() => {
    checkUrlForContact(users, location);
  }, [location.search, conversations, users, user, profile]);

  // Initialize WebRTC service
  useEffect(() => {
    return initCallService();
  }, [user, users, initCallService]);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*');
          
          if (data) {
            // Ensure data has the correct type
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

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleInitiateCall = (isVideo: boolean = false) => {
    initiateCall(selectedConversation, isVideo);
  };

  const handleAnswerCall = async () => {
    await answerCall(conversations, {
      createPrivateConversation: startConversation
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (window.innerWidth < 768 && isActionSidebarOpen) {
      setIsActionSidebarOpen(false);
    }
  };
  
  const toggleActionSidebar = () => {
    setIsActionSidebarOpen(!isActionSidebarOpen);
    if (window.innerWidth < 768 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {render({
        conversations,
        selectedConversation,
        users,
        messages,
        isLoadingMessages,
        isSidebarOpen,
        isActionSidebarOpen,
        isConnected,
        onToggleSidebar: toggleSidebar,
        onToggleActionSidebar: toggleActionSidebar,
        onSelectConversation: handleSelectConversation,
        onSendMessage: sendMessage,
        onPinMessage: pinMessage,
        onStartConversation: startConversation,
        onCreateGroup: createGroup,
        onInitiateCall: handleInitiateCall,
        profileToUser,
        profilesToUsers,
        conversationsToBase
      })}

      {/* Call dialog */}
      <CallDialog 
        isOpen={isIncomingCall}
        caller={callerProfile}
        isVideo={incomingCallData?.isVideo || false}
        onAnswer={handleAnswerCall}
        onDecline={declineCall}
      />
      
      {/* Call screen */}
      {activeCall && (
        <CallScreen
          callId={activeCall.callId}
          participants={activeCall.participants}
          isVideo={activeCall.isVideo}
          onEnd={endCall}
        />
      )}
    </>
  );
};

export default ConversationManager;
