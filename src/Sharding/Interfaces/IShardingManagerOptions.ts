import { Client, ClientOptions } from "discord.js";

export default interface IShardingManagerOptions {
    token: string;
    shardList: number[]; // What shards to be in charge of
    clusterCount: number; // How many clusters to spawn
    totalShards: number; // Represents the total shards accross all processes (including multi-server)
    client: typeof Client;
    clientOptions: ClientOptions;
    managerIpcPort: number;
    name: string;
}