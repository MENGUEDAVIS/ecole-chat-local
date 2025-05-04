
import React from "react";
import ThemeToggle from "@/components/chat/ThemeToggle";
import Sidebar from "@/components/chat/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import ActionsSidebar from "@/components/chat/ActionsSidebar";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import ConversationManager from "@/components/chat/ConversationManager";

const Index = () => {
  return (
    <ConnectionProvider>
      <ConversationManager
        render={({
          conversations,
          selectedConversation,
          users,
          messages,
          isLoadingMessages,
          isSidebarOpen,
          isActionSidebarOpen,
          isConnected,
          onToggleSidebar,
          onToggleActionSidebar,
          onSelectConversation,
          onSendMessage,
          onPinMessage,
          onStartConversation,
          onCreateGroup,
          onInitiateCall,
          profilesToUsers,
          conversationsToBase
        }) => (
          <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
            <ActionsSidebar 
              isOpen={isActionSidebarOpen}
              onToggle={onToggleActionSidebar}
              users={profilesToUsers(users)}
              currentUser={users.find(u => u.id === selectedConversation?.created_by) || null}
              onStartConversation={onStartConversation}
              onCreateGroup={(name, participantsUsers, category, visibility, description) => {
                // Convert User[] back to Profile[]
                const participantProfiles = participantsUsers.map(u => 
                  users.find(p => p.id === u.id)
                ).filter(Boolean) as any[];
                onCreateGroup(name, participantProfiles, category, visibility, description);
              }}
            />
            
            <Sidebar
              users={profilesToUsers(users)}
              conversations={conversationsToBase(conversations)}
              currentUser={users.find(u => u.id === selectedConversation?.created_by) || null}
              isConnected={isConnected}
              onSelectConversation={onSelectConversation}
              selectedConversationId={selectedConversation?.id || null}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={onToggleSidebar}
              onToggleActionSidebar={onToggleActionSidebar}
            />
            
            <div className="flex flex-col flex-1 h-full">
              <ChatArea
                conversation={selectedConversation}
                currentUser={users.find(u => u.id === selectedConversation?.created_by) || null}
                users={users}
                isConnected={isConnected}
                onSendMessage={onSendMessage}
                onToggleSidebar={onToggleSidebar}
                onPinMessage={onPinMessage}
                onInitiateCall={onInitiateCall}
                isLoadingMessages={isLoadingMessages}
                messages={messages}
              />
            </div>
            
            <ThemeToggle />
          </div>
        )}
      />
    </ConnectionProvider>
  );
};

export default Index;
