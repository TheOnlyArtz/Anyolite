import ShardingManager from "../Sharding/ShardingManager";
import { EventEmitter } from "events";
import cluster, { Worker } from "cluster";
import { Util } from "discord.js";

export default class ClusterWorker extends EventEmitter {
  public ready = false;
  public worker?: Worker;

  constructor(
    public id: number,
    public shards: number[],
    public manager: ShardingManager
  ) {
    super();

    this.once("ready", () => {
      this.ready = true;
    });
  }

  public kill() {
    if (this.worker) {
      this.manager.emit("debug", `Killing Cluster: ${this.id}`);
      this.worker.removeListener("exit", () => {});
      this.worker.kill();
    }
  }

  public send(data: unknown) {
      // replace server with node
    return this.manager.ipc.server.sendTo(`Cluster-${this.manager.name}-${this.id}`, data)
  }

  public async respawn(delay = 550) {
    this.kill();
    if (delay) await Util.delayFor(delay);
    await this.spawn();
  }

  public async spawn() {
    this.worker = cluster.fork({
      SHARDS_LIST: this.shards.join(", "),
      CLUSTER_ID: this.id.toString(),
      SHARD_AMOUNT: this.manager.totalShards.toString(),
      CLUSTER_AMOUNT: this.manager.clusterCount.toString(),
      ...process.env,
    });

    this.manager.emit("debug", `Spawned new worker [${this.id}]`);
    this.manager.emit("spawn", this);

    await this.waitReady();
    await Util.delayFor(5000);
  }

  private async waitReady() {
    return new Promise((resolve, reject) => {
      this.once("ready", resolve);
      setTimeout(
        () =>
          reject(new Error(`Cluster ${this.id} took too long to get ready`)),
        45000
      );
    });
  }
}
