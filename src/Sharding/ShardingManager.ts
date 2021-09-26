import { Client, ClientSocket } from "veza";
import IShardManagerOptions from "./IShardManagerOptions";
import EventEmitter from "events";

interface IShardingManagerError {
  message: string;
  error: Error;
}

export default class ShardingManager extends EventEmitter {
  options: IShardManagerOptions;
  orchestratorClient: Client;
  orchestratorSocket?: ClientSocket;
  
  constructor(options: IShardManagerOptions) {
    super();
    this.options = options;
    this.orchestratorClient = new Client("Orchestrator");
  }

  public on(event: "error", listener: (e: IShardingManagerError) => void): this;
  public on(event: any, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
  public once(event: "connectedToOrchestrator", listener: (s: void) => void): this;
  public once(event: any, listener: (...args: any[]) => void): this {
    return super.once(event, listener);
  }
  
  async spawn() {
    try {
      this.orchestratorSocket = await this.orchestratorClient.connectTo(
        this.options.orchestratorPort,
        this.options.orchestratorHost
      );
      this.emit("connectedToOrchestrator");
    } catch (e) {
      this.emit("error", {
        message: "Failed to spawn shard manager",
        error: e,
      });
      
      return;
    }

    for (const shardId of this.options.shardList) {
      const promises = [];
      // const shard = 
    }

  }
}
