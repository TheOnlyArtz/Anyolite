import { Client, ClientOptions } from "discord.js";
import IShardingManagerOptions from "./Interfaces/IShardingManagerOptions";
import EventEmitter from 'events';

export default class ShardingManager extends EventEmitter {
    public readonly options: IShardingManagerOptions;
    public readonly path: string;
    token: string;
    shardList: number[]; // What shards to be in charge of
    clusterCount: number; // How many clusters to spawn
    totalShards: number; // Represents the total shards accross all processes (including multi-server)
    client: typeof Client;
    clientOptions: ClientOptions;

    constructor(path: string, options: IShardingManagerOptions) {
        super();
        
        this.path = path;
        this.token = options.token;
        this.shardList = options.shardList;
        this.totalShards = options.totalShards;
        this.clusterCount = options.clusterCount;
        this.client = options.client;
        this.clientOptions = options.clientOptions;
    }
}