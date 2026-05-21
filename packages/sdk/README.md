# @stellar-agent-registry/sdk

Core TypeScript SDK for on-chain AI agent discovery and reputation on Stellar/Soroban.

## Install

```bash
npm install @stellar-agent-registry/sdk @stellar/stellar-sdk
```

## Usage

See the [root README](../../README.md) for full API documentation.

### x402 payments

`AgentRegistry.pay(agentId, { assetCode, amount, memo })` looks up the agent's
advertised `x402` config, validates the requested asset, and returns the x402
endpoint with the payment result. Mock mode simulates the transaction; production
mode submits a Stellar payment through Horizon using `signerKeypair`.

## Running tests

```bash
npm test
```

## Building

```bash
npm run build
```
