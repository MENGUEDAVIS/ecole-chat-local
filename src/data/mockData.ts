import { User, Conversation, Message, Attachment, UserState, Call } from "../types/chat";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Jean Dupont",
    status: "online",
    role: "teacher",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "u2",
    name: "Marie Curie",
    status: "online",
    role: "student",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: "u3",
    name: "Pierre Martin",
    status: "offline",
    role: "student",
    lastSeen: "2023-05-03T10:30:00",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "u4",
    name: "Sophie Petit",
    status: "online",
    role: "teacher",
    avatar: "https://i.pravatar.cc/150?img=4",
  },
  {
    id: "u5",
    name: "Thomas Richard",
    status: "offline",
    role: "staff",
    lastSeen: "2023-05-02T16:45:00",
    avatar: "https://i.pravatar.cc/150?img=7",
  },
  {
    id: "u6",
    name: "Clara Mathieu",
    status: "online",
    role: "student",
    avatar: "https://i.pravatar.cc/150?img=9",
  },
  {
    id: "u7",
    name: "Lucas Bernard",
    status: "offline",
    role: "student",
    lastSeen: "2023-05-03T09:15:00",
    avatar: "https://i.pravatar.cc/150?img=11",
  },
  {
    id: "u8",
    name: "Emma Robert",
    status: "online",
    role: "teacher",
    avatar: "https://i.pravatar.cc/150?img=13",
  },
];

export const currentUser: User = {
  id: "u0",
  name: "Vous (Alex Dubois)",
  status: "online",
  role: "teacher",
  avatar: "https://i.pravatar.cc/150?img=8",
};

// Mock Attachments
const mockAttachments: Attachment[] = [
  {
    id: "a1",
    name: "Devoir_Maths.pdf",
    type: "document",
    url: "#",
    size: "2.4 MB",
  },
  {
    id: "a2",
    name: "Cours_Histoire.pdf",
    type: "document",
    url: "#",
    size: "3.7 MB",
  },
  {
    id: "a3",
    name: "Photo_Projet.jpg",
    type: "image",
    url: "#",
    size: "1.2 MB",
  },
];

// Mock Messages
const createMessages = (
  conversationId: string,
  userIds: string[],
  count: number = 10
): Message[] => {
  const messages: Message[] = [];
  const date = new Date();
  
  for (let i = count; i > 0; i--) {
    const sender = i % 2 === 0 ? "u0" : userIds[Math.floor(Math.random() * userIds.length)];
    const hourOffset = Math.floor(i / 2);
    date.setHours(date.getHours() - hourOffset);
    
    messages.push({
      id: `msg-${conversationId}-${i}`,
      content: i === 1 && sender !== "u0" 
        ? "Bonjour, pourriez-vous partager les derniers devoirs en mathématiques ?" 
        : i === 1 && sender === "u0" 
        ? "Je vous ferai parvenir le document dès que possible." 
        : sender === "u0" 
        ? `Ceci est un message envoyé pour tester l'application. Message numéro ${i}.` 
        : `Ceci est un message reçu pour tester l'application. Message numéro ${i}.`,
      senderId: sender,
      timestamp: date.toISOString(),
      status: i <= 2 && sender === "u0" ? "pending" : "sent",
      attachments: i === 2 && sender === "u0" ? [mockAttachments[0]] : undefined,
    });
  }
  
  return messages;
};

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: "c1",
    type: "group",
    name: "Classe 4A",
    participants: mockUsers.filter((u) => ["u2", "u3", "u6", "u7"].includes(u.id)),
    messages: createMessages("c1", ["u2", "u3", "u6", "u7"], 15),
    unreadCount: 3,
    avatar: "",
  },
  {
    id: "c2",
    type: "group",
    name: "Mathématiques",
    participants: mockUsers.filter((u) => ["u1", "u4", "u8"].includes(u.id)),
    messages: createMessages("c2", ["u1", "u4", "u8"], 8),
    unreadCount: 0,
    avatar: "",
  },
  {
    id: "c3",
    type: "group",
    name: "Projet Sciences",
    participants: mockUsers.filter((u) => ["u2", "u6", "u7"].includes(u.id)),
    messages: createMessages("c3", ["u2", "u6", "u7"], 12),
    unreadCount: 5,
    avatar: "",
  },
  {
    id: "c4",
    type: "private",
    name: mockUsers.find((u) => u.id === "u1")?.name || "",
    participants: [mockUsers.find((u) => u.id === "u1") as User],
    messages: createMessages("c4", ["u1"], 7),
    unreadCount: 0,
    avatar: mockUsers.find((u) => u.id === "u1")?.avatar,
  },
  {
    id: "c5",
    type: "private",
    name: mockUsers.find((u) => u.id === "u2")?.name || "",
    participants: [mockUsers.find((u) => u.id === "u2") as User],
    messages: createMessages("c5", ["u2"], 5),
    unreadCount: 2,
    avatar: mockUsers.find((u) => u.id === "u2")?.avatar,
  },
];

// Mock Calls
export const mockCalls: Call[] = [
  {
    id: "call1",
    conversationId: "c4",
    startTime: "2023-05-03T10:00:00",
    endTime: "2023-05-03T10:05:30",
    participants: [mockUsers.find((u) => u.id === "u1") as User, currentUser],
    status: "ended",
    initiatedBy: "u0",
  },
  {
    id: "call2",
    conversationId: "c5",
    startTime: "2023-05-03T11:15:00",
    participants: [mockUsers.find((u) => u.id === "u2") as User, currentUser],
    status: "missed",
    initiatedBy: "u2",
  }
];

// User State
export const userState: UserState = {
  currentUser: currentUser,
  isConnected: false,
  lastSyncTime: "2023-05-03T11:30:00",
};
