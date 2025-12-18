import { WebSocketServer } from "ws";
import { nanoid } from "nanoid";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map();

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    const data = JSON.parse(raw.toString());

    if (data.type === "create-room") {
      const sessionId = nanoid(8);

      rooms.set(sessionId, {
        id: sessionId,
        players: new Map(),
        host: ws,
        maxPlayers: 4,
      });

      ws.roomId = sessionId;

      ws.send(
        JSON.stringify({
          type: "room-created",
          sessionId,
        }),
      );
    }

    if (data.type === "join-room") {
      const room = rooms.get(data.sessionId);

      if (!room) {
        ws.send(JSON.stringify({ type: "error", message: "Sala não existe" }));
        return;
      }

      if (room.players.size >= room.maxPlayers) {
        ws.send(JSON.stringify({ type: "error", message: "Sala cheia" }));
        return;
      }

      const playerId = room.players.size + 1;

      room.players.set(ws, {
        id: playerId,
      });

      ws.roomId = room.id;
      ws.playerId = playerId;

      ws.send(
        JSON.stringify({
          type: "joined-room",
          playerId,
        }),
      );

      // Avisar host
      room.host.send(
        JSON.stringify({
          type: "player-joined",
          playerId,
        }),
      );
    }

    if (data.type === "input") {
      const room = rooms.get(ws.roomId);
      if (!room) return;

      room.host.send(
        JSON.stringify({
          type: "input",
          playerId: ws.playerId,
          payload: data.payload,
        }),
      );
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomId);
    if (!room) return;

    room.players.delete(ws);

    if (room.players.size === 0) {
      rooms.delete(ws.roomId);
    }
  });
});
