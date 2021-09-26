import { Client, ShardingManager } from "discord.js";

export default class ShardWorker {
    public client: Client;
    public id: number;

    public constructor(public manager: ShardingManager) {
        const env = process.env;
    }
}
