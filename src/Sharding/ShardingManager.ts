import { Client, ClientOptions } from "discord.js";
import IShardingManagerOptions from "./Interfaces/IShardingManagerOptions";
import EventEmitter from 'events';
import ManagerIPC from "../Communication/ManagerIPC";
import cluster from "cluster";
import AnyoliteCluster from '../Cluster/AnyoliteCluster';
import ClusterWorker from "../Cluster/ClusterWorker";

export default class ShardingManager extends EventEmitter {
    public clusters = new Map<number, ClusterWorker>();
    public readonly path: string;
    token: string;
    shardList: number[]; // What shards to be in charge of
    clusterCount: number; // How many clusters to spawn
    totalShards: number; // Represents the total shards accross all processes (including multi-server)
    client: typeof Client;
    clientOptions: ClientOptions;
    managerIpcPort: number;
    name: string; // Names are used to differ between nodes when it comes to horizontally scaling
    // names should be different and unique per server!
    ipc: ManagerIPC;

    constructor(path: string, options: IShardingManagerOptions) {
        super();
        
        this.managerIpcPort = options.managerIpcPort;
        this.path = path;
        this.token = options.token;
        this.shardList = options.shardList;
        this.totalShards = options.totalShards;
        this.clusterCount = options.clusterCount;
        this.client = options.client;
        this.clientOptions = options.clientOptions;
        this.name = options.name;
        this.ipc = new ManagerIPC(this);
        this.ipc.on('debug', msg => this._debug(`[IPC] ${msg}`));
		this.ipc.on('error', err => this.emit('error', err));

    }

    public async spawn() {
        if (cluster.isPrimary) {
            if (this.totalShards < this.clusterCount) {
                this.clusterCount = this.totalShards;
            }

            // const shardArray = [] [[0]]
            // const shardTuple = getArrayAsChunks(this.shardList, this.clusterCount);
            const shardTuple = [[0], [1]];

            for (let i = 0; i < this.clusterCount; i++) {
                const shards = shardTuple.shift()!;
                
                const cluster = new ClusterWorker(i, shards, this);

                this.clusters.set(i, cluster);

                try {
                    await cluster.spawn();
                } catch (e) {
                    this._debug(`Cluster ${cluster.id} failed to start`);
					this.emit('error', new Error(`Cluster ${cluster.id} failed to start`));
                }
            }
        } else {
            const ShardClass = await import(this.path);
            const ToUse = ShardClass.default ?? ShardClass;

            const cluster = new ToUse(this) as AnyoliteCluster;
            cluster.init();
        }
    }
	private _debug(message: string) {
		this.emit('debug', message);
	}

    
}

const getArrayAsChunks = (array: any[], chunkSize: number) => {
    let result = []
    let data = array.slice(0)
    while (data[0]) {
      result.push(data.splice(0, chunkSize))
    }
    return result;
  }
  