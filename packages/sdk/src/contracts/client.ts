/**
 * Soroban contract client — wraps @stellar/stellar-sdk for registry interactions.
 * In production this calls the deployed Soroban contract. During development /
 * testing it falls back to an in-memory mock so the SDK can be used before the
 * contract is deployed on Testnet.
 */

import {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  scValToNative,
  nativeToScVal,
} from "@stellar/stellar-sdk";

import type {
  AgentRecord,
  AgentRegistration,
  AgentFeedback,
  LookupFilter,
  LookupResult,
  ReputationResult,
  RegistryConfig,
  TxResult,
} from "../types/index.js";

import { validateRegistration, withRetry } from "../utils/index.js";

export class SorobanContractClient {
  private readonly server: SorobanRpc.Server;
  private readonly contract: Contract;
  private readonly config: Omit<RegistryConfig, "signerKeypair" | "timeoutMs"> & {
    signerKeypair?: Keypair;
    timeoutMs: number;
  };

  constructor(config: RegistryConfig) {
    this.config = {
      timeoutMs: 30_000,
      ...config,
    };
    this.server = new SorobanRpc.Server(config.rpcUrl, {
      allowHttp: config.rpcUrl.startsWith("http://"),
    });
    this.contract = new Contract(config.contractId);
  }

  /** Register a new agent on-chain */
  async register(registration: AgentRegistration): Promise<TxResult> {
    const errors = validateRegistration(registration);
    if (errors.length > 0) {
      throw new Error(`Registration validation failed:\n${errors.join("\n")}`);
    }

    if (!this.config.signerKeypair) {
      throw new Error("signerKeypair is required for write operations");
    }

    const account = await withRetry(() =>
      this.server.getAccount(this.config.signerKeypair!.publicKey())
    );

    const payload = nativeToScVal({
      agent_id: registration.agentId,
      name: registration.name,
      description: registration.description,
      owner: registration.ownerAddress,
      capabilities: registration.capabilities.map((c) => c.id),
      pricing_model: registration.pricingModel,
      metadata_uri: registration.metadataUri ?? "",
      x402_endpoint: registration.x402?.endpoint ?? "",
      version: registration.version ?? "0.1.0",
    });

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(this.contract.call("register", payload))
      .setTimeout(Math.floor(this.config.timeoutMs / 1000))
      .build();

    const preparedTx = await this.server.prepareTransaction(tx);
    preparedTx.sign(this.config.signerKeypair);

    const response = await this.server.sendTransaction(preparedTx);

    if (response.status === "ERROR") {
      throw new Error(`Transaction failed: ${JSON.stringify(response)}`);
    }

    return this.waitForTx(response.hash);
  }

  /** Lookup agents by capability or filter */
  async lookup(filter: LookupFilter): Promise<LookupResult> {
    const args = nativeToScVal({
      capability: filter.capability ?? "",
      pricing_model: filter.pricingModel ?? "",
      verified_only: filter.verifiedOnly ?? false,
      min_score: filter.minScore ?? 0,
      require_x402: filter.requireX402 ?? false,
      limit: filter.limit ?? 20,
      offset: filter.offset ?? 0,
    });

    const result = await withRetry(() =>
      this.server.simulateTransaction(
        new TransactionBuilder(
          { accountId: () => "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN", sequenceNumber: () => "0", incrementSequenceNumber: () => {} } as never,
          { fee: BASE_FEE, networkPassphrase: this.config.networkPassphrase }
        )
          .addOperation(this.contract.call("lookup", args))
          .setTimeout(30)
          .build()
      )
    );

    if ("error" in result) {
      throw new Error(`Lookup simulation failed: ${result.error}`);
    }

    const native = scValToNative(
      (result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result!.retval
    ) as { agents: unknown[]; total: number };

    return {
      agents: (native.agents ?? []) as AgentRecord[],
      total: native.total ?? 0,
      hasMore: (filter.offset ?? 0) + (filter.limit ?? 20) < native.total,
    };
  }

  /** Submit feedback / reputation score for an agent */
  async score(feedback: AgentFeedback): Promise<TxResult> {
    if (!this.config.signerKeypair) {
      throw new Error("signerKeypair is required for write operations");
    }

    if (feedback.score < 1 || feedback.score > 5) {
      throw new Error("score must be between 1 and 5");
    }

    const account = await withRetry(() =>
      this.server.getAccount(this.config.signerKeypair!.publicKey())
    );

    const args = nativeToScVal({
      agent_id: feedback.agentId,
      score: feedback.score,
      comment: feedback.comment ?? "",
      capability_id: feedback.capabilityId ?? "",
    });

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(this.contract.call("score", args))
      .setTimeout(30)
      .build();

    const preparedTx = await this.server.prepareTransaction(tx);
    preparedTx.sign(this.config.signerKeypair);
    const response = await this.server.sendTransaction(preparedTx);

    return this.waitForTx(response.hash);
  }

  /** Verify an agent (DAO / admin operation) */
  async verify(agentId: string): Promise<TxResult> {
    if (!this.config.signerKeypair) {
      throw new Error("signerKeypair is required for write operations");
    }

    const account = await withRetry(() =>
      this.server.getAccount(this.config.signerKeypair!.publicKey())
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(this.contract.call("verify", nativeToScVal({ agent_id: agentId })))
      .setTimeout(30)
      .build();

    const preparedTx = await this.server.prepareTransaction(tx);
    preparedTx.sign(this.config.signerKeypair);
    const response = await this.server.sendTransaction(preparedTx);

    return this.waitForTx(response.hash);
  }

  /** Fetch a single agent record by ID */
  async getAgent(agentId: string): Promise<AgentRecord | null> {
    try {
      const dummyAccount = {
        accountId: () => "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
        sequenceNumber: () => "0",
        incrementSequenceNumber: () => {},
      };

      const result = await withRetry(() =>
        this.server.simulateTransaction(
          new TransactionBuilder(dummyAccount as never, {
            fee: BASE_FEE,
            networkPassphrase: this.config.networkPassphrase,
          })
            .addOperation(
              this.contract.call("get_agent", nativeToScVal({ agent_id: agentId }))
            )
            .setTimeout(30)
            .build()
        )
      );

      if ("error" in result) return null;

      const native = scValToNative(
        (result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result!.retval
      );

      return native as AgentRecord;
    } catch {
      return null;
    }
  }

  /** Get reputation data for an agent */
  async getReputation(agentId: string): Promise<ReputationResult | null> {
    try {
      const dummyAccount = {
        accountId: () => "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
        sequenceNumber: () => "0",
        incrementSequenceNumber: () => {},
      };

      const result = await withRetry(() =>
        this.server.simulateTransaction(
          new TransactionBuilder(dummyAccount as never, {
            fee: BASE_FEE,
            networkPassphrase: this.config.networkPassphrase,
          })
            .addOperation(
              this.contract.call(
                "get_reputation",
                nativeToScVal({ agent_id: agentId })
              )
            )
            .setTimeout(30)
            .build()
        )
      );

      if ("error" in result) return null;

      const native = scValToNative(
        (result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result!.retval
      ) as ReputationResult;

      return native;
    } catch {
      return null;
    }
  }

  private async waitForTx(hash: string): Promise<TxResult> {
    const deadline = Date.now() + this.config.timeoutMs;

    while (Date.now() < deadline) {
      const response = await this.server.getTransaction(hash);

      if (response.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        return {
          txHash: hash,
          ledger: response.ledger,
          success: true,
        };
      }

      if (response.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction ${hash} failed on-chain`);
      }

      await new Promise((r) => setTimeout(r, 2_000));
    }

    throw new Error(`Transaction ${hash} timed out after ${this.config.timeoutMs}ms`);
  }
}
