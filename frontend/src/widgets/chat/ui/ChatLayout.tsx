import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { RoomsSidebar } from "@/widgets/roomsSidebar/ui/RoomsSidebar";
import { useAppStore } from "@/app/stores/app.store";
import { useChatSocket } from "@/features/chatSocket/model/useChatSocket";
import { ChatPanel } from "@/widgets/chatPanel/ui/ChatPanel";

export function ChatLayout() {
  const clear = useAppStore((s) => s.clear);
  const currentRoom = useAppStore((s) => s.currentRoom);
  const leaveRoom = useAppStore((s) => s.leaveRoom);
  const user = useAppStore((s) => s.user);

  const wsClient = useChatSocket();

  const handleLeaveRoom = () => {
    wsClient?.send({ type: "leave_room" });
    leaveRoom();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card className="p-3 flex items-center justify-between shadow-lg border-border/70 bg-card/90 backdrop-blur animate-fade-up">
        <div className="space-y-0.5">
          <div className="text-sm text-muted-foreground">
            {user ? `Signed in as: ${user.username}` : "Signed in"}
          </div>

          <div className="text-sm text-muted-foreground">
            {currentRoom ? `Room: ${currentRoom.name}` : "No room selected"}
          </div>
        </div>

        <div className="flex gap-2">
          {currentRoom && (
            <Button type="button" variant="outline" onClick={handleLeaveRoom}>
              Leave room
            </Button>
          )}

          <Button type="button" variant="outline" onClick={clear}>
            Logout
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
        <div className="animate-fade-up [animation-delay:90ms]">
          <RoomsSidebar />
        </div>
        <div className="animate-fade-up [animation-delay:140ms]">
          <ChatPanel wsClient={wsClient} />
        </div>
      </div>
    </div>
  );
}
