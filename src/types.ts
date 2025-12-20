export type Role = "host" | "controller";

export type Room = {
  id: string;
  hostId: string;
  controllers: Map<string, number>;
  maxPlayers: number;
};
