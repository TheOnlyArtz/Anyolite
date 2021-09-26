import { Client, Util } from "discord.js";
import { Client as VezaClient, ClientSocket, NodeMessage } from "veza";
import { EventEmitter } from "events";
import IPCEvents from "../enums/IPCEvents";
import IPCResult from "./Interfaces/IPCResult";

export interface IPCError {
	name: string;
	message: string;
	stack: string;
}

export default class ClusterIPC extends EventEmitter {
  public managerIpcConnection?: ClientSocket;
  public readonly ipcNode: VezaClient;
  public client: typeof Client | Client;
  public readonly port: number;
  constructor(discordClient: typeof Client | Client, name: string, id: number, port: number) {
    super();

    this.client = discordClient;
    this.port = port;
    this.ipcNode = new VezaClient(`Cluster-${name}-${id}`).on(
      "message",
      this._handleMessage.bind(this)
    );
  }

  async init() {
    this.managerIpcConnection = await this.ipcNode.connectTo(this.port, "localhost");
  }

  private _eval(script: string) {
    return (this.client as any)._eval(script);
  }

  public async broadcast(script: string | Function) {
		script = typeof script === 'function' ? `(${script})(this)` : script;
		const { success, d } = await this.managerIpcConnection!.send({ op: IPCEvents.BROADCAST, d: script, origin: this.ipcNode.name }) as IPCResult;
		if (!success) throw Util.makeError(d as unknown as IPCError);
		return d as unknown as unknown[];
	}

  async _handleMessage(message: NodeMessage) {
		const { op, d, origin } = message.data;
		if (op === IPCEvents.EVAL) {
			try {
				message.reply({ success: true, d: await this._eval(d), origin: origin });
			} catch (error) {
				if (!(error instanceof Error)) return;
				message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack } });
			}
		}
  }
}
