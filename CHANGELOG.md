# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- `@stellar-agent-registry/sdk` — core TypeScript SDK with `register`, `lookup`, `score`, `verify`, `getAgent`, `getReputation`
- `@stellar-agent-registry/react` — `<AgentCard />` component, `useAgent`, `useAgentLookup` hooks
- Mock mode for local development without a deployed Soroban contract
- x402 payment endpoint support in agent registration
- MPP (Model-to-Model Payment) configuration support
- Full test suite with Vitest
- GitHub Actions CI pipeline
- Demo app with Vite + React
