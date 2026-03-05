import { useQuery } from "@tanstack/react-query";
import { getRooms } from "@/features/rooms/api/roomsApi";

export const roomsQueryKey = ["rooms"] as const;

export function useRoomsQuery() {
  return useQuery({
    queryKey: roomsQueryKey,
    queryFn: () => getRooms(),
  });
}