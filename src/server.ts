import { WebSocketServer, WebSocket } from "ws";
import { nanoid } from "nanoid";
import { roomManager } from "./roomManager";

const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });

/**
 * clientId → WebSocket
 */
const connections = new Map<string, WebSocket>();

/**
 * WebSocket lifecycle
 */
wss.on("connection", (ws) => {
  const clientId = nanoid(12);
  connections.set(clientId, ws);

  ws.on("message", (raw) => {
    let data: any;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    /**
     * HOST cria sala
     */
    if (data.type === "create-room") {
      const room = roomManager.createRoom(clientId);

      ws.send(
        JSON.stringify({
          type: "room-created",
          roomId: room.id,
        }),
      );
      return;
    }

    /**
     * CONTROLLER entra na sala
     */
    if (data.type === "join-room") {
      const room = roomManager.getRoom(data.roomId);

      if (!room) {
        ws.send(JSON.stringify({ type: "error", message: "Sala não existe" }));
        return;
      }

      if (room.controllers.size >= room.maxPlayers) {
        ws.send(JSON.stringify({ type: "error", message: "Sala cheia" }));
        return;
      }

      const playerId = room.controllers.size + 1;
      room.controllers.set(clientId, playerId);

      ws.send(
        JSON.stringify({
          type: "joined-room",
          playerId,
        }),
      );

      const hostWs = connections.get(room.hostId);
      hostWs?.send(
        JSON.stringify({
          type: "player-joined",
          playerId,
        }),
      );
      return;
    }

    /**
     * INPUT → relay para host
     */
    if (data.type === "input") {
      const room = roomManager.findRoomByController(clientId);
      if (!room) return;

      const playerId = room.controllers.get(clientId);
      const hostWs = connections.get(room.hostId);

      hostWs?.send(
        JSON.stringify({
          type: "input",
          playerId,
          payload: data.payload,
        }),
      );
    }
  });

  /**
   * Cleanup
   */
  ws.on("close", () => {
    connections.delete(clientId);

    // Host caiu → remove sala
    for (const room of [...((roomManager as any).rooms?.values?.() ?? [])]) {
      if (room.hostId === clientId) {
        roomManager.removeRoom(room.id);
        return;
      }
    }

    // Controller caiu
    const result = roomManager.removeController(clientId);
    if (result) {
      const { room, playerId } = result;
      const hostWs = connections.get(room.hostId);

      hostWs?.send(
        JSON.stringify({
          type: "player-left",
          playerId,
        }),
      );
    }
  });
});

/**
 * Heartbeat (produção)
 */
setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("connection", (ws: any) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
});

console.log(`🚀 WS Relay Server running on port ${PORT}`);
