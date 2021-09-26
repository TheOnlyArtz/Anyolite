import cluster from "cluster";
import { NodeMessage, Server } from "veza";
import { EventEmitter } from "events";
import ShardingManager from "../Sharding/ShardingManager";
import IPCEvents from "../enums/IPCEvents";

export default class ManagerIPC extends EventEmitter {
  [key: string]: any;
  public server: Server;

  constructor(public manager: ShardingManager) {
    super();

    this.server = new Server("Main")
      .on("connect", (client) =>
        this.emit("debug", `Client Connected: ${client.name}`)
      )
      .on("disconnect", (client) =>
        this.emit("debug", `Client Disconnected: ${client.name}`)
      )
      .on("error", (error) => this.emit("error", error))
      .on("message", this._incomingMessage.bind(this));

    if (cluster.isPrimary) void this.server.listen(manager.managerIpcPort);
  }

  async _incomingMessage(message: NodeMessage) {
    const {op} = message.data;

    if (op === IPCEvents.READY)
      this[`_${IPCEvents[op].toLowerCase()}`](message);
  }

  private _ready(message: NodeMessage) {
    const {d} = message.data;
    const cluster = this.manager.clusters.get(d);
    // console.log(this.manager.clusters)
    if (cluster)
      cluster.emit("ready");
  }
}
