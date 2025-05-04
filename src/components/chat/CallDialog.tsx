
import React from "react";
import { Phone, PhoneOff } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Avatar from "./Avatar";
import { Profile } from "@/types/supabase";

interface CallDialogProps {
  isOpen: boolean;
  caller: Profile | null;
  isVideo: boolean;
  onAnswer: () => void;
  onDecline: () => void;
}

const CallDialog: React.FC<CallDialogProps> = ({
  isOpen,
  caller,
  isVideo,
  onAnswer,
  onDecline,
}) => {
  // Audio pour la sonnerie
  const ringRef = React.useRef<HTMLAudioElement | null>(null);
  
  React.useEffect(() => {
    if (isOpen && ringRef.current) {
      ringRef.current.currentTime = 0;
      ringRef.current.loop = true;
      ringRef.current.play().catch(error => {
        console.error("Impossible de lire la sonnerie:", error);
      });
    }
    
    return () => {
      if (ringRef.current) {
        ringRef.current.pause();
      }
    };
  }, [isOpen]);
  
  return (
    <>
      <audio ref={ringRef} src="/sounds/ring.mp3" />
      
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px] flex flex-col items-center p-6">
          <div className="w-20 h-20 mb-4 relative">
            <Avatar
              src={caller?.avatar_url || ""}
              alt={caller?.full_name || caller?.username || "Utilisateur"}
              className="w-full h-full"
              status="online"
            />
            <div className="absolute -right-2 -bottom-2 bg-ecole-primary text-white rounded-full p-2">
              {isVideo ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              )}
            </div>
          </div>
          
          <h3 className="text-lg font-medium mt-2">
            {caller?.full_name || caller?.username || "Inconnu"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {isVideo ? "Appel vidéo entrant" : "Appel entrant"}
          </p>
          
          <div className="flex gap-4">
            <Button
              variant="destructive"
              onClick={onDecline}
              className="rounded-full h-16 w-16 flex items-center justify-center"
            >
              <PhoneOff className="h-8 w-8" />
            </Button>
            
            <Button
              variant="default"
              onClick={onAnswer}
              className="rounded-full h-16 w-16 flex items-center justify-center bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-8 w-8" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CallDialog;
