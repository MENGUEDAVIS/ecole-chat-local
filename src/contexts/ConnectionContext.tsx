
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface ConnectionContextType {
  isConnected: boolean;
}

const ConnectionContext = createContext<ConnectionContextType>({ isConnected: true });

export const useConnection = () => useContext(ConnectionContext);

export const ConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      toast({
        title: "Connexion rétablie",
        description: "Vous êtes maintenant connecté au réseau.",
        variant: "default",
      });
    };
    
    const handleOffline = () => {
      setIsConnected(false);
      toast({
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
  }, [toast]);

  return (
    <ConnectionContext.Provider value={{ isConnected }}>
      {children}
    </ConnectionContext.Provider>
  );
};
