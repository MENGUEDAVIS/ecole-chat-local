
import { supabase } from "@/integrations/supabase/client";
import { Call, CallParticipant } from "@/types/supabase";
import { toast } from "@/components/ui/sonner";

export type RTCPeerData = {
  userId: string;
  peerConnection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  mediaStream?: MediaStream;
  videoElement?: HTMLVideoElement;
};

export type CallEventHandlers = {
  onIncomingCall?: (callId: string, callerId: string, isVideo: boolean) => void;
  onCallAccepted?: (callId: string, participantId: string) => void;
  onCallEnded?: (callId: string, reason?: string) => void;
  onStreamAdded?: (participantId: string, stream: MediaStream) => void;
  onStreamRemoved?: (participantId: string) => void;
};

class WebRTCService {
  private peers: Map<string, RTCPeerData> = new Map();
  private localStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private currentUserId: string | null = null;
  private handlers: CallEventHandlers = {};
  private callChannel: any = null;

  constructor() {
    // Configuration STUN/TURN pour traverser les NAT
    this.peerConfig = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    };
  }

  private peerConfig: RTCConfiguration;
  
  // Initialiser le service avec l'ID de l'utilisateur
  public init(userId: string, handlers: CallEventHandlers = {}) {
    this.currentUserId = userId;
    this.handlers = handlers;
    this.setupRealtimeListeners();
    return this;
  }

  // Configurer les écouteurs Supabase Realtime pour les appels
  private setupRealtimeListeners() {
    if (!this.currentUserId) {
      console.error("WebRTCService: User ID not set");
      return;
    }

    // Canal pour les événements d'appel
    this.callChannel = supabase.channel(`call-events-${this.currentUserId}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    });

    this.callChannel
      .on('broadcast', { event: 'call:offer' }, ({ payload }) => {
        const { callId, callerId, isVideo } = payload;
        console.log("Incoming call offer", callId, callerId, isVideo);
        
        if (this.handlers.onIncomingCall) {
          this.handlers.onIncomingCall(callId, callerId, isVideo);
        }
      })
      .on('broadcast', { event: 'call:answer' }, async ({ payload }) => {
        const { callId, answerer, sdp } = payload;
        console.log("Call answer received", callId, answerer);

        if (callId === this.currentCallId) {
          const peerData = this.peers.get(answerer);
          if (peerData) {
            try {
              await peerData.peerConnection.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp })
              );
              
              if (this.handlers.onCallAccepted) {
                this.handlers.onCallAccepted(callId, answerer);
              }
            } catch (err) {
              console.error("Error setting remote description:", err);
            }
          }
        }
      })
      .on('broadcast', { event: 'call:ice-candidate' }, ({ payload }) => {
        const { callId, senderId, candidate } = payload;
        
        if (callId === this.currentCallId) {
          const peerData = this.peers.get(senderId);
          if (peerData) {
            try {
              peerData.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => console.error("Error adding ICE candidate:", err));
            } catch (err) {
              console.error("Error parsing ICE candidate:", err);
            }
          }
        }
      })
      .on('broadcast', { event: 'call:end' }, ({ payload }) => {
        const { callId, endedBy, reason } = payload;
        
        if (callId === this.currentCallId) {
          this.endCurrentCall(false); // Ne pas diffuser à nouveau
          
          if (this.handlers.onCallEnded) {
            this.handlers.onCallEnded(callId, reason);
          }
        }
      })
      .subscribe();
  }

  // Démarrer un nouvel appel
  public async startCall(conversationId: string, participants: string[], isVideo: boolean = false): Promise<string> {
    if (!this.currentUserId) {
      throw new Error("User not initialized");
    }

    try {
      // Créer un enregistrement d'appel dans la base de données
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .insert({
          conversation_id: conversationId,
          initiated_by: this.currentUserId,
          is_video: isVideo,
          status: 'ongoing'
        })
        .select()
        .single();

      if (callError) throw callError;
      
      const call = callData as Call;
      this.currentCallId = call.id;

      // Demander l'accès au micro et/ou à la caméra
      const constraints = {
        audio: true,
        video: isVideo
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Ajouter l'initiateur comme participant
      await supabase
        .from('call_participants')
        .insert({
          call_id: call.id,
          user_id: this.currentUserId,
        });

      // Notifier les participants
      for (const participantId of participants) {
        if (participantId !== this.currentUserId) {
          // Créer une connexion peer pour chaque participant
          const peerConnection = this.createPeerConnection(participantId);
          
          // Ajouter les pistes audio/vidéo à la connexion
          this.localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.localStream!);
          });
          
          // Créer l'offre
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          // Envoyer l'offre via Supabase Realtime
          await supabase.channel(`call-events-${participantId}`).send({
            type: 'broadcast',
            event: 'call:offer',
            payload: {
              callId: call.id,
              callerId: this.currentUserId,
              isVideo,
              sdp: offer.sdp
            },
          });
        }
      }

      return call.id;
    } catch (error) {
      console.error("Failed to start call:", error);
      toast.error("Impossible de démarrer l'appel", {
        description: "Vérifiez votre connexion et les permissions du navigateur",
      });
      throw error;
    }
  }

  // Répondre à un appel entrant
  public async answerCall(callId: string, callerId: string, isVideo: boolean): Promise<void> {
    try {
      if (!this.currentUserId) {
        throw new Error("User not initialized");
      }
      
      this.currentCallId = callId;
      
      // Demander l'accès au micro et/ou à la caméra
      const constraints = {
        audio: true,
        video: isVideo
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Rejoindre l'appel en tant que participant
      await supabase
        .from('call_participants')
        .insert({
          call_id: callId,
          user_id: this.currentUserId,
        });
      
      // Créer une connexion peer pour l'appelant
      const peerConnection = this.createPeerConnection(callerId);
      
      // Ajouter les pistes audio/vidéo à la connexion
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
      
      // Créer la réponse
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Envoyer la réponse via Supabase Realtime
      await supabase.channel(`call-events-${callerId}`).send({
        type: 'broadcast',
        event: 'call:answer',
        payload: {
          callId: callId,
          answerer: this.currentUserId,
          sdp: answer.sdp
        },
      });
      
    } catch (error) {
      console.error("Failed to answer call:", error);
      toast.error("Impossible de répondre à l'appel", {
        description: "Vérifiez votre connexion et les permissions du navigateur",
      });
      throw error;
    }
  }

  // Terminer l'appel en cours
  public async endCurrentCall(broadcast: boolean = true): Promise<void> {
    if (!this.currentCallId || !this.currentUserId) return;
    
    try {
      // Mettre à jour l'enregistrement d'appel
      await supabase
        .from('calls')
        .update({
          status: 'ended',
          end_time: new Date().toISOString()
        })
        .eq('id', this.currentCallId);
      
      // Mettre à jour l'enregistrement du participant
      await supabase
        .from('call_participants')
        .update({
          left_at: new Date().toISOString()
        })
        .eq('call_id', this.currentCallId)
        .eq('user_id', this.currentUserId);
      
      // Notifier les autres participants si demandé
      if (broadcast) {
        this.peers.forEach(async (peer, participantId) => {
          await supabase.channel(`call-events-${participantId}`).send({
            type: 'broadcast',
            event: 'call:end',
            payload: {
              callId: this.currentCallId,
              endedBy: this.currentUserId,
              reason: 'ended_by_user'
            },
          });
        });
      }
      
      // Nettoyer les ressources
      this.cleanup();
      
    } catch (error) {
      console.error("Failed to end call properly:", error);
    }
  }
  
  // Créer une connexion peer pour un participant
  private createPeerConnection(participantId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.peerConfig);
    
    // Stocker la connexion
    this.peers.set(participantId, {
      userId: participantId,
      peerConnection: peerConnection
    });
    
    // Gérer les candidats ICE
    peerConnection.onicecandidate = event => {
      if (event.candidate && this.currentCallId) {
        supabase.channel(`call-events-${participantId}`).send({
          type: 'broadcast',
          event: 'call:ice-candidate',
          payload: {
            callId: this.currentCallId,
            senderId: this.currentUserId,
            candidate: event.candidate
          },
        });
      }
    };
    
    // Gérer les pistes entrantes (audio/vidéo)
    peerConnection.ontrack = event => {
      const peerData = this.peers.get(participantId);
      
      if (peerData && event.streams[0]) {
        peerData.mediaStream = event.streams[0];
        
        if (this.handlers.onStreamAdded) {
          this.handlers.onStreamAdded(participantId, event.streams[0]);
        }
      }
    };
    
    // Gérer la déconnexion
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'closed') {
        
        if (this.handlers.onStreamRemoved) {
          this.handlers.onStreamRemoved(participantId);
        }
      }
    };
    
    return peerConnection;
  }
  
  // Obtenir le flux local (micro/caméra)
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }
  
  // Obtenir le flux d'un participant
  public getParticipantStream(participantId: string): MediaStream | undefined {
    return this.peers.get(participantId)?.mediaStream;
  }
  
  // Désactiver/activer l'audio
  public toggleAudio(mute: boolean): void {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      for (const track of audioTracks) {
        track.enabled = !mute;
      }
    }
  }
  
  // Désactiver/activer la vidéo
  public toggleVideo(hide: boolean): void {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      for (const track of videoTracks) {
        track.enabled = !hide;
      }
    }
  }
  
  // Nettoyer les ressources
  private cleanup(): void {
    // Arrêter les pistes du flux local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
    
    // Fermer les connexions peer
    this.peers.forEach(peer => {
      peer.peerConnection.close();
    });
    
    this.peers.clear();
    this.currentCallId = null;
  }
  
  // Libérer toutes les ressources
  public dispose(): void {
    if (this.currentCallId) {
      this.endCurrentCall();
    }
    
    this.cleanup();
    
    if (this.callChannel) {
      this.callChannel.unsubscribe();
    }
  }
}

// Exporter une instance unique du service
export const webRTCService = new WebRTCService();
export default webRTCService;
