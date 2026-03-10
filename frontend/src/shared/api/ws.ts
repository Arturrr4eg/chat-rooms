export interface ChatMessage {
  id: string;
  roomId: string;
  text: string;
  senderUsername: string;
  createdAt: string;
}

export type WsIncoming =
  | { type: "message"; payload: ChatMessage }
  | { type: "room_messages"; payload: { roomId: string; messages: ChatMessage[] } }
  | { type: "error"; message: string };

export type WsOutgoing =
  | { type: "get_room_messages"; payload: { roomId: string } }
  | { type: "send_message"; payload: { roomId: string; text: string } }
  | { type: "leave_room" };

type Listener = (data: WsIncoming) => void;

export interface WsClient {
  send: (data: WsOutgoing) => void;
  onMessage: (listener: Listener) => () => void;
  close: () => void;
}

export function createWsClient(url: string, token: string): WsClient {
  const wsUrl = new URL(url);
  wsUrl.searchParams.set("token", token);

  const ws = new WebSocket(wsUrl.toString());
  const listeners = new Set<Listener>();

  ws.addEventListener("message", (event) => {
    try {
      const parsed = JSON.parse(event.data) as WsIncoming;
      listeners.forEach((l) => l(parsed));
    } catch {
      return;
    }
  });

  return {
    send: (data) => {
      const sendNow = () => ws.send(JSON.stringify(data));

      if (ws.readyState === WebSocket.OPEN) sendNow();
      else ws.addEventListener("open", sendNow, { once: true });
    },
    onMessage: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => ws.close(),
  };
}
