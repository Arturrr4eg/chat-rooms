import { http } from "@/shared/api/http";


export interface Room {
  id: string;
  name: string;
  createdBy: string;
}

export interface CreateRoomRequest {
  name: string;
}

export function getRooms() {
  return http<Room[]>("/rooms", { method: "GET", auth: true });
}

export function createRoom(data: CreateRoomRequest) {
  return http<Room>("/rooms", { method: "POST", body: data, auth: true });
}