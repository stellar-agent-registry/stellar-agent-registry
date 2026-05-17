# stellar-agent-registry

> **On-Chain Agent Discovery & Reputation SDK for Stellar/Soroban**

[![CI](https://github.com/YOUR_ORG/stellar-agent-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/stellar-agent-registry/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@stellar-agent-registry/sdk)](https://www.npmjs.com/package/@stellar-agent-registry/sdk)

## Why

The AI agent economy needs a standard way to **find** agents, **verify** who built them, and **evaluate** whether they are reliable. `stellar-agent-registry` is the composable SDK layer that makes on-chain agent infrastructure usable by every developer — not just a website.

Built for [Stellar Drips Wave 5](https://developers.stellar.org/meetings/2026/04/23).

---

## Packages

| Package | Description |
|---|---|
| [`@stellar-agent-registry/sdk`](./packages/sdk) | Core TypeScript SDK — register, lookup, score, verify |
| [`@stellar-agent-registry/react`](./packages/react) | React components & hooks — `<AgentCard />`, `useAgent()`, `useAgentLookup()` |

---

## Quick Start

```bash
npm install @stellar-agent-registry/sdk
```

```ts
import { AgentRegistry } from "@stellar-agent-registry/sdk";
import { Networks, Keypair } from "@stellar/stellar-sdk";

const keypair = Keypair.fromSecret("S...");

const registry = new AgentRegistry({
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
  contractId: "CA...",
  signerKeypair: keypair,
});

// Register an agent
await registry.register({
  agentId: "my-ai-agent",
  name: "My AI Agent",
  description: "Does something useful",
  ownerAddress: keypair.publicKey(),
  capabilities: [
    { id: "text-summarize", description: "Summarises long documents" },
  ],
  pricingModel: "per-call",
  x402: {
    endpoint: "https://my-agent.example.com/pay",
    assets: ["USDC"],
    pricePerCall: 100_000n, // 0.01 USDC in stroops
  },
});

// Discover agents by capability
const { agents } = await registry.lookup({
  capability: "text-summarize",
  requireX402: true,
  minScore: 60,
});

// Score an agent
await registry.score({ agentId: "my-ai-agent", score: 5, comment: "Fast and accurate" });
```

### Mock mode (no Soroban node required)

```ts
const registry = new AgentRegistry({ mock: true });
// All methods work in-memory — great for testing and local development
```

### React component

```tsx
import { AgentCard } from "@stellar-agent-registry/react";

<AgentCard
  agentId="my-ai-agent"
  registryOptions={{ contractId: "CA...", rpcUrl: "...", networkPassphrase: "..." }}
/>
```

---

## Core API

### `registry.register(agent)`
Register a new AI agent on-chain with metadata, capabilities, pricing, and optional x402/MPP configuration.

### `registry.lookup(filter?)`
Discover agents by capability, pricing model, verification status, minimum reputation score, or x402 support. Returns a paginated `LookupResult`.

### `registry.score(feedback)`
Submit a reputation score (1–5) and optional comment for an agent. Scores are aggregated on-chain.

### `registry.verify(agentId)`
Mark an agent as verified (requires DAO/admin signing key).

### `registry.getAgent(agentId)`
Fetch a single `AgentRecord` by ID.

### `registry.getReputation(agentId)`
Get full reputation breakdown including score distribution.

---

## Development

```bash
# Clone and install
git clone https://github.com/YOUR_ORG/stellar-agent-registry
cd stellar-agent-registry
npm install

# Run tests
npm test

# Build all packages
npm run build

# Run the demo app
npm run dev
```

---

## Project structure

```
stellar-agent-registry/
├── packages/
│   ├── sdk/          # @stellar-agent-registry/sdk
│   └── react/        # @stellar-agent-registry/react
├── apps/
│   └── demo/         # Vite demo app
├── scripts/          # Utility scripts
└── .github/          # CI/CD, issue templates
```

---

## Roadmap

See [open issues](https://github.com/YOUR_ORG/stellar-agent-registry/issues) for the current development pipeline.

---

## Contributing

PRs welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and open an issue before starting major work.

## License

MIT © stellar-agent-registry contributors
