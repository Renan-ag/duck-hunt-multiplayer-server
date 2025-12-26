import { nanoid } from "nanoid";
import { Room } from "./types";

class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(hostId: string) {
    const roomId = nanoid(6);

    const room: Room = {
      id: roomId,
      hostId,
      maxPlayers: 5,
      availablePlayerIds: [1, 2, 3, 4, 5],
      controllers: new Map(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string) {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string) {
    this.rooms.delete(roomId);
  }

  joinRoom(roomId: string, clientId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    for (const controller of room.controllers.values()) {
      if (!controller.connected) {
        return null; // força erro → client tentará rejoin
      }
    }

    const playerId = room.availablePlayerIds.shift();
    if (!playerId) return null;

    const rejoinToken = nanoid(16);

    room.controllers.set(rejoinToken, {
      clientId,
      playerId,
      rejoinToken,
      connected: true,
    });

    return { room, playerId, rejoinToken };
  }

  tryRejoin(roomId: string, rejoinToken: string, newClientId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const controller = room.controllers.get(rejoinToken);
    if (!controller || controller.connected) return null;

    if (controller.timeout) clearTimeout(controller.timeout);

    controller.clientId = newClientId;
    controller.connected = true;

    return { room, playerId: controller.playerId };
  }

  disconnectController(roomId: string, rejoinToken: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const controller = room.controllers.get(rejoinToken);
    if (!controller) return;

    controller.connected = false;

    controller.timeout = setTimeout(() => {
      room.controllers.delete(rejoinToken);
      room.availablePlayerIds.push(controller.playerId);
      room.availablePlayerIds.sort();
    }, 15000);
  }

  findRoomByClientId(clientId: string) {
    for (const room of this.rooms.values()) {
      for (const controller of room.controllers.values()) {
        if (controller.clientId === clientId) {
          return room;
        }
      }
    }
    return null;
  }
}

export const roomManager = new RoomManager();
