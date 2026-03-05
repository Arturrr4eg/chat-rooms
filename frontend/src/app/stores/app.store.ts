import { create } from "zustand";
import type { AuthUser } from "@/features/auth/api/auth.api";
import type { Room } from "@/features/rooms/api/roomsApi";
import type { ChatMessage } from "@/shared/api/ws";

const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

function readUserFromStorage() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw || raw === "undefined" || raw === "null") {
    localStorage.removeItem(USER_KEY);
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

interface AppState {
  accessToken: string | null;
  user: AuthUser | null;
  currentRoom: Room | null;

  setAuth: (data: { token: string; user: AuthUser }) => void;
  leaveRoom: () => void;
  setCurrentRoom: (room: Room) => void;
  clear: () => void;

  messagesByRoom: Record<string, ChatMessage[]>;
  setRoomMessages: (roomId: string, messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

}

export const useAppStore = create<AppState>((set) => ({
  accessToken: localStorage.getItem(TOKEN_KEY),
  user: readUserFromStorage(),
  currentRoom: null,
  messagesByRoom: {},

  setRoomMessages: (roomId, messages) =>
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: messages,
      },
    })),

  appendMessage: (message) =>
    set((state) => {
      const prev = state.messagesByRoom[message.roomId] ?? [];
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [message.roomId]: [...prev, message],
        },
      };
    }),

  clearMessages: () => set({ messagesByRoom: {} }),

  setAuth: ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ accessToken: token, user });
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),

  leaveRoom: () => set({ currentRoom: null }),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ accessToken: null, user: null, currentRoom: null, messagesByRoom: {} });
  },
}));