# Blockchain Wallet Risk Scoring Engine

A modular blockchain transaction monitoring system built in Python that analyzes wallet activity, applies structured detection rules, and produces wallet-level risk scores.

This project simulates a lightweight blockchain SIEM (Security Information and Event Management) system similar to those used in fraud detection, compliance monitoring, and blockchain analytics platforms.

---

## Overview

The system performs the following steps:

1. Ingests wallet transaction history via JSON-RPC
2. Stores transaction data in SQLite
3. Applies modular, weighted detection rules
4. Aggregates transaction-level risk
5. Produces wallet-level risk tiers (LOW / MEDIUM / HIGH / CRITICAL)

The architecture separates ingestion, storage, rule logic, and risk aggregation to mirror real-world security system design.

---

## Threat Scenario: Wallet Drain Attack

This project simulates a common Web3 attack scenario where a malicious actor gains access to a user's wallet (e.g., via phishing or private key compromise) and rapidly drains funds.

Typical attack characteristics include:

Sudden high-value transfers

Transactions to previously unseen or flagged wallets

Rapid execution of multiple transactions in a short time

This system detects such behaviour using a rule-based detection engine combined with transaction history analysis.

---

## Architecture
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
└── api/
├── main.py
├── simulate.py
│
└── data/ 
├── wallet.db
│
└── detector/
├── alerts.py
├── behaviour.py
├── engine.py
├── models.py
├── rules.py
├── scorer.py
├── security_rules.py
└── wallet_risk.py

---

## Detection Capabilities

### Transaction-Level Rules

- High-value transfer detection
- Interaction with flagged wallets
- Weighted scoring per triggered rule
- Structured rule IDs and descriptions

### Behavioral Analysis

- Burst activity detection
- Wallet-level risk accumulation
- Risk tier classification based on aggregate score
- Stateful behavioural detection using transaction history

---

## Simulation
The system includes a wallet activity simulator that generates both normal and malicious transactions to emulate a wallet drain attack scenario.

This allows testing of:
- Detection accuracy
- Rule triggering
- Risk score escalation

---

## Example Output

```json
{
  "wallet": "0xABC123...",
  "transactions_analyzed": 4,
  "risk_score": 460,
  "risk_level": "CRITICAL",
  "triggered_rules": [
    {
      "rule_id": "TX001",
      "description": "High value transfer",
      "weight": 50,
      "affected_transactions": ["0x3", "0x4"]
    },
    {
      "rule_id": "TX002",
      "description": "Interaction with flagged wallet",
      "weight": 80,
      "affected_transactions": ["0x3", "0x4"]
    },
    {
      "rule_id": "TX003",
      "description": "Rapid drain behavior",
      "weight": 100,
      "affected_transactions": ["0x3", "0x4"]
    }
  ],
  "total_score_breakdown": {
    "TX001": 100,
    "TX002": 160,
    "TX003": 200
  }
}