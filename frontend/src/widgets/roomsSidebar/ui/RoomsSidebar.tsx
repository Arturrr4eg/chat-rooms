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
    <Card className="p-4 space-y-4">
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
          {roomsQuery.data.map((r) => {
            const isActive = r.id === currentRoom?.id;

            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setCurrentRoom(r)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{r.name}</div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}