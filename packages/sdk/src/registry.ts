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
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import type {
  AgentFeedback,
  AgentRecord,
  AgentRegistration,
  LookupFilter,
  LookupResult,
  PayOptions,
  PayResult,
  RegistryConfig,
  ReputationResult,
  TxResult,
} from "./types/index.js";
import {
  X402AssetNotSupportedError,
  X402PaymentError,
} from "./types/index.js";

export type AgentRegistryOptions =
  | ({ mock: true } & Partial<RegistryConfig>)
  | ({ mock?: false } & RegistryConfig);

type Client = SorobanContractClient | MockContractClient;

export class AgentRegistry {
  private readonly client: Client;
  private readonly options: AgentRegistryOptions;

  constructor(options: AgentRegistryOptions) {
    this.options = options;
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

  /**
   * Pay an agent that advertises x402 support.
   *
   * The registry record supplies the agent's x402 endpoint and supported assets.
   * In mock mode this returns a deterministic simulated payment result; in
   * production mode it submits a Stellar payment operation through Horizon to
   * the agent owner address.
   *
   * @param agentId - Agent to pay.
   * @param options - Asset, atomic amount, and optional memo.
   * @returns Payment result with tx hash, ledger, success flag, and endpoint.
   */
  async pay(agentId: string, options: PayOptions): Promise<PayResult> {
    if (options.amount <= 0n) {
      throw new X402PaymentError("payment amount must be greater than zero");
    }

    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new X402PaymentError(`Agent "${agentId}" not found`);
    }

    if (!agent.x402?.endpoint) {
      throw new X402PaymentError(`Agent "${agentId}" does not advertise x402`);
    }

    const supportedAsset = this.findSupportedAsset(agent, options.assetCode);
    if (!supportedAsset) {
      throw new X402AssetNotSupportedError(
        agentId,
        options.assetCode,
        agent.x402.assets
      );
    }

    if (this.options.mock) {
      return {
        txHash: `mock_pay_${agentId}_${options.assetCode}_${options.amount.toString()}`,
        ledger: Math.floor(Date.now() / 1000),
        success: true,
        endpoint: agent.x402.endpoint,
      };
    }

    if (!this.options.signerKeypair) {
      throw new X402PaymentError("signerKeypair is required for payments");
    }

    const horizonUrl =
      this.options.horizonUrl ??
      (this.options.networkPassphrase === Networks.PUBLIC
        ? "https://horizon.stellar.org"
        : "https://horizon-testnet.stellar.org");

    const server = new Horizon.Server(horizonUrl, {
      allowHttp: horizonUrl.startsWith("http://"),
    });
    const account = await server.loadAccount(this.options.signerKeypair.publicKey());
    const asset = this.toStellarAsset(agentId, supportedAsset);
    const amount = this.formatAtomicStellarAmount(options.amount);

    let builder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.options.networkPassphrase,
    }).addOperation(
      Operation.payment({
        destination: agent.ownerAddress,
        asset,
        amount,
      })
    );

    if (options.memo) {
      builder = builder.addMemo(Memo.text(options.memo));
    }

    const tx = builder.setTimeout(Math.floor((this.options.timeoutMs ?? 30_000) / 1000)).build();
    tx.sign(this.options.signerKeypair);

    const response = await server.submitTransaction(tx);

    return {
      txHash: response.hash,
      ledger: response.ledger ?? 0,
      success: true,
      endpoint: agent.x402.endpoint,
    };
  }

  private findSupportedAsset(
    agent: AgentRecord,
    requestedAssetCode: string
  ): string | null {
    const requested = requestedAssetCode.toUpperCase();
    return (
      agent.x402?.assets.find((asset) => {
        const [code] = asset.split(":");
        return code?.toUpperCase() === requested || asset.toUpperCase() === requested;
      }) ?? null
    );
  }

  private toStellarAsset(agentId: string, supportedAsset: string): Asset {
    const [code, issuer] = supportedAsset.split(":");
    if (!code) {
      throw new X402PaymentError(`Invalid x402 asset advertised by "${agentId}"`);
    }

    if (code.toUpperCase() === "XLM") {
      return Asset.native();
    }

    if (!issuer) {
      throw new X402PaymentError(
        `Agent "${agentId}" advertises ${code} without a Stellar issuer. Use CODE:ISSUER in x402.assets for production payments.`
      );
    }

    return new Asset(code, issuer);
  }

  private formatAtomicStellarAmount(amount: bigint): string {
    const whole = amount / 10_000_000n;
    const fractional = amount % 10_000_000n;
    const fractionalText = fractional.toString().padStart(7, "0").replace(/0+$/, "");
    return fractionalText.length > 0 ? `${whole}.${fractionalText}` : whole.toString();
  }
}
