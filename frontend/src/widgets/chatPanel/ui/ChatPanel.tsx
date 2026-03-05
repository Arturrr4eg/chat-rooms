import * as React from "react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useAppStore } from "@/app/stores/app.store";
import type { WsClient } from "@/shared/api/ws";

interface ChatPanelProps {
  wsClient: WsClient | null;
}

export function ChatPanel(props: ChatPanelProps) {
  const { wsClient } = props;

  const currentRoom = useAppStore((s) => s.currentRoom);
  const messagesByRoom = useAppStore((s) => s.messagesByRoom);

  const [text, setText] = React.useState("");

  const roomMessages = currentRoom ? messagesByRoom[currentRoom.id] ?? [] : [];

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!currentRoom) return;
    if (!wsClient) return;

    wsClient.send({
      type: "send_message",
      payload: {
        roomId: currentRoom.id,
        text: trimmed,
      },
    });

    setText("");
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") send();
  };

  if (!currentRoom) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="mt-2 text-sm text-muted-foreground">
          Select a room on the left to start.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 flex flex-col gap-4 min-h-[520px]">
      <div>
        <h2 className="text-lg font-semibold">{currentRoom.name}</h2>
        <div className="text-sm text-muted-foreground">
          Messages: {roomMessages.length}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-md border border-border bg-background p-3 space-y-2">
        {roomMessages.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages yet.</div>
        ) : (
          roomMessages.map((m) => (
            <div key={m.id} className="text-sm">
              <span className="font-medium">{m.senderEmail}</span>
              <span className="text-muted-foreground">:</span> {m.text}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
        />
        <Button type="button" onClick={send} disabled={!wsClient}>
          Send
        </Button>
      </div>
    </Card>
  );
}
