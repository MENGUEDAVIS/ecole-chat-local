import React, { useState, FormEvent, useRef } from "react";
import { Paperclip, Mic, MicOff, Send, Smile, X } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[], type?: "text" | "voice" | "emoji") => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (audioBlob) {
      // Conversion du blob audio en fichier
      const audioFile = new File([audioBlob], "message-vocal.wav", { type: "audio/wav" });
      onSendMessage("Message vocal", [audioFile], "voice");
      setAudioBlob(null);
    } else if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments, "text");
      setMessage("");
      setAttachments([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...filesArray]);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(attachments.filter((_, index) => index !== indexToRemove));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Arrêter tous les tracks du stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      setIsRecording(true);
      mediaRecorder.start();
      
      // Démarrer le timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    setRecordingTime(0);
  };
  
  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 px-4 py-3 bg-white"
    >
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded px-3 py-1 text-sm flex items-center"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                className="ml-2 text-ecole-meta hover:text-ecole-offline"
                onClick={() => removeAttachment(index)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {audioBlob && (
        <div className="mb-2 flex items-center bg-ecole-primary/10 p-2 rounded-lg">
          <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-full max-w-[300px]" />
          <button
            type="button"
            className="ml-2 text-ecole-meta hover:text-ecole-offline"
            onClick={cancelRecording}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isRecording ? (
        <div className="flex items-center">
          <div className="flex-1 bg-ecole-primary/10 p-2 rounded-lg flex items-center animate-pulse-subtle">
            <Mic size={18} className="text-ecole-primary mr-2" />
            <span className="text-sm text-ecole-meta">Enregistrement... {formatRecordingTime(recordingTime)}</span>
          </div>
          <button
            type="button"
            className="ml-2 p-2 bg-ecole-offline text-white rounded-full hover:bg-ecole-offline/80"
            onClick={stopRecording}
          >
            <MicOff size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center">
          <label className="flex-shrink-0 cursor-pointer text-ecole-meta hover:text-ecole-primary mr-2">
            <Paperclip size={20} />
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
              disabled={disabled || isRecording}
            />
          </label>

          <button
            type="button"
            className="flex-shrink-0 text-ecole-meta hover:text-ecole-primary mr-2"
            onClick={startRecording}
            disabled={disabled || isRecording || !!audioBlob}
          >
            <Mic size={20} />
          </button>
          
          <button
            type="button"
            className="flex-shrink-0 text-ecole-meta hover:text-ecole-primary mr-2"
            disabled={disabled || isRecording}
          >
            <Smile size={20} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={disabled ? "Hors ligne - Messages en attente" : "Écrivez un message..."}
            disabled={disabled || isRecording || !!audioBlob}
            className="flex-1 py-2 px-3 bg-gray-100 rounded-full focus:outline-none focus:ring-1 focus:ring-ecole-primary text-ecole-text placeholder-ecole-meta"
          />

          <button
            type="submit"
            disabled={disabled || ((!message.trim() && attachments.length === 0) && !audioBlob)}
            className="ml-2 p-2 bg-ecole-accent text-ecole-text rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ecole-accent/90 transition-colors flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      )}
    </form>
  );
};

export default MessageInput;
