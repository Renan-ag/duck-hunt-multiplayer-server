import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockWebSocket } from "./mocks/mockWebSocket";
import { handleConnection } from "../src/server";
import { roomManager } from "../src/roomManager";

describe("WebSocket Server", () => {
  beforeEach(() => {
    (roomManager as any).rooms.clear();
  });

  it("should create a room as host", () => {
    const ws = new MockWebSocket();
    handleConnection(ws);

    ws.emitMessage({ type: "create-room" });

    expect(ws.sent[0].type).toBe("room-created");
    expect(ws.sent[0].roomId).toBeDefined();
  });

  it("should allow controller to join room", () => {
    const hostWs = new MockWebSocket();
    handleConnection(hostWs);

    hostWs.emitMessage({ type: "create-room" });
    const roomId = hostWs.sent[0].roomId;

    const controllerWs = new MockWebSocket();
    handleConnection(controllerWs);

    controllerWs.emitMessage({ type: "join-room", roomId });

    expect(controllerWs.sent[0].type).toBe("joined-room");
    expect(controllerWs.sent[0].playerId).toBe(1);
    expect(controllerWs.sent[0].rejoinToken).toBeDefined();
  });

  it("should not allow more than max players", () => {
    const hostWs = new MockWebSocket();
    handleConnection(hostWs);
    hostWs.emitMessage({ type: "create-room" });

    const roomId = hostWs.sent[0].roomId;

    for (let i = 0; i < 5; i++) {
      const ws = new MockWebSocket();
      handleConnection(ws);
      ws.emitMessage({ type: "join-room", roomId });
    }

    const extraWs = new MockWebSocket();
    handleConnection(extraWs);
    extraWs.emitMessage({ type: "join-room", roomId });

    expect(extraWs.sent[0].type).toBe("error");
  });

  it("should allow 4 players", () => {
    const hostWs = new MockWebSocket();
    handleConnection(hostWs);
    hostWs.emitMessage({ type: "create-room" });

    const roomId = hostWs.sent[0].roomId;

    for (let i = 0; i < 4; i++) {
      const ws = new MockWebSocket();
      handleConnection(ws);
      ws.emitMessage({ type: "join-room", roomId });
    }

    const extraWs = new MockWebSocket();
    handleConnection(extraWs);
    extraWs.emitMessage({ type: "join-room", roomId });

    expect(extraWs.sent[0].type).toBe("joined-room");
  });

  it("should rejoin with same playerId", () => {
    const hostWs = new MockWebSocket();
    handleConnection(hostWs);
    hostWs.emitMessage({ type: "create-room" });
    const roomId = hostWs.sent[0].roomId;

    const controllerWs = new MockWebSocket();
    handleConnection(controllerWs);
    controllerWs.emitMessage({ type: "join-room", roomId });

    const { playerId, rejoinToken } = controllerWs.sent[0];

    controllerWs.close();

    const reconnectWs = new MockWebSocket();
    handleConnection(reconnectWs);
    reconnectWs.emitMessage({
      type: "rejoin-room",
      roomId,
      rejoinToken,
    });

    expect(reconnectWs.sent[0].type).toBe("rejoined-room");
    expect(reconnectWs.sent[0].playerId).toBe(playerId);
  });

  it("should relay input to host", () => {
    const hostWs = new MockWebSocket();
    handleConnection(hostWs);
    hostWs.emitMessage({ type: "create-room" });
    const roomId = hostWs.sent[0].roomId;

    const controllerWs = new MockWebSocket();
    handleConnection(controllerWs);
    controllerWs.emitMessage({ type: "join-room", roomId });

    controllerWs.emitMessage({
      type: "input",
      payload: { shoot: true },
    });

    const last = hostWs.sent.at(-1);

    expect(last.type).toBe("input");
    expect(last.payload.shoot).toBe(true);
  });
});
