/**
 * @stellar-agent-registry/sdk
 * On-Chain Agent Discovery & Reputation SDK for Stellar/Soroban
 */

export { AgentRegistry } from "./registry.js";
export type { AgentRegistryOptions } from "./registry.js";

export type {
  AgentCapability,
  AgentFeedback,
  AgentRecord,
  AgentRegistration,
  LookupFilter,
  LookupResult,
  MPPConfig,
  NetworkPassphrase,
  PayOptions,
  PayResult,
  PricingModel,
  RegistryConfig,
  ReputationResult,
  TxResult,
  X402Config,
} from "./types/index.js";

export {
  X402AssetNotSupportedError,
  X402PaymentError,
} from "./types/index.js";

export {
  isValidAgentId,
  isValidCapabilityId,
  isValidPublicKey,
  stroopsToXlm,
  validateRegistration,
  xlmToStroops,
} from "./utils/index.js";
