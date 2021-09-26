import { Client, ClientOptions } from "discord.js";

export default interface IShardManagerOptions {
    client: typeof Client,
    token: string,
    shardAmount: number,
    workerAmount: number,
    shardList: number[],
    options: ClientOptions,
    orchestratorHost: string,
    orchestratorPort: number
}