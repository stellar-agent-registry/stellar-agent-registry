/**
 * <AgentCard /> — drop-in component that displays live on-chain agent data.
 *
 * @example
 * ```tsx
 * <AgentCard
 *   agentId="my-agent"
 *   registryOptions={{ mock: true }}
 * />
 * ```
 */

import React from "react";
import { useAgent } from "./hooks.js";
import type { AgentRegistryOptions, AgentRecord, ReputationResult } from "@stellar-agent-registry/sdk";

export interface AgentCardProps {
  agentId: string;
  registryOptions: AgentRegistryOptions;
  /** Override card styles */
  className?: string;
  /** Show detailed capability list. Default: true */
  showCapabilities?: boolean;
  /** Show reputation score. Default: true */
  showReputation?: boolean;
  /** Show x402 badge if agent supports it. Default: true */
  showX402Badge?: boolean;
  /** Refresh interval in ms. 0 = no polling. Default: 0 */
  refreshInterval?: number;
  /** Called when the card is clicked */
  onClick?: (agent: AgentRecord) => void;
}

function ScoreDots({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }} aria-label={`Score ${score} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: i < Math.round(score) ? "#7C3AED" : "#E5E7EB",
            display: "inline-block",
          }}
        />
      ))}
    </span>
  );
}

function ReputationBadge({ rep }: { rep: ReputationResult }) {
  const stars = rep.breakdown.average;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <ScoreDots score={stars} />
      <span style={{ fontSize: 12, color: "#6B7280" }}>
        {rep.feedbackCount} review{rep.feedbackCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function PricingChip({ model }: { model: AgentRecord["pricingModel"] }) {
  const colors: Record<string, string> = {
    free: "#D1FAE5",
    "per-call": "#DBEAFE",
    subscription: "#FEF3C7",
    tiered: "#F3E8FF",
  };
  const text: Record<string, string> = {
    free: "Free",
    "per-call": "Pay-per-call",
    subscription: "Subscription",
    tiered: "Tiered",
  };
  return (
    <span
      style={{
        background: colors[model] ?? "#F3F4F6",
        color: "#111827",
        borderRadius: 9999,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {text[model] ?? model}
    </span>
  );
}

function X402Badge() {
  return (
    <span
      title="Supports x402 payments"
      style={{
        background: "#1D4ED8",
        color: "#fff",
        borderRadius: 9999,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      x402
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span
      title="Verified by registry DAO"
      style={{
        background: "#059669",
        color: "#fff",
        borderRadius: 9999,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      ✓ Verified
    </span>
  );
}

/** Skeleton loader for AgentCard */
function AgentCardSkeleton() {
  const shimmer: React.CSSProperties = {
    background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 6,
  };

  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "#fff",
        }}
      >
        <div style={{ ...shimmer, height: 20, width: "60%" }} />
        <div style={{ ...shimmer, height: 14, width: "90%" }} />
        <div style={{ ...shimmer, height: 14, width: "40%" }} />
      </div>
    </>
  );
}

/**
 * AgentCard — renders live on-chain data for a registered Stellar AI agent.
 */
export function AgentCard({
  agentId,
  registryOptions,
  className,
  showCapabilities = true,
  showReputation = true,
  showX402Badge = true,
  refreshInterval = 0,
  onClick,
}: AgentCardProps) {
  const { agent, reputation, loading, error } = useAgent({
    agentId,
    registryOptions,
    refreshInterval,
  });

  if (loading) return <AgentCardSkeleton />;

  if (error) {
    return (
      <div
        style={{
          border: "1px solid #FCA5A5",
          background: "#FEF2F2",
          borderRadius: 12,
          padding: 16,
          color: "#991B1B",
          fontSize: 13,
        }}
      >
        <strong>Failed to load agent:</strong> {error.message}
      </div>
    );
  }

  if (!agent) {
    return (
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 16,
          color: "#6B7280",
          fontSize: 13,
        }}
      >
        Agent <code>{agentId}</code> not found.
      </div>
    );
  }

  return (
    <div
      className={className}
      onClick={() => onClick?.(agent)}
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 20,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
            {agent.name}
          </h3>
          <code style={{ fontSize: 11, color: "#6B7280" }}>{agent.agentId}</code>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {agent.verified && <VerifiedBadge />}
          {showX402Badge && agent.x402 && <X402Badge />}
          <PricingChip model={agent.pricingModel} />
        </div>
      </div>

      {/* Description */}
      {agent.description && (
        <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
          {agent.description}
        </p>
      )}

      {/* Capabilities */}
      {showCapabilities && agent.capabilities.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Capabilities
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {agent.capabilities.map((cap) => (
              <span
                key={cap.id}
                title={cap.description}
                style={{
                  background: "#F3F4F6",
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontSize: 12,
                  color: "#374151",
                  fontFamily: "monospace",
                }}
              >
                {cap.id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reputation */}
      {showReputation && reputation && reputation.feedbackCount > 0 && (
        <ReputationBadge rep={reputation} />
      )}

      {/* x402 endpoint */}
      {agent.x402?.endpoint && (
        <div style={{ fontSize: 11, color: "#6B7280" }}>
          <strong>Payment endpoint:</strong>{" "}
          <code style={{ fontSize: 11 }}>{agent.x402.endpoint}</code>
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: 11, color: "#9CA3AF", borderTop: "1px solid #F3F4F6", paddingTop: 8 }}>
        Owner: <code style={{ fontSize: 11 }}>{agent.ownerAddress.slice(0, 8)}…{agent.ownerAddress.slice(-6)}</code>
        {" · "}
        Ledger #{agent.registeredAt}
      </div>
    </div>
  );
}
