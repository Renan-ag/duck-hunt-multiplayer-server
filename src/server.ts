import { WebSocketServer } from "ws";
import { nanoid } from "nanoid";
import { roomManager } from "./roomManager";
import { ClientSession } from "./types";

const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });

const clients = new Map<string, ClientSession>();

wss.on("connection", (ws) => {
  const clientId = nanoid(12);

  const client: ClientSession = {
    id: clientId,
    ws,
    role: "none",
  };

  clients.set(clientId, client);

  ws.on("message", (raw) => {
    let data: any;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    /**
     * CREATE ROOM (HOST)
     */
    if (data.type === "create-room") {
      if (client.role !== "none") return;

      const room = roomManager.createRoom(clientId);

      client.role = "host";
      client.roomId = room.id;

      ws.send(JSON.stringify({ type: "room-created", roomId: room.id }));
      return;
    }

    /**
     * JOIN ROOM (CONTROLLER)
     */
    if (data.type === "join-room") {
      if (client.role !== "none") return;

      const result = roomManager.joinRoom(data.roomId, client.id);
      if (!result) {
        ws.send(
          JSON.stringify({ type: "error", message: "Sala cheia ou inválida" }),
        );
        return;
      }

      const { room, playerId, rejoinToken } = result;

      client.role = "controller";
      client.roomId = room.id;
      client.playerId = playerId;
      client.rejoinToken = rejoinToken;

      ws.send(
        JSON.stringify({
          type: "joined-room",
          playerId,
          rejoinToken,
        }),
      );

      const host = clients.get(room.hostId);
      host?.ws.send(JSON.stringify({ type: "player-joined", playerId }));

      return;
    }

    /**
     * REJOIN ROOM
     */
    if (data.type === "rejoin-room") {
      if (client.role !== "none") return;

      const result = roomManager.tryRejoin(
        data.roomId,
        data.rejoinToken,
        client.id,
      );

      if (!result) {
        ws.send(JSON.stringify({ type: "error", message: "Rejoin inválido" }));
        return;
      }

      client.role = "controller";
      client.roomId = data.roomId;
      client.playerId = result.playerId;
      client.rejoinToken = data.rejoinToken;

      ws.send(
        JSON.stringify({
          type: "rejoined-room",
          playerId: result.playerId,
        }),
      );

      return;
    }

    /**
     * INPUT
     */
    if (data.type === "input") {
      if (client.role !== "controller" || !client.roomId) return;

      const room = roomManager.findRoomByClientId(client.id);
      if (!room) return;

      const host = clients.get(room.hostId);
      host?.ws.send(
        JSON.stringify({
          type: "input",
          playerId: client.playerId,
          payload: data.payload,
        }),
      );
    }
  });

  /**
   * DISCONNECT
   */
  ws.on("close", () => {
    clients.delete(clientId);

    if (client.role === "host" && client.roomId) {
      roomManager.removeRoom(client.roomId);
      return;
    }

    if (client.role === "controller" && client.roomId && client.rejoinToken) {
      const room = roomManager.getRoom(client.roomId);
      if (!room) return;

      roomManager.disconnectController(client.roomId, client.rejoinToken);

      const host = clients.get(room.hostId);
      host?.ws.send(
        JSON.stringify({
          type: "player-left",
          playerId: client.playerId,
        }),
      );
    }
  });
});

export function handleConnection(ws: any) {
  wss.emit("connection", ws);
}

console.log(`🚀 WS Relay Server running on port ${PORT}`);
