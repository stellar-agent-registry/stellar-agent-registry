/**
 * Utility helpers for the stellar-agent-registry SDK
 */

import { AgentCapability, AgentRegistration } from "../types/index.js";

/** Validate a Stellar public key (G...) */
export function isValidPublicKey(key: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(key);
}

/** Validate an agent ID */
export function isValidAgentId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(id);
}

/** Validate a capability ID */
export function isValidCapabilityId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/.test(id);
}

/** Validate registration payload before sending to chain */
export function validateRegistration(reg: AgentRegistration): string[] {
  const errors: string[] = [];

  if (!isValidAgentId(reg.agentId)) {
    errors.push(
      `agentId "${reg.agentId}" must be 3–64 lowercase alphanumeric chars/hyphens`
    );
  }

  if (!reg.name || reg.name.trim().length === 0) {
    errors.push("name is required");
  }

  if (reg.description && reg.description.length > 256) {
    errors.push("description must be ≤256 chars");
  }

  if (!isValidPublicKey(reg.ownerAddress)) {
    errors.push(`ownerAddress "${reg.ownerAddress}" is not a valid Stellar public key`);
  }

  if (!reg.capabilities || reg.capabilities.length === 0) {
    errors.push("at least one capability is required");
  } else {
    reg.capabilities.forEach((cap, i) => {
      const capErrors = validateCapability(cap, i);
      errors.push(...capErrors);
    });
  }

  if (reg.x402) {
    if (!reg.x402.endpoint) {
      errors.push("x402.endpoint is required when x402 config is provided");
    }
    if (!reg.x402.assets || reg.x402.assets.length === 0) {
      errors.push("x402.assets must contain at least one asset");
    }
  }

  return errors;
}

function validateCapability(cap: AgentCapability, index: number): string[] {
  const errors: string[] = [];
  if (!isValidCapabilityId(cap.id)) {
    errors.push(`capabilities[${index}].id "${cap.id}" is invalid`);
  }
  if (!cap.description || cap.description.trim().length === 0) {
    errors.push(`capabilities[${index}].description is required`);
  }
  return errors;
}

/** Encode a string to hex for Soroban contract calls */
export function encodeToHex(str: string): string {
  return Buffer.from(str, "utf8").toString("hex");
}

/** Decode hex from Soroban contract responses */
export function decodeFromHex(hex: string): string {
  return Buffer.from(hex, "hex").toString("utf8");
}

/** Convert stroops to XLM (1 XLM = 10_000_000 stroops) */
export function stroopsToXlm(stroops: bigint): string {
  const whole = stroops / 10_000_000n;
  const frac = stroops % 10_000_000n;
  return `${whole}.${frac.toString().padStart(7, "0")}`;
}

/** Convert XLM to stroops */
export function xlmToStroops(xlm: string): bigint {
  const [whole, frac = ""] = xlm.split(".");
  const fracPadded = frac.padEnd(7, "0").slice(0, 7);
  return BigInt(whole ?? "0") * 10_000_000n + BigInt(fracPadded);
}

/** Sleep for a given number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry an async operation with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await sleep(baseDelayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

/** Build a Soroban contract invocation argument map */
export function buildContractArgs(
  args: Record<string, string | number | bigint | boolean>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(args).map(([k, v]) => [k, { value: v.toString() }])
  );
}

/** Parse contract return value from Soroban response */
export function parseContractReturn(raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    return (raw as { value: unknown }).value;
  }
  return raw;
}
