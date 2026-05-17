/**
 * In-memory mock of the Soroban registry contract.
 * Use this for local development and unit tests before deploying to Testnet.
 *
 * Usage:
 *   import { AgentRegistry } from "@stellar-agent-registry/sdk";
 *   const registry = new AgentRegistry({ mock: true });
 */

import type {
  AgentRecord,
  AgentRegistration,
  AgentFeedback,
  LookupFilter,
  LookupResult,
  ReputationResult,
  TxResult,
} from "../types/index.js";
import { validateRegistration } from "../utils/index.js";

type FeedbackStore = {
  scores: number[];
  comments: string[];
};

export class MockContractClient {
  private agents = new Map<string, AgentRecord>();
  private feedback = new Map<string, FeedbackStore>();
  private ledger = 1000;

  async register(registration: AgentRegistration): Promise<TxResult> {
    const errors = validateRegistration(registration);
    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.join("\n")}`);
    }

    if (this.agents.has(registration.agentId)) {
      throw new Error(`Agent "${registration.agentId}" is already registered`);
    }

    const record: AgentRecord = {
      ...registration,
      registeredAt: ++this.ledger,
      updatedAt: this.ledger,
      reputationScore: 0,
      feedbackCount: 0,
      verified: false,
      active: true,
    };

    this.agents.set(registration.agentId, record);

    return {
      txHash: `mock_tx_${Math.random().toString(36).slice(2)}`,
      ledger: this.ledger,
      success: true,
    };
  }

  async lookup(filter: LookupFilter): Promise<LookupResult> {
    let results = Array.from(this.agents.values()).filter((a) => a.active);

    if (filter.capability) {
      results = results.filter((a) =>
        a.capabilities.some((c) => c.id === filter.capability)
      );
    }
    if (filter.pricingModel) {
      results = results.filter((a) => a.pricingModel === filter.pricingModel);
    }
    if (filter.verifiedOnly) {
      results = results.filter((a) => a.verified);
    }
    if (filter.minScore !== undefined) {
      results = results.filter((a) => a.reputationScore >= filter.minScore!);
    }
    if (filter.requireX402) {
      results = results.filter((a) => !!a.x402?.endpoint);
    }

    // Sort by reputation score descending
    results.sort((a, b) => b.reputationScore - a.reputationScore);

    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 20;
    const total = results.length;
    const page = results.slice(offset, offset + limit);

    return { agents: page, total, hasMore: offset + limit < total };
  }

  async score(feedback: AgentFeedback): Promise<TxResult> {
    const agent = this.agents.get(feedback.agentId);
    if (!agent) throw new Error(`Agent "${feedback.agentId}" not found`);

    const store = this.feedback.get(feedback.agentId) ?? { scores: [], comments: [] };
    store.scores.push(feedback.score);
    if (feedback.comment) store.comments.push(feedback.comment);
    this.feedback.set(feedback.agentId, store);

    const avg =
      store.scores.reduce((s, n) => s + n, 0) / store.scores.length;
    agent.reputationScore = Math.round((avg / 5) * 100);
    agent.feedbackCount = store.scores.length;
    agent.updatedAt = ++this.ledger;

    return {
      txHash: `mock_tx_${Math.random().toString(36).slice(2)}`,
      ledger: this.ledger,
      success: true,
    };
  }

  async verify(agentId: string): Promise<TxResult> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found`);

    agent.verified = true;
    agent.updatedAt = ++this.ledger;

    return {
      txHash: `mock_tx_${Math.random().toString(36).slice(2)}`,
      ledger: this.ledger,
      success: true,
    };
  }

  async getAgent(agentId: string): Promise<AgentRecord | null> {
    return this.agents.get(agentId) ?? null;
  }

  async getReputation(agentId: string): Promise<ReputationResult | null> {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const store = this.feedback.get(agentId) ?? { scores: [], comments: [] };
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      1 | 2 | 3 | 4 | 5,
      number
    >;

    for (const s of store.scores) {
      distribution[s as 1 | 2 | 3 | 4 | 5]++;
    }

    const average =
      store.scores.length > 0
        ? store.scores.reduce((a, b) => a + b, 0) / store.scores.length
        : 0;

    return {
      agentId,
      score: agent.reputationScore,
      feedbackCount: agent.feedbackCount,
      breakdown: { average, distribution },
    };
  }
}
