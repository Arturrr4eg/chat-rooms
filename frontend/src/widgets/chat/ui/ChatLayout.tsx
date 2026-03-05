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

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card className="p-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-sm text-muted-foreground">
            {user ? `Signed in as: ${user.email}` : "Signed in"}
          </div>

          <div className="text-sm text-muted-foreground">
            {currentRoom ? `Room: ${currentRoom.name}` : "No room selected"}
          </div>
        </div>

        <div className="flex gap-2">
          {currentRoom && (
            <Button type="button" variant="outline" onClick={leaveRoom}>
              Leave room
            </Button>
          )}

          <Button type="button" variant="outline" onClick={clear}>
            Logout
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
        <RoomsSidebar />
        <ChatPanel wsClient={wsClient} />
      </div>
    </div>
  );
}