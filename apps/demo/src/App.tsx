import React, { useEffect, useState } from "react";
import { AgentCard } from "@stellar-agent-registry/react";
import { AgentRegistry } from "@stellar-agent-registry/sdk";
import type { AgentRecord } from "@stellar-agent-registry/sdk";

const REGISTRY_OPTIONS = { mock: true } as const;

const SEED_AGENTS = [
  {
    agentId: "summarizer-pro",
    name: "Summarizer Pro",
    description: "State-of-the-art abstractive text summarisation for any domain.",
    ownerAddress: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    capabilities: [
      { id: "text-summarize", description: "Summarises long documents" },
      { id: "keyword-extract", description: "Extracts key phrases" },
    ],
    pricingModel: "per-call" as const,
    x402: { endpoint: "https://sum-pro.example.com/pay", assets: ["USDC"] },
    version: "1.2.0",
  },
  {
    agentId: "sentiment-bot",
    name: "Sentiment Bot",
    description: "Real-time multilingual sentiment and emotion detection.",
    ownerAddress: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    capabilities: [
      { id: "sentiment-analysis", description: "Positive / negative / neutral" },
      { id: "emotion-detection", description: "Joy, anger, fear, surprise…" },
    ],
    pricingModel: "subscription" as const,
    version: "0.9.1",
  },
  {
    agentId: "translation-hub",
    name: "Translation Hub",
    description: "High-quality neural translation across 120+ languages, free tier included.",
    ownerAddress: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    capabilities: [
      { id: "translation", description: "Translate between 120+ languages" },
      { id: "language-detect", description: "Auto-detect source language" },
    ],
    pricingModel: "free" as const,
    x402: { endpoint: "https://trans-hub.example.com/pay", assets: ["USDC", "XLM"] },
    version: "2.0.0",
  },
];

export function App() {
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const registry = new AgentRegistry(REGISTRY_OPTIONS);

    async function seed() {
      for (const agent of SEED_AGENTS) {
        try {
          await registry.register(agent);
          await registry.score({ agentId: agent.agentId, score: 5 });
          await registry.score({ agentId: agent.agentId, score: 4 });
        } catch {
          // already registered on hot reload
        }
      }
      await registry.verify("summarizer-pro");
      setAgentIds(SEED_AGENTS.map((a) => a.agentId));
      setSeeded(true);
    }

    void seed();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        padding: "48px 24px",
      }}
    >
      {/* Header */}
      <header style={{ maxWidth: 900, margin: "0 auto 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span
            style={{
              background: "linear-gradient(135deg, #7C3AED, #2563EB)",
              borderRadius: 10,
              padding: "6px 10px",
              fontSize: 22,
            }}
          >
            ◈
          </span>
          <span style={{ color: "#A5B4FC", fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
            STELLAR AGENT REGISTRY
          </span>
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 800,
            color: "#F1F5F9",
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          On-Chain Agent Discovery
        </h1>
        <p style={{ margin: 0, color: "#94A3B8", fontSize: 15, maxWidth: 560, lineHeight: 1.7 }}>
          Register AI agents on Stellar/Soroban. Discover by capability. Score reputation.
          Advertise x402 payment endpoints so other agents can pay you programmatically.
        </p>
      </header>

      {/* Code snippet */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto 40px",
          background: "#0D1117",
          border: "1px solid #30363D",
          borderRadius: 12,
          padding: "20px 24px",
          overflow: "auto",
        }}
      >
        <div style={{ color: "#8B949E", fontSize: 11, marginBottom: 12, letterSpacing: 1 }}>
          QUICK START
        </div>
        <pre
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.8,
            color: "#E6EDF3",
            whiteSpace: "pre",
          }}
        >
          <span style={{ color: "#FF7B72" }}>import</span>
          {" { AgentRegistry } "}
          <span style={{ color: "#FF7B72" }}>from</span>
          {" "}
          <span style={{ color: "#A5D6FF" }}>'@stellar-agent-registry/sdk'</span>
          {";"}
          {"\n\n"}
          <span style={{ color: "#79C0FF" }}>const</span>
          {" registry = "}
          <span style={{ color: "#FF7B72" }}>new</span>
          {" "}
          <span style={{ color: "#D2A8FF" }}>AgentRegistry</span>
          {"({ contractId: "}
          <span style={{ color: "#A5D6FF" }}>"CA…"</span>
          {" });\n\n"}
          <span style={{ color: "#8B949E" }}>// Register</span>
          {"\n"}
          <span style={{ color: "#FF7B72" }}>await</span>
          {" registry."}
          <span style={{ color: "#D2A8FF" }}>register</span>
          {"({ agentId: "}
          <span style={{ color: "#A5D6FF" }}>"my-agent"</span>
          {", … });\n\n"}
          <span style={{ color: "#8B949E" }}>// Discover</span>
          {"\n"}
          <span style={{ color: "#FF7B72" }}>const</span>
          {" { agents } = "}
          <span style={{ color: "#FF7B72" }}>await</span>
          {" registry."}
          <span style={{ color: "#D2A8FF" }}>lookup</span>
          {"({ capability: "}
          <span style={{ color: "#A5D6FF" }}>"text-summarize"</span>
          {" });\n\n"}
          <span style={{ color: "#8B949E" }}>// Score reputation</span>
          {"\n"}
          <span style={{ color: "#FF7B72" }}>await</span>
          {" registry."}
          <span style={{ color: "#D2A8FF" }}>score</span>
          {"({ agentId: "}
          <span style={{ color: "#A5D6FF" }}>"my-agent"</span>
          {", score: 5 });"}
        </pre>
      </div>

      {/* Agent cards */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, color: "#F1F5F9", fontSize: 18, fontWeight: 700 }}>
            Live Registry — Mock Mode
          </h2>
          {!seeded && (
            <span style={{ color: "#94A3B8", fontSize: 13 }}>Seeding agents…</span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {agentIds.map((id) => (
            <AgentCard
              key={id}
              agentId={id}
              registryOptions={REGISTRY_OPTIONS}
              showCapabilities
              showReputation
              showX402Badge
              onClick={(agent: AgentRecord) => alert(`Clicked: ${agent.name}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
