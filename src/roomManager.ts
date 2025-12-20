import { Room } from "./types";
import { nanoid } from "nanoid";

class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(hostId: string): Room {
    const id = nanoid(6);

    const room: Room = {
      id,
      hostId,
      controllers: new Map(),
      maxPlayers: 4,
    };

    this.rooms.set(id, room);
    return room;
  }

  getRoom(roomId: string) {
    return this.rooms.get(roomId);
  }

  findRoomByController(clientId: string): Room | undefined {
    return [...this.rooms.values()].find((r) => r.controllers.has(clientId));
  }

  removeRoom(roomId: string) {
    this.rooms.delete(roomId);
  }

  removeController(clientId: string) {
    for (const room of this.rooms.values()) {
      if (room.controllers.has(clientId)) {
        const playerId = room.controllers.get(clientId);
        room.controllers.delete(clientId);
        return { room, playerId };
      }
    }
  }
}

export const roomManager = new RoomManager();
