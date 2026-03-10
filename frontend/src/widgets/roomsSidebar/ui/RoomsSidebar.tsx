import {Card} from "@/shared/ui/card";
import {useState} from "react";
import {Button} from "@/shared/ui/button";
import {Input} from "@/shared/ui/input";
import {useRoomsQuery} from "@/features/rooms/model/useRoomsQuery";
import {
  useCreateRoomMutation
} from "@/features/rooms/model/useCreateRoomMutation";
import {useAppStore} from "@/app/stores/app.store.ts";


export function RoomsSidebar() {

  const currentRoom = useAppStore((state) => state.currentRoom);
  const setCurrentRoom = useAppStore((state) => state.setCurrentRoom);
  const roomsQuery = useRoomsQuery();
  const createRoomMutation = useCreateRoomMutation();

  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    createRoomMutation.mutate({name: trimmed}, {onSuccess: () => setName("")});
  };

  return (
    <Card className="p-4 space-y-4 shadow-md border-border/70 bg-card/90 backdrop-blur">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Rooms</h2>
        <p className="text-sm text-muted-foreground">Choose a room to chat</p>
      </div>

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New room name"
        />
        <Button
          type="button"
          onClick={submit}
          disabled={createRoomMutation.isPending}
        >
          Create
        </Button>
      </div>

      {roomsQuery.isLoading && (
        <div className="text-sm text-muted-foreground">Loading...</div>
      )}

      {roomsQuery.isError && (
        <div className="text-sm text-destructive">
          {(roomsQuery.error as Error).message}
        </div>
      )}

      {roomsQuery.data && (
        <ul className="space-y-2">
          {roomsQuery.data.map((r, index) => {
            const isActive = r.id === currentRoom?.id;

            return (
              <li
                key={r.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 45, 260)}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentRoom(r)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-all duration-200 hover:-translate-y-[1px] ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border hover:bg-muted hover:shadow-sm"
                  }`}
                >
                  <div className="font-medium">{r.name}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    Created by: {r.createdBy}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
