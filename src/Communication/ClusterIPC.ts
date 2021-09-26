import { Client } from "discord.js";
import { Client as VezaClient, ClientSocket, NodeMessage } from "veza";
import { EventEmitter } from "events";

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

  async _handleMessage(message: NodeMessage) {

  }
}
