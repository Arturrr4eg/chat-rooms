import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoom } from "@/features/rooms/api/roomsApi";
import { roomsQueryKey } from "@/features/rooms/model/useRoomsQuery";

export function useCreateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomsQueryKey });
    },
  });
}