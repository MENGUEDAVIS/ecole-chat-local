
import React, { useState } from "react";
import { User } from "@/types/chat";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, X, Lock, Globe, Eye } from "lucide-react";
import Avatar from "./Avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface CreateGroupModalProps {
  users: User[];
  currentUser: User;
  onCreateGroup: (
    name: string, 
    participants: User[], 
    category: "project" | "club" | "class" | "other",
    visibility: "private" | "public" | "moderated",
    description?: string
  ) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  users,
  currentUser,
  onCreateGroup,
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<"project" | "club" | "class" | "other">("project");
  const [visibility, setVisibility] = useState<"private" | "public" | "moderated">("private");
  const [description, setDescription] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.id !== currentUser.id &&
      !selectedUsers.some((selected) => selected.id === user.id) &&
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchTerm("");
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedUsers.length > 0) {
      onCreateGroup(groupName, selectedUsers, category, visibility, description.trim() || undefined);
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setGroupName("");
    setSelectedUsers([]);
    setSearchTerm("");
    setCategory("project");
    setVisibility("private");
    setDescription("");
  };
  
  const renderVisibilityOptions = () => {
    return (
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div 
          className={`p-3 border rounded-md cursor-pointer transition-colors flex flex-col items-center gap-2 ${visibility === 'private' ? 'bg-ecole-primary/10 border-ecole-primary' : ''}`}
          onClick={() => setVisibility("private")}
        >
          <Lock className={visibility === 'private' ? 'text-ecole-primary' : 'text-ecole-meta'} />
          <span className="text-xs font-medium">🔒 Privé</span>
          <span className="text-xs text-center text-ecole-meta">Sur invitation uniquement</span>
        </div>
        <div 
          className={`p-3 border rounded-md cursor-pointer transition-colors flex flex-col items-center gap-2 ${visibility === 'public' ? 'bg-ecole-primary/10 border-ecole-primary' : ''}`}
          onClick={() => setVisibility("public")}
        >
          <Globe className={visibility === 'public' ? 'text-ecole-primary' : 'text-ecole-meta'} />
          <span className="text-xs font-medium">🌍 Public</span>
          <span className="text-xs text-center text-ecole-meta">Rejoignable par lien</span>
        </div>
        <div 
          className={`p-3 border rounded-md cursor-pointer transition-colors flex flex-col items-center gap-2 ${visibility === 'moderated' ? 'bg-ecole-primary/10 border-ecole-primary' : ''}`}
          onClick={() => setVisibility("moderated")}
        >
          <Eye className={visibility === 'moderated' ? 'text-ecole-primary' : 'text-ecole-meta'} />
          <span className="text-xs font-medium">👁️ Modéré</span>
          <span className="text-xs text-center text-ecole-meta">Validation requise</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="w-full bg-ecole-accent text-ecole-text font-medium py-2 rounded-md flex items-center justify-center hover:bg-ecole-accent/90">
          <Users size={18} className="mr-2" />
          Nouveau groupe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau groupe</DialogTitle>
          <DialogDescription>
            Personnalisez votre groupe et ajoutez des participants.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Infos</TabsTrigger>
            <TabsTrigger value="members" className="flex-1">Membres</TabsTrigger>
            <TabsTrigger value="privacy" className="flex-1">Confidentialité</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="group-name">Nom du groupe</Label>
              <Input
                id="group-name"
                placeholder="Nom du groupe..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="group-category">Type de groupe</Label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">📝 Projet</SelectItem>
                  <SelectItem value="club">🎭 Club</SelectItem>
                  <SelectItem value="class">🏫 Classe</SelectItem>
                  <SelectItem value="other">📁 Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                placeholder="Décrivez l'objectif de ce groupe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-4 mt-4">
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center gap-1 bg-ecole-primary/10 rounded-full pl-1 pr-2 py-1"
                  >
                    <Avatar 
                      src={user.avatar} 
                      alt={user.name} 
                      status={user.status} 
                      className="w-6 h-6" 
                    />
                    <span className="text-xs">{user.name}</span>
                    <button 
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-ecole-meta hover:text-ecole-offline"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <Label htmlFor="participants">Ajouter des participants</Label>
              <Input
                id="participants"
                placeholder="Rechercher des utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {searchTerm && filteredUsers.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto bg-white mt-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-2 flex items-center hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleAddUser(user)}
                    >
                      <Avatar 
                        src={user.avatar} 
                        alt={user.name} 
                        status={user.status} 
                      />
                      <div className="ml-2">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-ecole-meta">
                          {user.role === "teacher" ? "Professeur" : 
                           user.role === "student" ? "Élève" : "Personnel"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div>
              <Label className="block mb-2">Visibilité du groupe</Label>
              {renderVisibilityOptions()}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={() => {
            setOpen(false);
            resetForm();
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0}
          >
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
