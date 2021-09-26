import cluster from "cluster";
import { NodeMessage, Server } from "veza";
import { EventEmitter } from "events";
import ShardingManager from "../Sharding/ShardingManager";
import IPCEvents from "../enums/IPCEvents";
import { Util } from "discord.js";
import IPCRequest from "./Interfaces/IPCRequest";

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

  public async broadcast(code: string) {
		const data = await this.server.broadcast({ op: IPCEvents.EVAL, d: code });
		let errored = data.filter(res => !res.success);
		if (errored.length) {
			errored = errored.map(msg => msg.d);
			const error = errored[0];
			throw Util.makeError(error);
		}
		return data.map(res => res.d) as unknown[];
	}

  private _message(message: NodeMessage) {
		const { d } = message.data as IPCRequest;
		this.manager.emit('message', d);
	}

  private async _broadcast(message: NodeMessage) {
		const { d } = message.data;
		try {
			const data = await this.broadcast(d);
			message.reply({ success: true, d: data });
		} catch (error) {
			if (!(error instanceof Error)) return;
			message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack } });
		}
	}

  async _incomingMessage(message: NodeMessage) {
    const {op} = message.data;

    if (this[`_${IPCEvents[op].toLowerCase()}`])
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
