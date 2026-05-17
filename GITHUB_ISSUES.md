# stellar-agent-registry — GitHub Issues & Project Pipeline

Use this document to create all 10 issues after pushing the repo. Each issue maps to a milestone and pipeline column.

---

## Pipeline Setup (do this before creating issues)

In your GitHub org repo:
1. Go to **Projects** → **New project** → choose **Board** view
2. Name it: `stellar-agent-registry Roadmap`
3. Add these columns in order:
   - `Backlog`
   - `Ready`
   - `In Progress`
   - `In Review`
   - `Done`
4. Go to **Issues** → **Milestones** → **New milestone**:
   - `v0.1.0 — Core SDK` (due: 2 weeks from now)
   - `v0.2.0 — React & DX` (due: 4 weeks from now)
   - `v0.3.0 — Soroban Integration` (due: 6 weeks from now)

---

## Labels to create first

Go to **Issues → Labels → New label** and create:

| Label | Color | Description |
|---|---|---|
| `sdk` | `#0075ca` | SDK package work |
| `react` | `#61dafb` | React package work |
| `soroban` | `#7C3AED` | Smart contract / on-chain |
| `dx` | `#e4e669` | Developer experience |
| `testing` | `#d93f0b` | Tests and CI |
| `docs` | `#0075ca` | Documentation |
| `good first issue` | `#7057ff` | Good for newcomers |

---

## Issue #1 — [sdk] Add `registry.deregister(agentId)` method

**Labels:** `sdk`
**Milestone:** `v0.1.0 — Core SDK`
**Column:** `Backlog`

**Title:** `[sdk] Add registry.deregister(agentId) — allow owners to remove their agent`

**Body:**
```
## Summary
Currently there is no way to remove an agent from the registry. Owners should be able to deregister their own agent (sets `active: false` on-chain rather than hard-deleting).

## Acceptance criteria
- [ ] `registry.deregister(agentId)` is added to `AgentRegistry`
- [ ] Only the owner's signing keypair can deregister their own agent (validated in `MockContractClient` via stored ownerAddress)
- [ ] `MockContractClient` sets `active: false` and stores the ledger of deregistration
- [ ] `SorobanContractClient` calls a `deregister` method on the contract
- [ ] Unit tests cover: owner can deregister, non-owner cannot, deregistered agent no longer appears in `lookup()`
- [ ] Type: `TxResult` returned on success

## Notes
- Soft-delete only — `getAgent()` should still return the record with `active: false`
- `lookup()` already filters by `active: true` so no change needed there
```

---

## Issue #2 — [sdk] Add `registry.update(agentId, partial)` method

**Labels:** `sdk`
**Milestone:** `v0.1.0 — Core SDK`
**Column:** `Backlog`

**Title:** `[sdk] Add registry.update(agentId, partial) — allow owners to update agent metadata`

**Body:**
```
## Summary
Agents need to update their metadata without full re-registration (e.g. new x402 endpoint, new capability, version bump).

## Acceptance criteria
- [ ] `registry.update(agentId, Partial<AgentRegistration>)` added to `AgentRegistry`
- [ ] Only the owner can update their agent
- [ ] `updatedAt` ledger number is refreshed on every update
- [ ] Partial fields are merged, not replaced wholesale
- [ ] `MockContractClient` implements update logic
- [ ] `SorobanContractClient` calls `update` on the Soroban contract
- [ ] Unit tests: update name, update capabilities, update x402 endpoint, reject non-owner

## Notes
- `agentId` and `ownerAddress` cannot be changed via update
- Capabilities can be replaced as a full list
```

---

## Issue #3 — [sdk] Implement batch `registry.lookupMany(agentIds[])` method

**Labels:** `sdk`
**Milestone:** `v0.1.0 — Core SDK`
**Column:** `Backlog`

**Title:** `[sdk] Add registry.lookupMany(agentIds[]) — fetch multiple agents in one call`

**Body:**
```
## Summary
When composing multi-agent pipelines, callers need to resolve a list of known agent IDs efficiently without N individual `getAgent()` calls.

## Acceptance criteria
- [ ] `registry.lookupMany(agentIds: string[]): Promise<(AgentRecord | null)[]>` added
- [ ] Order of results matches order of input IDs
- [ ] Returns `null` for any ID that isn't found
- [ ] In `MockContractClient`: O(n) map lookup
- [ ] In `SorobanContractClient`: batches into a single contract call where the contract supports it, otherwise fans out with `Promise.all`
- [ ] Unit tests: all found, some missing, empty input
- [ ] Exported from `@stellar-agent-registry/sdk`
```

---

## Issue #4 — [react] Add `<AgentList />` component with search and filter UI

**Labels:** `react`, `dx`
**Milestone:** `v0.2.0 — React & DX`
**Column:** `Backlog`

**Title:** `[react] Add <AgentList /> component — searchable, filterable agent browser`

**Body:**
```
## Summary
`<AgentCard />` renders one agent. We need a `<AgentList />` that wraps `useAgentLookup` and renders a grid of cards with a search box and filter controls.

## Acceptance criteria
- [ ] `<AgentList registryOptions={...} />` component created in `packages/react/src/components/AgentList.tsx`
- [ ] Includes a text search input that filters by `agentId` / `name` client-side
- [ ] Includes capability filter (dropdown populated from all capabilities in results)
- [ ] Includes pricing model filter (free / per-call / subscription / tiered)
- [ ] Includes "Verified only" toggle
- [ ] Renders a grid of `<AgentCard />` components
- [ ] Shows loading skeleton grid while fetching
- [ ] Shows empty state message when no results match
- [ ] Exported from `@stellar-agent-registry/react`
- [ ] Demo app updated to use `<AgentList />` instead of manual mapping

## Notes
- Filtering should be done client-side on the result set for responsiveness
- Server-side filtering (via `lookup()` filter params) used for initial load
```

---

## Issue #5 — [testing] Add integration test suite against MockContractClient

**Labels:** `testing`
**Milestone:** `v0.1.0 — Core SDK`
**Column:** `Backlog`

**Title:** `[testing] Add full integration test suite — end-to-end flows against MockContractClient`

**Body:**
```
## Summary
The current unit tests cover individual methods in isolation. We need end-to-end integration tests that simulate real agent lifecycle flows.

## Acceptance criteria
- [ ] Test file: `packages/sdk/src/__tests__/integration.test.ts`
- [ ] Covers full lifecycle: register → lookup → score × 3 → verify → getReputation → deregister
- [ ] Covers multi-agent discovery: register 5 agents with different capabilities, run lookup with each filter combination, assert correct subsets
- [ ] Covers pagination: register 25 agents, paginate through pages of 10, assert no duplicates across pages and total matches
- [ ] Covers concurrent writes: 10 simultaneous `score()` calls, assert final `feedbackCount` === 10
- [ ] All tests run in < 2s total
- [ ] CI passes with `npm test`

## Notes
- Use `beforeEach` to construct a fresh `AgentRegistry({ mock: true })` for each test
- No network calls — mock mode only
```

---

## Issue #6 — [docs] Add JSDoc to all public SDK exports

**Labels:** `docs`, `dx`
**Milestone:** `v0.2.0 — React & DX`
**Column:** `Backlog`

**Title:** `[docs] Add JSDoc comments to all public SDK exports`

**Body:**
```
## Summary
Every exported function, class, interface, and type needs JSDoc so IDE tooling surfaces documentation on hover and TypeDoc can generate a reference site.

## Acceptance criteria
- [ ] All exports in `packages/sdk/src/index.ts` have `@param`, `@returns`, and `@example` JSDoc
- [ ] `AgentRegistry` class and every method documented with JSDoc
- [ ] All types in `packages/sdk/src/types/index.ts` have field-level comments
- [ ] All utility functions in `packages/sdk/src/utils/index.ts` documented
- [ ] `packages/react/src/components/AgentCard.tsx` props documented with JSDoc
- [ ] `packages/react/src/hooks.ts` hook return types documented
- [ ] `typedoc` added as a dev dependency and `npm run docs` script generates `/docs` folder
- [ ] `.gitignore` updated to ignore `/docs`

## Notes
- Focus on accurate `@example` blocks — these are what developers read first
- Do not use placeholder text like "does something"
```

---

## Issue #7 — [soroban] Write Soroban contract interface spec

**Labels:** `soroban`, `docs`
**Milestone:** `v0.3.0 — Soroban Integration`
**Column:** `Backlog`

**Title:** `[soroban] Document Soroban contract interface — ABI spec for registry contract`

**Body:**
```
## Summary
The `SorobanContractClient` currently calls contract methods by name. We need a canonical ABI spec documenting every contract function signature, argument types, and return types so contributors can deploy a compatible contract to Testnet.

## Acceptance criteria
- [ ] `contracts/SPEC.md` created at repo root
- [ ] Documents all 6 contract functions: `register`, `lookup`, `score`, `verify`, `update`, `deregister`
- [ ] Each function entry includes: function name, argument names + Soroban SCVal types, return type, error codes
- [ ] Documents the storage layout (contract data keys, TTL policy)
- [ ] Documents admin / DAO authorisation model for `verify`
- [ ] Includes a deployment checklist for Testnet using Stellar CLI
- [ ] Links to the spec from root `README.md`

## Notes
- This spec is what a Rust developer would use to implement the actual Soroban contract
- Use Soroban SCVal type names: `ScString`, `ScVec`, `ScMap`, `ScBool`, `ScU32`, `ScI128`
```

---

## Issue #8 — [sdk] Add `x402` payment helper — `registry.pay(agentId, amount)`

**Labels:** `sdk`, `soroban`
**Milestone:** `v0.3.0 — Soroban Integration`
**Column:** `Backlog`

**Title:** `[sdk] Add registry.pay(agentId, amount) — x402 payment flow helper`

**Body:**
```
## Summary
Agents advertising an x402 endpoint need callers to be able to pay them programmatically. Add a `pay()` helper that reads the agent's x402 config from the registry and constructs the payment request.

## Acceptance criteria
- [ ] `registry.pay(agentId: string, options: PayOptions): Promise<PayResult>` added
- [ ] `PayOptions`: `{ assetCode: string; amount: bigint; memo?: string }`
- [ ] `PayResult`: `{ txHash: string; ledger: number; endpoint: string; success: boolean }`
- [ ] Automatically looks up `agent.x402.endpoint` and `agent.x402.assets` before sending
- [ ] Throws `X402PaymentError` if the agent has no x402 config
- [ ] Throws `X402AssetNotSupportedError` if the requested asset is not in `agent.x402.assets`
- [ ] In mock mode: simulates a successful payment and returns a mock tx hash
- [ ] In production mode: builds a Stellar payment operation and submits via Horizon
- [ ] Unit tests cover: successful payment, no x402 config, unsupported asset, mock mode
- [ ] All new error classes exported from SDK

## Notes
- Use `@stellar/stellar-sdk` `PaymentOperation` for the Horizon path
- The Horizon endpoint should be configurable (default to Testnet)
```

---

## Issue #9 — [dx] Add CLI tool `sar` — register and query agents from terminal

**Labels:** `dx`, `sdk`
**Milestone:** `v0.2.0 — React & DX`
**Column:** `Backlog`

**Title:** `[dx] Add sar CLI — register, lookup, and score agents from the terminal`

**Body:**
```
## Summary
Developers need a CLI to quickly test their agent registration without writing code.

## Acceptance criteria
- [ ] New workspace `packages/cli` with `bin/sar.js` entry point
- [ ] Commands:
  - `sar register --config agent.json` — register agent from JSON file
  - `sar lookup --capability text-summarize` — search agents, print table
  - `sar score --agent my-agent --score 5 --comment "Great"` — submit feedback
  - `sar get --agent my-agent` — print full agent record as JSON
- [ ] Supports `--network testnet | mainnet | mock` flag (default: mock)
- [ ] Supports `--secret S...` flag for write operations
- [ ] Supports `--contract CA...` flag for contract address
- [ ] Pretty-prints tables using `cli-table3`
- [ ] Exported as `sar` binary in `package.json` `bin` field
- [ ] README section added for CLI usage

## Notes
- Start with mock mode working end-to-end, Testnet can follow
- Use `commander` for argument parsing
```

---

## Issue #10 — [react] Add `<ReputationChart />` component

**Labels:** `react`
**Milestone:** `v0.2.0 — React & DX`
**Column:** `Backlog`

**Title:** `[react] Add <ReputationChart /> — visual score distribution for an agent`

**Body:**
```
## Summary
`getReputation()` returns a full score distribution (how many 1s, 2s, 3s, 4s, 5s). Visualise this as a horizontal bar chart component.

## Acceptance criteria
- [ ] `<ReputationChart agentId="..." registryOptions={...} />` created in `packages/react/src/components/ReputationChart.tsx`
- [ ] Renders a horizontal bar chart with bars for scores 1–5
- [ ] Each bar label shows: star rating, bar (proportional to count), count number
- [ ] Shows average score numerically (e.g. "4.2 / 5")
- [ ] Shows total review count
- [ ] Loading skeleton while fetching
- [ ] Empty state when `feedbackCount === 0` (shows "No reviews yet")
- [ ] Zero dependency — pure CSS bars, no chart library
- [ ] Exported from `@stellar-agent-registry/react`
- [ ] Demo app includes `<ReputationChart />` below the agent cards after seeding scores

## Notes
- Bar width: `(count / maxCount) * 100%` where maxCount is the highest single-star count
- Use CSS transitions on bar width so it animates in on mount
```

---

## After creating all 10 issues

1. Go to your **Project board** (`stellar-agent-registry Roadmap`)
2. Add all 10 issues to the board — they will appear in `Backlog`
3. Move issues #1, #3, #5 to **Ready** (these are the first sprint)
4. Set milestone `v0.1.0` on issues #1, #2, #3, #5
5. Set milestone `v0.2.0` on issues #4, #6, #9, #10
6. Set milestone `v0.3.0` on issues #7, #8
