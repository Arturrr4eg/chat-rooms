import * as React from "react";
import { createWsClient } from "@/shared/api/ws";
import { useAppStore } from "@/app/stores/app.store";
import type { WsClient } from "@/shared/api/ws";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000";

export function useChatSocket(): WsClient | null {
  const accessToken = useAppStore((s) => s.accessToken);
  const currentRoom = useAppStore((s) => s.currentRoom);
  const setRoomMessages = useAppStore((s) => s.setRoomMessages);
  const appendMessage = useAppStore((s) => s.appendMessage);

  const [client, setClient] = React.useState<WsClient | null>(null);

  React.useEffect(() => {
    if (!accessToken) return;

    const c = createWsClient(WS_URL, accessToken);
    setClient(c);

    const unsub = c.onMessage((msg) => {
      if (msg.type === "room_messages") {
        setRoomMessages(msg.payload.roomId, msg.payload.messages);
      }

      if (msg.type === "message") {
        appendMessage(msg.payload);
      }
    });

    return () => {
      unsub();
      c.close();
      setClient(null);
    };
  }, [accessToken, appendMessage, setRoomMessages]);

  React.useEffect(() => {
    if (!client) return;
    if (!currentRoom) return;

    client.send({ type: "get_room_messages", payload: { roomId: currentRoom.id } });
  }, [client, currentRoom]);

  return client;
}
