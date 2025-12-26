import { EventEmitter } from "events";

export class MockWebSocket extends EventEmitter {
  public sent: any[] = [];

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  close() {
    this.emit("close");
  }

  emitMessage(data: any) {
    this.emit("message", Buffer.from(JSON.stringify(data)));
  }
}
