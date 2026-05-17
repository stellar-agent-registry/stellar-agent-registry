/**
 * Core type definitions for stellar-agent-registry SDK
 */

/** Supported Stellar networks */
export type NetworkPassphrase =
  | "Public Global Stellar Network ; September 2015"
  | "Test SDF Network ; September 2015"
  | "Test SDF Future Network ; October 2022";

/** Pricing models an agent may advertise */
export type PricingModel = "free" | "per-call" | "subscription" | "tiered";

/** x402 payment endpoint configuration */
export interface X402Config {
  /** HTTP endpoint that accepts x402 payment requests */
  endpoint: string;
  /** Supported payment assets (e.g. USDC, XLM) */
  assets: string[];
  /** Price per API call in stroops (1 XLM = 10_000_000 stroops) */
  pricePerCall?: bigint;
}

/** Model-to-Model Payment (MPP) configuration */
export interface MPPConfig {
  /** Whether this agent can pay other agents autonomously */
  canPayAgents: boolean;
  /** Maximum single payment in stroops */
  maxPaymentAmount?: bigint;
  /** Allowed counterparty agent IDs */
  trustedAgents?: string[];
}

/** A capability an agent exposes */
export interface AgentCapability {
  /** Unique capability identifier (e.g. "text-summarization", "image-captioning") */
  id: string;
  /** Human-readable description */
  description: string;
  /** OpenAI-compatible tool schema (optional) */
  toolSchema?: Record<string, unknown>;
}

/** Registration payload for a new agent */
export interface AgentRegistration {
  /** Unique agent identifier (alphanumeric + hyphens, max 64 chars) */
  agentId: string;
  /** Display name */
  name: string;
  /** Short description (max 256 chars) */
  description: string;
  /** Owner Stellar public key (G...) */
  ownerAddress: string;
  /** List of capabilities this agent provides */
  capabilities: AgentCapability[];
  /** Pricing model */
  pricingModel: PricingModel;
  /** x402 payment configuration (optional) */
  x402?: X402Config;
  /** MPP configuration (optional) */
  mpp?: MPPConfig;
  /** External metadata URI (IPFS or HTTPS) */
  metadataUri?: string;
  /** Agent version string */
  version?: string;
}

/** On-chain agent record returned from lookup */
export interface AgentRecord extends AgentRegistration {
  /** Ledger sequence number when agent was registered */
  registeredAt: number;
  /** Ledger sequence number of last update */
  updatedAt: number;
  /** Cumulative reputation score (0–100) */
  reputationScore: number;
  /** Total number of feedback entries */
  feedbackCount: number;
  /** Whether agent has been verified by the registry DAO */
  verified: boolean;
  /** Whether agent registration is currently active */
  active: boolean;
}

/** Feedback payload for scoring an agent */
export interface AgentFeedback {
  /** Agent being scored */
  agentId: string;
  /** Score from 1 (worst) to 5 (best) */
  score: 1 | 2 | 3 | 4 | 5;
  /** Optional comment (max 512 chars) */
  comment?: string;
  /** Capability being rated */
  capabilityId?: string;
}

/** Result of a reputation score query */
export interface ReputationResult {
  agentId: string;
  score: number;
  feedbackCount: number;
  breakdown: {
    average: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  };
}

/** SDK configuration options */
export interface RegistryConfig {
  /** Soroban RPC endpoint */
  rpcUrl: string;
  /** Network passphrase */
  networkPassphrase: NetworkPassphrase;
  /** Deployed registry contract address */
  contractId: string;
  /** Optional: signing keypair for write operations */
  signerKeypair?: import("@stellar/stellar-sdk").Keypair;
  /** Request timeout in ms (default: 30_000) */
  timeoutMs?: number;
}

/** Lookup filter options */
export interface LookupFilter {
  /** Filter by capability ID */
  capability?: string;
  /** Filter by pricing model */
  pricingModel?: PricingModel;
  /** Only return verified agents */
  verifiedOnly?: boolean;
  /** Minimum reputation score */
  minScore?: number;
  /** Require x402 support */
  requireX402?: boolean;
  /** Maximum results to return */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/** Paginated lookup result */
export interface LookupResult {
  agents: AgentRecord[];
  total: number;
  hasMore: boolean;
}

/** Transaction result for write operations */
export interface TxResult {
  /** Stellar transaction hash */
  txHash: string;
  /** Ledger sequence number */
  ledger: number;
  /** Whether the transaction succeeded */
  success: boolean;
}
