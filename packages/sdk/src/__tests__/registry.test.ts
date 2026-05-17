import { describe, it, expect, beforeEach } from "vitest";
import { AgentRegistry } from "../src/registry.js";
import type { AgentRegistration } from "../src/types/index.js";

const VALID_AGENT: AgentRegistration = {
  agentId: "test-agent",
  name: "Test Agent",
  description: "A test agent for unit tests",
  ownerAddress: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
  capabilities: [
    { id: "text-summarize", description: "Summarises long text" },
    { id: "sentiment-analysis", description: "Detects sentiment in text" },
  ],
  pricingModel: "per-call",
  x402: {
    endpoint: "https://agent.example.com/pay",
    assets: ["USDC"],
    pricePerCall: 100_000n,
  },
};

describe("AgentRegistry (mock mode)", () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry({ mock: true });
  });

  describe("register()", () => {
    it("registers a valid agent and returns a tx result", async () => {
      const result = await registry.register(VALID_AGENT);
      expect(result.success).toBe(true);
      expect(result.txHash).toMatch(/^mock_tx_/);
      expect(result.ledger).toBeGreaterThan(0);
    });

    it("throws when registering the same agent twice", async () => {
      await registry.register(VALID_AGENT);
      await expect(registry.register(VALID_AGENT)).rejects.toThrow(/already registered/);
    });

    it("throws when agentId is invalid", async () => {
      await expect(
        registry.register({ ...VALID_AGENT, agentId: "INVALID ID!" })
      ).rejects.toThrow(/validation failed/i);
    });

    it("throws when owner address is not a valid Stellar key", async () => {
      await expect(
        registry.register({ ...VALID_AGENT, ownerAddress: "not-a-key" })
      ).rejects.toThrow(/validation failed/i);
    });

    it("throws when capabilities is empty", async () => {
      await expect(
        registry.register({ ...VALID_AGENT, capabilities: [] })
      ).rejects.toThrow(/validation failed/i);
    });
  });

  describe("lookup()", () => {
    beforeEach(async () => {
      await registry.register(VALID_AGENT);
      await registry.register({
        ...VALID_AGENT,
        agentId: "free-agent",
        pricingModel: "free",
        capabilities: [{ id: "translation", description: "Translates text" }],
        x402: undefined,
      });
    });

    it("returns all agents with empty filter", async () => {
      const result = await registry.lookup({});
      expect(result.agents).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("filters by capability", async () => {
      const result = await registry.lookup({ capability: "text-summarize" });
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0]!.agentId).toBe("test-agent");
    });

    it("filters by pricing model", async () => {
      const result = await registry.lookup({ pricingModel: "free" });
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0]!.agentId).toBe("free-agent");
    });

    it("filters by x402 requirement", async () => {
      const result = await registry.lookup({ requireX402: true });
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0]!.agentId).toBe("test-agent");
    });

    it("returns empty when no agents match", async () => {
      const result = await registry.lookup({ capability: "does-not-exist" });
      expect(result.agents).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("supports pagination", async () => {
      const page1 = await registry.lookup({ limit: 1, offset: 0 });
      const page2 = await registry.lookup({ limit: 1, offset: 1 });
      expect(page1.agents).toHaveLength(1);
      expect(page2.agents).toHaveLength(1);
      expect(page1.agents[0]!.agentId).not.toBe(page2.agents[0]!.agentId);
    });
  });

  describe("score()", () => {
    beforeEach(async () => {
      await registry.register(VALID_AGENT);
    });

    it("scores an agent and updates reputation", async () => {
      await registry.score({ agentId: "test-agent", score: 5 });
      const agent = await registry.getAgent("test-agent");
      expect(agent!.reputationScore).toBe(100);
      expect(agent!.feedbackCount).toBe(1);
    });

    it("averages multiple scores", async () => {
      await registry.score({ agentId: "test-agent", score: 5 });
      await registry.score({ agentId: "test-agent", score: 3 });
      const rep = await registry.getReputation("test-agent");
      expect(rep!.breakdown.average).toBe(4);
    });

    it("throws for invalid score", async () => {
      await expect(
        registry.score({ agentId: "test-agent", score: 6 as never })
      ).rejects.toThrow(/score must be between 1 and 5/);
    });
  });

  describe("verify()", () => {
    it("marks an agent as verified", async () => {
      await registry.register(VALID_AGENT);
      await registry.verify("test-agent");
      const agent = await registry.getAgent("test-agent");
      expect(agent!.verified).toBe(true);
    });

    it("throws for unknown agent", async () => {
      await expect(registry.verify("ghost-agent")).rejects.toThrow(/not found/);
    });
  });

  describe("getAgent()", () => {
    it("returns the agent record after registration", async () => {
      await registry.register(VALID_AGENT);
      const agent = await registry.getAgent("test-agent");
      expect(agent).not.toBeNull();
      expect(agent!.name).toBe("Test Agent");
    });

    it("returns null for unknown agent", async () => {
      const agent = await registry.getAgent("ghost");
      expect(agent).toBeNull();
    });
  });

  describe("getReputation()", () => {
    it("returns initial reputation after registration", async () => {
      await registry.register(VALID_AGENT);
      const rep = await registry.getReputation("test-agent");
      expect(rep!.score).toBe(0);
      expect(rep!.feedbackCount).toBe(0);
    });

    it("returns null for unknown agent", async () => {
      const rep = await registry.getReputation("ghost");
      expect(rep).toBeNull();
    });
  });
});
