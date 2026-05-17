/**
 * AgentRegistry — main entry point for the stellar-agent-registry SDK.
 *
 * @example
 * ```ts
 * // Mock mode (no Soroban node required)
 * const registry = new AgentRegistry({ mock: true });
 *
 * // Production / Testnet mode
 * const registry = new AgentRegistry({
 *   rpcUrl: "https://soroban-testnet.stellar.org",
 *   networkPassphrase: Networks.TESTNET,
 *   contractId: "CABC...",
 *   signerKeypair: Keypair.fromSecret("S..."),
 * });
 *
 * await registry.register({
 *   agentId: "my-agent",
 *   name: "My Agent",
 *   description: "Does useful things",
 *   ownerAddress: keypair.publicKey(),
 *   capabilities: [{ id: "text-summarize", description: "Summarises text" }],
 *   pricingModel: "per-call",
 * });
 *
 * const { agents } = await registry.lookup({ capability: "text-summarize" });
 * ```
 */

import { SorobanContractClient } from "./contracts/client.js";
import { MockContractClient } from "./contracts/mock.js";
import type {
  AgentFeedback,
  AgentRecord,
  AgentRegistration,
  LookupFilter,
  LookupResult,
  RegistryConfig,
  ReputationResult,
  TxResult,
} from "./types/index.js";

export type AgentRegistryOptions =
  | ({ mock: true } & Partial<RegistryConfig>)
  | ({ mock?: false } & RegistryConfig);

type Client = SorobanContractClient | MockContractClient;

export class AgentRegistry {
  private readonly client: Client;

  constructor(options: AgentRegistryOptions) {
    if (options.mock) {
      this.client = new MockContractClient();
    } else {
      this.client = new SorobanContractClient(options as RegistryConfig);
    }
  }

  /**
   * Register a new AI agent on-chain.
   *
   * @param agent - Registration payload including capabilities, pricing, and optional x402/MPP config.
   * @returns Transaction result with hash and ledger number.
   * @throws If validation fails or the transaction is rejected.
   */
  async register(agent: AgentRegistration): Promise<TxResult> {
    return this.client.register(agent);
  }

  /**
   * Discover agents by capability or filter criteria.
   *
   * @param filter - Filter options (capability, pricing model, verified only, etc.)
   * @returns Paginated list of matching AgentRecord objects.
   */
  async lookup(filter: LookupFilter = {}): Promise<LookupResult> {
    return this.client.lookup(filter);
  }

  /**
   * Submit reputation feedback for an agent.
   *
   * @param feedback - Score (1–5) and optional comment for the agent.
   * @returns Transaction result.
   */
  async score(feedback: AgentFeedback): Promise<TxResult> {
    return this.client.score(feedback);
  }

  /**
   * Mark an agent as verified (requires DAO / admin signing key).
   *
   * @param agentId - ID of the agent to verify.
   * @returns Transaction result.
   */
  async verify(agentId: string): Promise<TxResult> {
    return this.client.verify(agentId);
  }

  /**
   * Fetch a single agent record by ID.
   *
   * @param agentId - The agent's unique identifier.
   * @returns AgentRecord or null if not found.
   */
  async getAgent(agentId: string): Promise<AgentRecord | null> {
    return this.client.getAgent(agentId);
  }

  /**
   * Get detailed reputation breakdown for an agent.
   *
   * @param agentId - The agent's unique identifier.
   * @returns ReputationResult or null if not found.
   */
  async getReputation(agentId: string): Promise<ReputationResult | null> {
    return this.client.getReputation(agentId);
  }
}
