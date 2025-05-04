
import { useCallback, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import webRTCService from "@/services/WebRTCService";
import { Profile } from "@/types/supabase";
import { ConversationWithParticipants } from "@/services/ChatService";

export type CallState = {
  callId: string;
  participants: { id: string; name: string }[];
  isVideo: boolean;
} | null;

export type IncomingCallData = {
  callId: string;
  callerId: string;
  isVideo: boolean;
} | null;

export function useCallManagement(userId: string | undefined, profile: Profile | null) {
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData>(null);
  const [activeCall, setActiveCall] = useState<CallState>(null);
  const [callerProfile, setCallerProfile] = useState<Profile | null>(null);

  // Handle incoming calls
  const handleIncomingCall = useCallback(async (callId: string, callerId: string, isVideo: boolean) => {
    // Retrieve caller profile
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

  // Initialize call service
  const initCallService = useCallback(() => {
    if (!userId) return;

    webRTCService.init(userId, {
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

    return () => {
      webRTCService.dispose();
    };
  }, [userId, handleIncomingCall]);

  // Initiate new call
  const initiateCall = async (
    selectedConversation: ConversationWithParticipants | null,
    isVideo: boolean = false
  ) => {
    if (!selectedConversation || !userId || !profile) {
      toast.error("Impossible de démarrer un appel", {
        description: "Aucune conversation sélectionnée.",
      });
      return;
    }

    try {
      toast.info(isVideo ? "Appel vidéo en cours" : "Appel audio en cours", {
        description: `Appel vers ${selectedConversation.name || "conversation"} en préparation...`,
      });
      
      // Get participant IDs
      const participantIds = selectedConversation.participants
        .filter(p => p.id !== userId)
        .map(p => p.id);
      
      // Start the call
      const callId = await webRTCService.startCall(
        selectedConversation.id,
        participantIds,
        isVideo
      );
      
      // Set active call
      setActiveCall({
        callId,
        participants: [
          { id: userId, name: profile.full_name || profile.username || "Vous" },
          ...selectedConversation.participants
            .filter(p => p.id !== userId)
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

  // Answer incoming call
  const answerCall = async (
    conversations: ConversationWithParticipants[],
    chatService: any
  ) => {
    if (!incomingCallData || !callerProfile || !userId || !profile) return;
    
    try {
      await webRTCService.answerCall(
        incomingCallData.callId, 
        incomingCallData.callerId, 
        incomingCallData.isVideo
      );
      
      // Find or create conversation with caller
      let conversationId = "";
      const existingConversation = conversations.find(
        conv => conv.type === "private" && conv.participants.some(p => p.id === incomingCallData.callerId)
      );
      
      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        conversationId = await chatService.createPrivateConversation(profile, callerProfile);
      }
      
      // Set active call
      setActiveCall({
        callId: incomingCallData.callId,
        participants: [
          { id: userId, name: profile.full_name || profile.username || "Vous" },
          { id: callerProfile.id, name: callerProfile.full_name || callerProfile.username || "Appelant" }
        ],
        isVideo: incomingCallData.isVideo
      });
      
      // Close incoming call dialog
      setIsIncomingCall(false);
      setIncomingCallData(null);
      
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error("Erreur lors de la réponse à l'appel", {
        description: "Veuillez vérifier votre connexion et les permissions du navigateur.",
      });
    }
  };

  // Decline incoming call
  const declineCall = async () => {
    if (!incomingCallData) return;
    
    try {
      await webRTCService.endCurrentCall();
      setIsIncomingCall(false);
      setIncomingCallData(null);
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  // End active call
  const endCall = () => {
    setActiveCall(null);
    webRTCService.endCurrentCall();
  };

  return {
    isIncomingCall,
    incomingCallData,
    activeCall,
    callerProfile,
    initCallService,
    initiateCall,
    answerCall,
    declineCall,
    endCall
  };
}
