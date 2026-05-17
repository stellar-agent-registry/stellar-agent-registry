# @stellar-agent-registry/react

React components and hooks for stellar-agent-registry.

## Install

```bash
npm install @stellar-agent-registry/react @stellar-agent-registry/sdk react react-dom
```

## Components

### `<AgentCard />`

Renders live on-chain data for a registered Stellar AI agent.

```tsx
import { AgentCard } from "@stellar-agent-registry/react";

<AgentCard
  agentId="my-ai-agent"
  registryOptions={{ mock: true }}
  showCapabilities
  showReputation
  showX402Badge
/>
```

## Hooks

### `useAgent({ agentId, registryOptions })`

Fetches a single agent record and reputation.

### `useAgentLookup({ registryOptions, filter })`

Searches agents with filter criteria.
