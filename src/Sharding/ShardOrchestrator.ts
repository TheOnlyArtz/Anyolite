import IShardOrchestratorOptions from "./IShardOrchestratorOptions";
import { Server, NodeMessage, ServerSocket} from "veza";

export default class ShardOrchestrator {
  options: IShardOrchestratorOptions;
  server: Server;
  connections: ServerSocket[] = [];

  constructor(options: IShardOrchestratorOptions) {
    this.options = options;
    this.server = new Server("Orchestrator");
  }

  async spawn() {
    try {
      this.server = await this.server
        .on('open', this._handleOpen)
        .on('connect', this._handleConnection.bind(this))
        .on('message', async (m: NodeMessage) => await this._handleMessage(m))
        .listen(this.options.port)
    } catch (e) {
        throw new Error("Failed to spawn the server")
    }
  }

  async _handleMessage(message: NodeMessage) {

  }
  
  _handleOpen() {
      console.log("=====================================")
      console.log("Orchestrator was spawned successfully")
      console.log("Waiting for connections...")
      console.log("=====================================")
  }

  _handleConnection(socket: ServerSocket) {

  }
}
