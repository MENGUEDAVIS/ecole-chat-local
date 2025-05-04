
import React, { useRef, useState, useEffect } from "react";
import { X, Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import webRTCService from "@/services/WebRTCService";

interface CallScreenProps {
  callId: string;
  participants: { id: string; name: string }[];
  isVideo: boolean;
  onEnd: () => void;
}

const CallScreen: React.FC<CallScreenProps> = ({ callId, participants, isVideo, onEnd }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participantStreams, setParticipantStreams] = useState<Map<string, MediaStream>>(new Map());
  const participantVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Configurer le flux vidéo local
  useEffect(() => {
    const localStream = webRTCService.getLocalStream();
    
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    
    // Configurer le minuteur pour la durée de l'appel
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Gérer les flux des participants
  useEffect(() => {
    const handleStreamAdded = (participantId: string, stream: MediaStream) => {
      setParticipantStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.set(participantId, stream);
        return newStreams;
      });
      
      // Attacher le flux au bon élément vidéo
      setTimeout(() => {
        const videoElement = participantVideoRefs.current.get(participantId);
        if (videoElement && stream) {
          videoElement.srcObject = stream;
        }
      }, 0);
    };
    
    const handleStreamRemoved = (participantId: string) => {
      setParticipantStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(participantId);
        return newStreams;
      });
    };
    
    // Configurer les gestionnaires d'événements
    webRTCService.init(participants[0].id, {
      onStreamAdded: handleStreamAdded,
      onStreamRemoved: handleStreamRemoved,
      onCallEnded: () => {
        toast.info("L'appel est terminé", {
          description: "La communication a été interrompue",
        });
        onEnd();
      }
    });
    
    return () => {
      // Cleanup
    };
  }, [participants, onEnd]);
  
  // Gérer la mise en plein écran
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const container = document.getElementById('call-container');
      if (container) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
          setIsFullscreen(true);
        }
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Gérer le micro
  const toggleMute = () => {
    webRTCService.toggleAudio(!isAudioMuted);
    setIsAudioMuted(!isAudioMuted);
    toast.info(isAudioMuted ? "Micro activé" : "Micro désactivé");
  };
  
  // Gérer la caméra
  const toggleVideo = () => {
    webRTCService.toggleVideo(!isVideoOff);
    setIsVideoOff(!isVideoOff);
    toast.info(isVideoOff ? "Caméra activée" : "Caméra désactivée");
  };
  
  // Terminer l'appel
  const endCall = async () => {
    await webRTCService.endCurrentCall();
    onEnd();
  };
  
  // Formater la durée de l'appel
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs > 0 ? `${hrs}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Déterminer la mise en page en fonction du nombre de participants
  const getGridClass = (): string => {
    const totalParticipants = participants.length;
    
    if (totalParticipants <= 1) {
      return "grid-cols-1";
    } else if (totalParticipants === 2) {
      return "grid-cols-1 md:grid-cols-2";
    } else if (totalParticipants <= 4) {
      return "grid-cols-2";
    } else {
      return "grid-cols-2 md:grid-cols-3";
    }
  };
  
  return (
    <div 
      id="call-container" 
      className="fixed inset-0 z-50 bg-gray-900 flex flex-col"
    >
      <div className="bg-gray-800 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-white font-semibold">Appel {isVideo ? "vidéo" : "audio"}</span>
          <div className="ml-2 bg-gray-700 px-2 py-1 rounded text-gray-200 text-xs">
            {formatDuration(callDuration)}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEnd}>
          <X className="h-5 w-5 text-white" />
        </Button>
      </div>
      
      <div className={`flex-1 grid ${getGridClass()} gap-2 p-2 overflow-hidden`}>
        {/* Vidéo locale */}
        <div className="relative bg-gray-800 rounded overflow-hidden flex items-center justify-center">
          {isVideo ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-ecole-primary flex items-center justify-center">
              <span className="text-2xl text-white font-bold">
                {participants[0]?.name?.charAt(0) || "U"}
              </span>
            </div>
          )}
          
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-ecole-primary flex items-center justify-center">
                <span className="text-3xl text-white font-bold">
                  {participants[0]?.name?.charAt(0) || "U"}
                </span>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-70 px-2 py-1 rounded text-white text-sm">
            {participants[0]?.name || "Vous"} {isAudioMuted && <MicOff className="h-4 w-4 inline" />}
          </div>
        </div>
        
        {/* Vidéos des participants */}
        {participants.slice(1).map((participant) => (
          <div key={participant.id} className="relative bg-gray-800 rounded overflow-hidden flex items-center justify-center">
            {isVideo ? (
              <video
                ref={(el) => {
                  participantVideoRefs.current.set(participant.id, el);
                  
                  // Si le stream est déjà disponible, l'attacher
                  const stream = participantStreams.get(participant.id);
                  if (el && stream) {
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-ecole-accent flex items-center justify-center">
                <span className="text-2xl text-white font-bold">
                  {participant.name.charAt(0)}
                </span>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-70 px-2 py-1 rounded text-white text-sm">
              {participant.name}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gray-800 p-4 flex justify-center items-center space-x-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-gray-700 border-0 hover:bg-gray-600"
          onClick={toggleMute}
        >
          {isAudioMuted ? (
            <MicOff className="h-6 w-6 text-red-500" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
        </Button>
        
        {isVideo && (
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-gray-700 border-0 hover:bg-gray-600"
            onClick={toggleVideo}
          >
            {isVideoOff ? (
              <VideoOff className="h-6 w-6 text-red-500" />
            ) : (
              <Video className="h-6 w-6 text-white" />
            )}
          </Button>
        )}
        
        <Button 
          variant="destructive" 
          size="icon" 
          className="rounded-full"
          onClick={endCall}
        >
          <Phone className="h-6 w-6 text-white rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
};

export default CallScreen;
