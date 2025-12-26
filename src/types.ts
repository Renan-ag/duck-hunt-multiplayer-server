import type { WebSocket as WSWebSocket } from "ws";

export type Role = "host" | "controller";

type ControllerState = {
  clientId: string;
  playerId: number;
  rejoinToken: string;
  connected: boolean;
  timeout?: NodeJS.Timeout;
};

export type Room = {
  id: string;
  hostId: string;
  maxPlayers: number;
  availablePlayerIds: number[];
  controllers: Map<string, ControllerState>; // rejoinToken -> controller
};

export type ClientSession = {
  id: string;
  ws: WSWebSocket;
  role: "none" | "host" | "controller";
  roomId?: string;
  playerId?: number;
  rejoinToken?: string;
};
