# 🔐 Blockchain Wallet Risk Scoring Engine

A modular blockchain transaction monitoring system built in Python that analyzes wallet activity, applies structured detection rules, and produces wallet-level risk scores.

This project simulates a simplified blockchain security engine similar to those used in fraud detection, compliance monitoring, and blockchain analytics platforms.

---

## 🚀 Overview

The system performs the following steps:

1. Ingests wallet transaction history via JSON-RPC
2. Stores transaction data in SQLite
3. Applies modular, weighted detection rules
4. Aggregates transaction-level risk
5. Produces wallet-level risk tiers (LOW / MEDIUM / HIGH / CRITICAL)

The architecture separates ingestion, storage, rule logic, and risk aggregation to mirror real-world security system design.

---

## 🧠 Architecture
Blockchain RPC
↓
Data Ingestion Layer
↓
SQLite Storage
↓
Detection Engine (Modular Rules)
↓
Wallet Risk Aggregator
↓
Structured Risk Output

### Project Structure
project/
│
├── main.py
├── storage.py
├── wallet.db
│
└── detector/
├── engine.py
├── security_rules.py
├── behavior.py
└── wallet_risk.py

---

## 🔎 Detection Capabilities

### Transaction-Level Rules

- High-value transfer detection
- Interaction with flagged wallets
- Weighted scoring per triggered rule
- Structured rule IDs and descriptions

### Behavioral Analysis

- Burst activity detection (rapid transaction execution)
- Wallet-level risk accumulation
- Risk tier classification based on aggregate score

---

## ⚙️ Example Output

```json
{
  "wallet": "0xABC123...",
  "transactions_analyzed": 12,
  "risk_score": 190,
  "risk_level": "CRITICAL",
  "triggered_rules": [
    {
      "rule_id": "TX001",
      "description": "High value transfer",
      "weight": 50
    },
    {
      "rule_id": "TX002",
      "description": "Interaction with flagged wallet",
      "weight": 80
    }
  ]
}