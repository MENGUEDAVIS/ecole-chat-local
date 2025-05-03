
import React from "react";
import { MessageSquarePlus, Users, X, UserRound, Menu } from "lucide-react";
import { User } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateDirectMessageModal from "./CreateDirectMessageModal";
import CreateGroupModal from "./CreateGroupModal";
import Avatar from "./Avatar";
import { Link } from "react-router-dom";

interface ActionsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  users: User[];
  currentUser: User;
  onStartConversation: (userId: string) => void;
  onCreateGroup: (
    name: string, 
    participants: User[], 
    category: "project" | "club" | "class" | "other",
    visibility: "private" | "public" | "moderated",
    description?: string
  ) => void;
}

const ActionsSidebar: React.FC<ActionsSidebarProps> = ({
  isOpen,
  onToggle,
  users,
  currentUser,
  onStartConversation,
  onCreateGroup
}) => {
  const isMobile = useIsMobile();
  
  if (!isOpen && (isMobile || !isOpen)) {
    return null;
  }

  return (
    <div className={`
      w-72 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      flex flex-col z-50 fixed left-0 top-0
      transition-all duration-300 ease-in-out 
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      ${isMobile ? "shadow-lg" : ""}
    `}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-ecole-primary dark:bg-gray-700 text-white">
        <h2 className="text-lg font-semibold">Actions</h2>
        <Button variant="ghost" size="icon" onClick={onToggle} className="text-white hover:bg-ecole-primary/80 dark:hover:bg-gray-600">
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex flex-col p-4 space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Messages</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquarePlus className="h-5 w-5 mr-2" />
                Nouvelle conversation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle conversation</DialogTitle>
              </DialogHeader>
              <CreateDirectMessageModal
                users={users}
                currentUser={currentUser}
                onStartConversation={onStartConversation}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Groupe</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-5 w-5 mr-2" />
                Créer un groupe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un groupe</DialogTitle>
              </DialogHeader>
              <CreateGroupModal
                users={users}
                currentUser={currentUser}
                onCreateGroup={onCreateGroup}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contacts</h3>
          <Button className="w-full justify-start" variant="outline" asChild>
            <Link to="/directory">
              <UserRound className="h-5 w-5 mr-2" />
              Annuaire des contacts
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Avatar 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            status={currentUser.status}
          />
          <div className="ml-3">
            <div className="font-medium text-gray-800 dark:text-white">{currentUser.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentUser.role === "teacher" ? "Professeur" : 
               currentUser.role === "student" ? "Élève" : "Personnel"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsSidebar;
