import { supabase } from "@/integrations/supabase/client";
import { Conversation, Message, Profile, ConversationParticipant, Attachment } from "@/types/supabase";
import { toast } from "@/components/ui/sonner";

export type ConversationWithParticipants = Conversation & {
  participants: Profile[];
};

export type MessageWithSender = Message & {
  sender: Profile | null;
  attachments?: Attachment[];
};

class ChatService {
  private messageListeners: Map<string, () => void> = new Map();
  private conversationListeners: Map<string, () => void> = new Map();
  
  // Obtenir toutes les conversations d'un utilisateur
  public async getUserConversations(userId: string): Promise<ConversationWithParticipants[]> {
    try {
      // Obtenir les IDs de conversation où l'utilisateur est participant
      const { data: participations, error: participationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);
        
      if (participationsError) throw participationsError;
      if (!participations.length) return [];
      
      const conversationIds = participations.map(p => p.conversation_id);
      
      // Obtenir les détails des conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });
        
      if (conversationsError) throw conversationsError;
      
      // Pour chaque conversation, obtenir les participants
      const conversationsWithParticipants = await Promise.all(
        conversations.map(async (conversation) => {
          const { data: participants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversation.id);
            
          if (participantsError) throw participantsError;
          
          const participantIds = participants.map(p => p.user_id);
          
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', participantIds);
            
          if (profilesError) throw profilesError;

          // Ajouter la propriété 'name' aux profils pour compatibilité avec User
          const enhancedProfiles = (profiles || []).map(profile => ({
            ...profile,
            name: profile.full_name || profile.username || profile.id
          }));
          
          return {
            ...conversation,
            type: conversation.type as 'private' | 'group' | 'channel',
            participants: enhancedProfiles || []
          } as ConversationWithParticipants;
        })
      );
      
      return conversationsWithParticipants;
    } catch (error) {
      console.error("Failed to get conversations:", error);
      throw error;
    }
  }
  
  // Obtenir les messages d'une conversation
  public async getConversationMessages(conversationId: string): Promise<MessageWithSender[]> {
    try {
      // Obtenir les messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      // Obtenir les pièces jointes pour tous les messages
      const messageIds = messages.map(message => message.id);
      const { data: attachments, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds);
        
      if (attachmentsError) throw attachmentsError;
      
      // Regrouper les pièces jointes par message
      const attachmentsByMessage = attachments?.reduce((acc, attachment) => {
        if (!acc[attachment.message_id]) {
          acc[attachment.message_id] = [];
        }
        acc[attachment.message_id].push({
          ...attachment,
          type: attachment.type as 'image' | 'document' | 'voice' | 'other'
        });
        return acc;
      }, {} as Record<string, Attachment[]>) || {};
      
      // Obtenir les profils des expéditeurs
      const senderIds = Array.from(new Set(messages.map(m => m.sender_id).filter(id => id !== null)));
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);
        
      if (profilesError) throw profilesError;

      // Ajouter la propriété 'name' aux profils pour compatibilité avec User
      const enhancedProfiles = (profiles || []).map(profile => ({
        ...profile,
        role: profile.role as 'student' | 'teacher' | 'staff',
        name: profile.full_name || profile.username || profile.id
      }));
      
      const profileMap = enhancedProfiles.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, Profile>);
      
      // Combiner les messages avec les expéditeurs et les pièces jointes
      const messagesWithSenders = messages.map(message => ({
        ...message,
        senderId: message.sender_id, // Ajout pour compatibilité
        status: message.status as 'sent' | 'pending' | 'failed',
        type: (message.type || 'text') as 'text' | 'voice' | 'emoji',
        sender: message.sender_id ? profileMap[message.sender_id] || null : null,
        attachments: attachmentsByMessage[message.id] || []
      })) as MessageWithSender[];
      
      return messagesWithSenders;
    } catch (error) {
      console.error("Failed to get messages:", error);
      throw error;
    }
  }
  
  // Créer une nouvelle conversation privée
  public async createPrivateConversation(creator: Profile, recipient: Profile): Promise<string> {
    try {
      // Vérifier si une conversation existe déjà entre ces deux utilisateurs
      const { data: existingConversations, error: existingError } = await supabase
        .from('conversations')
        .select('id')
        .eq('type', 'private')
        .filter('created_by', 'eq', creator.id);
        
      if (existingError) throw existingError;
      
      if (existingConversations && existingConversations.length > 0) {
        const conversationIds = existingConversations.map(c => c.id);
        
        const { data: participations, error: participationsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', conversationIds)
          .in('user_id', [creator.id, recipient.id]);
          
        if (participationsError) throw participationsError;
        
        // Grouper les participations par conversation
        const participationsByConversation = participations.reduce((acc, participation) => {
          if (!acc[participation.conversation_id]) {
            acc[participation.conversation_id] = [];
          }
          acc[participation.conversation_id].push(participation.user_id);
          return acc;
        }, {} as Record<string, string[]>);
        
        // Trouver une conversation qui contient exactement ces deux utilisateurs
        const existingConversationId = Object.entries(participationsByConversation)
          .find(([_, userIds]) => 
            userIds.length === 2 && 
            userIds.includes(creator.id) && 
            userIds.includes(recipient.id)
          )?.[0];
          
        if (existingConversationId) {
          return existingConversationId;
        }
      }
      
      // Créer une nouvelle conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          type: 'private',
          name: recipient.full_name || recipient.username || 'Conversation',
          created_by: creator.id,
          avatar_url: recipient.avatar_url
        })
        .select()
        .single();
        
      if (conversationError) throw conversationError;
      
      // Ajouter les participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: creator.id },
          { conversation_id: conversation.id, user_id: recipient.id }
        ]);
        
      if (participantsError) throw participantsError;
      
      return conversation.id;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Impossible de créer la conversation", {
        description: "Veuillez réessayer plus tard",
      });
      throw error;
    }
  }
  
  // Créer une conversation de groupe
  public async createGroupConversation(
    creator: Profile, 
    name: string, 
    participants: Profile[],
    category: 'project' | 'club' | 'class' | 'other',
    visibility: 'private' | 'public' | 'moderated',
    description?: string
  ): Promise<string> {
    try {
      // Créer la conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name,
          created_by: creator.id,
          category,
          visibility,
          description
        })
        .select()
        .single();
        
      if (conversationError) throw conversationError;
      
      // Ajouter les participants, y compris le créateur
      const participantsData = [
        { conversation_id: conversation.id, user_id: creator.id },
        ...participants.map(p => ({ 
          conversation_id: conversation.id, 
          user_id: p.id 
        }))
      ];
      
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participantsData);
        
      if (participantsError) throw participantsError;
      
      return conversation.id;
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Impossible de créer le groupe", {
        description: "Veuillez réessayer plus tard",
      });
      throw error;
    }
  }
  
  // Envoyer un message
  public async sendMessage(
    conversationId: string, 
    senderId: string, 
    content: string,
    type: 'text' | 'voice' | 'emoji' = 'text',
    files?: File[]
  ): Promise<Message> {
    try {
      const status = navigator.onLine ? 'sent' : 'pending';
      
      // Insérer le message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          status,
          type
        })
        .select()
        .single();
        
      if (messageError) throw messageError;

      // Adaptation du message pour la compatibilité
      const enhancedMessage = {
        ...message,
        senderId: message.sender_id,
        status: message.status as 'sent' | 'pending' | 'failed',
        type: (message.type || 'text') as 'text' | 'voice' | 'emoji'
      };
      
      // Mettre à jour la date de dernière modification de la conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      // Gérer les pièces jointes si nécessaire
      if (files && files.length > 0) {
        const attachments = await Promise.all(
          files.map(async (file) => {
            // Déterminer le type de pièce jointe
            let attachmentType: 'image' | 'document' | 'voice' | 'other' = 'other';
            
            if (file.type.startsWith('image/')) {
              attachmentType = 'image';
            } else if (file.type.startsWith('audio/')) {
              attachmentType = 'voice';
            } else if (file.type.startsWith('application/')) {
              attachmentType = 'document';
            }
            
            // Télécharger le fichier
            const fileName = `${senderId}/${Date.now()}-${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('attachments')
              .upload(fileName, file);
              
            if (uploadError) throw uploadError;
            
            const { data: urlData } = await supabase
              .storage
              .from('attachments')
              .getPublicUrl(fileName);
              
            // Créer l'entrée de pièce jointe
            const { data: attachment, error: attachmentError } = await supabase
              .from('attachments')
              .insert({
                message_id: message.id,
                name: file.name,
                type: attachmentType,
                url: urlData.publicUrl,
                size: `${Math.round(file.size / 1024)} KB`,
                duration: attachmentType === 'voice' ? 0 : undefined // À compléter pour les fichiers audio
              })
              .select()
              .single();
              
            if (attachmentError) throw attachmentError;
            
            return attachment as Attachment;
          })
        );
        
        return {
          ...enhancedMessage,
          attachments
        } as Message;
      }
      
      return enhancedMessage as Message;
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Impossible d'envoyer le message", {
        description: "Veuillez réessayer plus tard",
      });
      throw error;
    }
  }
  
  // Épingler un message
  public async pinMessage(messageId: string, isPinned: boolean): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId);
    } catch (error) {
      console.error("Failed to pin message:", error);
      toast.error(isPinned ? "Impossible d'épingler le message" : "Impossible de désépingler le message", {
        description: "Veuillez réessayer plus tard",
      });
      throw error;
    }
  }
  
  // S'abonner aux nouveaux messages d'une conversation
  public subscribeToMessages(conversationId: string, callback: (message: MessageWithSender) => void): () => void {
    // Désabonner si déjà abonné
    this.unsubscribeFromMessages(conversationId);
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        const newMessage = payload.new as Message;
        
        // Obtenir le profil de l'expéditeur
        let sender = null;
        if (newMessage.sender_id) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();

          if (data) {
            sender = {
              ...data,
              name: data.full_name || data.username || data.id,
              role: data.role as 'student' | 'teacher' | 'staff',
            };
          }
        }
        
        // Obtenir les pièces jointes du message
        const { data: attachments } = await supabase
          .from('attachments')
          .select('*')
          .eq('message_id', newMessage.id);
        
        const typedAttachments = (attachments || []).map(att => ({
          ...att,
          type: att.type as 'image' | 'document' | 'voice' | 'other'
        }));
        
        callback({
          ...newMessage,
          senderId: newMessage.sender_id,
          status: newMessage.status as 'sent' | 'pending' | 'failed',
          type: (newMessage.type || 'text') as 'text' | 'voice' | 'emoji',
          sender,
          attachments: typedAttachments
        });
      })
      .subscribe();
    
    // Stocker la fonction de désabonnement
    const unsubscribe = () => {
      channel.unsubscribe();
    };
    
    this.messageListeners.set(conversationId, unsubscribe);
    
    return unsubscribe;
  }
  
  // Se désabonner des nouveaux messages d'une conversation
  public unsubscribeFromMessages(conversationId: string): void {
    const unsubscribe = this.messageListeners.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      this.messageListeners.delete(conversationId);
    }
  }
  
  // S'abonner aux changements de conversations
  public subscribeToConversations(userId: string, callback: () => void): () => void {
    // Désabonner si déjà abonné
    this.unsubscribeFromConversations(userId);
    
    const channel = supabase
      .channel(`user:${userId}:conversations`)
      .on('postgres_changes', { 
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${userId}`
      }, callback)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=in.(SELECT conversation_id FROM conversation_participants WHERE user_id = '${userId}')`
      }, callback)
      .subscribe();
    
    // Stocker la fonction de désabonnement
    const unsubscribe = () => {
      channel.unsubscribe();
    };
    
    this.conversationListeners.set(userId, unsubscribe);
    
    return unsubscribe;
  }
  
  // Se désabonner des changements de conversations
  public unsubscribeFromConversations(userId: string): void {
    const unsubscribe = this.conversationListeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.conversationListeners.delete(userId);
    }
  }
  
  // Rechercher des utilisateurs
  public async searchUsers(query: string, currentUserId: string): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .limit(10);
        
      if (error) throw error;
      
      // Ajouter la propriété 'name' aux profils pour compatibilité avec User
      return (data || []).map(profile => ({
        ...profile,
        role: profile.role as 'student' | 'teacher' | 'staff',
        name: profile.full_name || profile.username || profile.id
      }));
    } catch (error) {
      console.error("Failed to search users:", error);
      throw error;
    }
  }
  
  // Nettoyer les ressources
  public cleanup(): void {
    // Désabonner de tous les canaux de messages
    Array.from(this.messageListeners.values()).forEach(unsubscribe => unsubscribe());
    this.messageListeners.clear();
    
    // Désabonner de tous les canaux de conversations
    Array.from(this.conversationListeners.values()).forEach(unsubscribe => unsubscribe());
    this.conversationListeners.clear();
  }
}

// Exporter une instance unique du service
export const chatService = new ChatService();
export default chatService;
