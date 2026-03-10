import * as React from "react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { useAppStore } from "@/app/stores/app.store";
import type { WsClient } from "@/shared/api/ws";

interface ChatPanelProps {
  wsClient: WsClient | null;
}

export function ChatPanel(props: ChatPanelProps) {
  const { wsClient } = props;

  const currentRoom = useAppStore((s) => s.currentRoom);
  const user = useAppStore((s) => s.user);
  const messagesByRoom = useAppStore((s) => s.messagesByRoom);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const [text, setText] = React.useState("");

  const roomMessages = React.useMemo(
    () => (currentRoom ? messagesByRoom[currentRoom.id] ?? [] : []),
    [currentRoom, messagesByRoom]
  );

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

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [roomMessages]);

  if (!currentRoom) {
    return (
      <Card className="p-4 shadow-md border-border/70 bg-card/90 backdrop-blur animate-fade-up">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="mt-2 text-sm text-muted-foreground">
          Select a room on the left to start.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 flex flex-col gap-4 min-h-[520px] shadow-md border-border/70 bg-card/90 backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold">{currentRoom.name}</h2>
        <div className="text-sm text-muted-foreground">
          Messages: {roomMessages.length}
        </div>
      </div>

      <div
        ref={listRef}
        className="chat-scrollbar flex-1 overflow-auto rounded-xl border border-border bg-gradient-to-b from-background to-muted/30 p-3 sm:p-4 scroll-smooth"
      >
        {roomMessages.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages yet.</div>
        ) : (
          <div className="space-y-3">
            {roomMessages.map((m) => {
              const isOwn = m.senderUsername === user?.username;
              const timestamp = new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    isOwn ? "justify-end message-enter-right" : "justify-start message-enter-left"
                  )}
                >
                  <div className="max-w-[85%] sm:max-w-[75%] min-w-0 space-y-1">
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <Badge variant={isOwn ? "default" : "secondary"}>
                        {isOwn ? "You" : m.senderUsername}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{timestamp}</span>
                    </div>

                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card text-card-foreground border border-border rounded-bl-md"
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
