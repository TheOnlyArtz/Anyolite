import { Client, ClientOptions } from "discord.js";
import IPCEvents from "../enums/IPCEvents";
import AnyoliteShardClientUtil from "../Sharding/AnyoliteShardClientUtil";
import ShardingManager from "../Sharding/ShardingManager";

export default abstract class AnyoliteCluster {
  public readonly client: Client;
  public readonly id;

  constructor(manager: ShardingManager) {
    const env = process.env;

    const shardList = env.SHARDS_LIST!.split(", ").map(Number);
    const shardCount = Number(env.SHARD_AMOUNT);

    const options: ClientOptions = {
      ...manager.clientOptions,
      shards: shardList,
      shardCount,
    };

    this.client = new manager.client(options);
    const client = this.client as any;
    client.shard = new AnyoliteShardClientUtil(
      client,
      manager.name,
      manager.managerIpcPort
    ) as unknown as AnyoliteShardClientUtil;
    this.id = Number(env.CLUSTER_ID);
  }

  public async init() {
    const shardUtil = this.client.shard! as unknown as AnyoliteShardClientUtil;
    await shardUtil.init();
    this.client.once("ready", () => {
      void shardUtil.send(
        { op: IPCEvents.READY, d: this.id },
        { receptive: false }
      );
    });
    this.client.on("shardReady", (id) => {
      void shardUtil.send(
        { op: IPCEvents.SHARDREADY, d: { id: this.id, shardID: id } },
        { receptive: false }
      );
    });
    this.client.on("shardReconnecting", (id) => {
      void shardUtil.send(
        { op: IPCEvents.SHARDRECONNECT, d: { id: this.id, shardID: id } },
        { receptive: false }
      );
    });
    this.client.on("shardResume", (id, replayed) => {
      void shardUtil.send(
        {
          op: IPCEvents.SHARDRESUME,
          d: { id: this.id, shardID: id, replayed },
        },
        { receptive: false }
      );
    });
    this.client.on("shardDisconnect", ({ code, reason, wasClean }, id) => {
      void shardUtil.send(
        {
          op: IPCEvents.SHARDDISCONNECT,
          d: {
            id: this.id,
            shardID: id,
            closeEvent: { code, reason, wasClean },
          },
        },
        { receptive: false }
      );
    });
    await this.launch();
  }

  protected abstract launch(): Promise<void> | void;
}
