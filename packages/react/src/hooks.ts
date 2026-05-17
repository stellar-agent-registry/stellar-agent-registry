/**
 * React hooks for stellar-agent-registry SDK
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentRegistry } from "@stellar-agent-registry/sdk";
import type {
  AgentRecord,
  AgentRegistryOptions,
  LookupFilter,
  LookupResult,
  ReputationResult,
} from "@stellar-agent-registry/sdk";

/** Singleton registry instances keyed by config hash */
const registryCache = new Map<string, AgentRegistry>();

function getRegistry(options: AgentRegistryOptions): AgentRegistry {
  const key = JSON.stringify(options);
  if (!registryCache.has(key)) {
    registryCache.set(key, new AgentRegistry(options));
  }
  return registryCache.get(key)!;
}

export interface UseAgentOptions {
  registryOptions: AgentRegistryOptions;
  agentId: string;
  /** Refresh interval in ms. 0 = no polling. Default: 0 */
  refreshInterval?: number;
}

export interface UseAgentResult {
  agent: AgentRecord | null;
  reputation: ReputationResult | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Hook to fetch and optionally poll a single agent record */
export function useAgent({
  registryOptions,
  agentId,
  refreshInterval = 0,
}: UseAgentOptions): UseAgentResult {
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [reputation, setReputation] = useState<ReputationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const counterRef = useRef(0);

  const fetch = useCallback(async () => {
    const id = ++counterRef.current;
    setLoading(true);
    setError(null);
    try {
      const registry = getRegistry(registryOptions);
      const [agentData, repData] = await Promise.all([
        registry.getAgent(agentId),
        registry.getReputation(agentId),
      ]);
      if (counterRef.current === id) {
        setAgent(agentData);
        setReputation(repData);
      }
    } catch (err) {
      if (counterRef.current === id) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (counterRef.current === id) setLoading(false);
    }
  }, [agentId, registryOptions]);

  useEffect(() => {
    void fetch();
    if (refreshInterval > 0) {
      const timer = setInterval(fetch, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [fetch, refreshInterval]);

  return { agent, reputation, loading, error, refetch: fetch };
}

export interface UseAgentLookupOptions {
  registryOptions: AgentRegistryOptions;
  filter?: LookupFilter;
}

export interface UseAgentLookupResult {
  result: LookupResult | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Hook to search / discover agents */
export function useAgentLookup({
  registryOptions,
  filter = {},
}: UseAgentLookupOptions): UseAgentLookupResult {
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const filterKey = JSON.stringify(filter);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const registry = getRegistry(registryOptions);
      const data = await registry.lookup(filter);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { result, loading, error, refetch: fetch };
}
