import { Client } from "discord.js";
import { SendOptions } from "veza";
import ClusterIPC from "../Communication/ClusterIPC";
import IPCEvents from '../enums/IPCEvents';

export default class AnyoliteShardClientUtil {
  public readonly shards: number[] = process.env
    .SHARDS_LIST!.split(", ")
    .map(Number);
  public readonly shardCount: number = Number(process.env.SHARD_AMOUNT);
  public readonly clusterCount = Number(process.env.CLUSTER_AMOUNT);
  public readonly id: number = Number(process.env.CLUSTER_ID);
  public ipc: ClusterIPC = new ClusterIPC(
    this.client,
    this.managerName,
    this.id,
    this.managerIpcPort
  );

  public constructor(
    public client: Client | typeof Client,
    public managerName: string,
    public managerIpcPort: number
  ) {}

  public init() {
    return this.ipc.init();
  }

  public send(data: any, options: SendOptions) {
    if (typeof data === "object" && data.op !== undefined)
      return this.ipc.managerIpcConnection!.send(data, options);
    return this.ipc.managerIpcConnection!.send({ op: IPCEvents.MESSAGE, d: data }, options);
  }

  public broadcastEval(script: string | Function): Promise<unknown[]> {
		return this.ipc.broadcast(script);
	}

}
