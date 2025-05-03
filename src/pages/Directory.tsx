
import React, { useState } from "react";
import { Search, GraduationCap, School, Briefcase, ArrowLeft, Menu } from "lucide-react";
import { mockUsers } from "@/data/mockData";
import Avatar from "@/components/chat/Avatar";
import { User } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeToggle from "@/components/chat/ThemeToggle";

const Directory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  
  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = mockUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Classer les utilisateurs par rôle
  const teachers = filteredUsers.filter((user) => user.role === "teacher");
  const students = filteredUsers.filter((user) => user.role === "student");
  const staff = filteredUsers.filter((user) => user.role === "staff");
  
  // Fonction pour afficher un utilisateur
  const renderUser = (user: User) => (
    <div 
      key={user.id}
      className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <Avatar 
        src={user.avatar} 
        alt={user.name} 
        status={user.status}
      />
      <div className="ml-3 flex-1">
        <div className="font-medium text-gray-800 dark:text-white">{user.name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {user.role === "teacher" ? "Enseignant" : 
           user.role === "student" ? "Étudiant" : "Personnel"}
        </div>
      </div>
      <div className="flex gap-2">
        <Link to={`/?contact=${user.id}`}>
          <Button size="sm" variant="ghost">
            Message
          </Button>
        </Link>
      </div>
    </div>
  );
  
  // Fonction pour afficher la section de rôle
  const renderRoleSection = (users: User[], title: string, icon: React.ReactNode) => (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3 px-4">
        {icon}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
        <div className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5">
          {users.length}
        </div>
      </div>
      <div className="space-y-1">
        {users.length > 0 ? (
          users.map(renderUser)
        ) : (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-ecole-primary dark:bg-gray-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-ecole-primary/80 dark:hover:bg-gray-600 mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Annuaire des contacts</h1>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 py-3 sticky top-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
          />
          <Input
            type="text"
            placeholder="Rechercher un contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-ecole-primary dark:focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Tabs for mobile */}
      {isMobile ? (
        <Tabs defaultValue="all" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 px-2 py-1 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="teachers">Enseignants</TabsTrigger>
            <TabsTrigger value="students">Étudiants</TabsTrigger>
            <TabsTrigger value="staff">Personnel</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto p-2">
            <TabsContent value="all" className="mt-0">
              {renderRoleSection(teachers, "Enseignants", <School className="h-5 w-5 text-blue-500" />)}
              {renderRoleSection(students, "Étudiants", <GraduationCap className="h-5 w-5 text-green-500" />)}
              {renderRoleSection(staff, "Personnel", <Briefcase className="h-5 w-5 text-purple-500" />)}
            </TabsContent>
            <TabsContent value="teachers" className="mt-0">
              {renderRoleSection(teachers, "Enseignants", <School className="h-5 w-5 text-blue-500" />)}
            </TabsContent>
            <TabsContent value="students" className="mt-0">
              {renderRoleSection(students, "Étudiants", <GraduationCap className="h-5 w-5 text-green-500" />)}
            </TabsContent>
            <TabsContent value="staff" className="mt-0">
              {renderRoleSection(staff, "Personnel", <Briefcase className="h-5 w-5 text-purple-500" />)}
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {renderRoleSection(teachers, "Enseignants", <School className="h-5 w-5 text-blue-500" />)}
          {renderRoleSection(students, "Étudiants", <GraduationCap className="h-5 w-5 text-green-500" />)}
          {renderRoleSection(staff, "Personnel", <Briefcase className="h-5 w-5 text-purple-500" />)}
        </div>
      )}
      
      <ThemeToggle />
    </div>
  );
};

export default Directory;
