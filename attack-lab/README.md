# Ethereum Smart Contract SIEM

A security monitoring lab that simulates real Ethereum smart contract attacks and detects them in real time. Alerts are delivered to Discord and indexed in Elasticsearch for analysis in Kibana.

## What it does

A detection bot watches every block on a local Hardhat network. When a transaction touches a monitored contract, the bot inspects the logs for known attack signatures and fires an alert with full context — transaction hash, attacker address, attack type, and severity.

### Vulnerabilities covered

| Vulnerability | Contract | Detection signal |
|---|---|---|
| Reentrancy | `Vulnerable.sol` | Same address emits `Withdraw` ≥ 2 times in one transaction |
| Integer Overflow | `VulnerableBank.sol` | `Transfer` event where amount exceeds the sender's tracked balance |
| Access Control | `VulnerableVault.sol` | `VaultDrained` event emitted by an address that is not the owner |

---

## Architecture

```
Hardhat node (local chain)
        │
        │  blocks / transactions
        ▼
  bot/agent.js          ← scans every transaction receipt for logs from monitored contracts
        │
        ▼
  bot/detection.js      ← routes logs by contract type, detects attack patterns
        │
   ┌────┴─────┐
   ▼          ▼
Discord    Elasticsearch  ←  Kibana dashboard
```

---

## Prerequisites

- Node.js 18+
- Docker Desktop (for Elasticsearch and Kibana)

---

## Setup

### 1. Install dependencies

```bash
cd attack-lab
npm install
```

### 2. Configure Discord webhook

Copy your Discord webhook URL into `.env`:

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

`.env` is gitignored and never committed.

---

## Running the lab

Each step runs in its own terminal.

### Terminal 1 — local blockchain
```bash
npx hardhat node
```

### Terminal 2 — Elasticsearch + Kibana
```bash
docker compose up -d
```

### Terminal 3 — deploy all vulnerable contracts (run once per session)
```bash
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/deployBank.js --network localhost
npx hardhat run scripts/deployVault.js --network localhost
```

Each script deploys its contract, funds it with ETH, and writes the address to `bot/config.json` automatically.

### Terminal 4 — start the detection bot
```bash
node bot/agent.js
```

Start this **after** all three deploy scripts have finished so `config.json` has all addresses loaded. The bot will confirm Elasticsearch connectivity on startup.

### Terminal 5 — run attacks
```bash
# Reentrancy attack
npx hardhat run scripts/attack.js --network localhost

# Integer overflow attack
npx hardhat run scripts/attackOverflow.js --network localhost

# Access control attack
npx hardhat run scripts/attackAccessControl.js --network localhost
```

Each attack can be run multiple times. Redeploy (Terminal 3) between sessions to refund the contracts.

---

## Kibana setup (first time only)

1. Open `http://localhost:5601`
2. Go to **Stack Management → Data Views → Create data view**
3. Set name and index pattern to `siem-alerts`
4. Set timestamp field to `@timestamp`
5. Save — then open **Discover** and select `siem-alerts`

---

## Project structure

```
attack-lab/
├── contracts/
│   ├── Vulnerable.sol          # Reentrancy vulnerability (CEI pattern violated)
│   ├── Attacker.sol            # Reentrancy exploit contract
│   ├── VulnerableBank.sol      # Integer overflow via unchecked subtraction
│   ├── OverflowAttacker.sol    # Overflow exploit contract
│   └── VulnerableVault.sol     # Missing onlyOwner on drainVault()
│
├── scripts/
│   ├── deploy.js               # Deploy Vulnerable, fund with 10 ETH
│   ├── deployBank.js           # Deploy VulnerableBank, fund with 5 ETH
│   ├── deployVault.js          # Deploy VulnerableVault, fund with 5 ETH
│   ├── attack.js               # Run reentrancy attack
│   ├── attackOverflow.js       # Run integer overflow attack
│   └── attackAccessControl.js  # Run access control attack (uses account[1])
│
├── bot/
│   ├── agent.js                # Block listener — routes transactions to detection
│   ├── detection.js            # Attack detection logic for all three vulnerability types
│   └── config.json             # Monitored contract addresses (auto-updated by deploy scripts)
│
├── alerts/
│   └── discordAlert.js         # Sends formatted Discord embed via webhook
│
├── logs/
│   └── esClient.js             # Elasticsearch client
│
├── docker-compose.yml          # Elasticsearch 8 + Kibana 8
├── hardhat.config.js
├── .env                        # Discord webhook URL (gitignored)
└── .gitignore
```

---

## How each attack works

### Reentrancy
`Vulnerable.sol` transfers ETH to the caller **before** updating the balance. `Attacker.sol` exploits this by re-entering `withdraw()` inside its `receive()` function up to 5 times, draining more ETH than it deposited.

Detection: the bot counts `Withdraw` events per address within a single transaction. Two or more from the same address is the reentrancy signal.

### Integer Overflow
`VulnerableBank.sol` uses `unchecked` arithmetic in its `transfer()` function. Subtracting 2 from a balance of 1 silently wraps to `uint256.max`, giving the attacker an unlimited balance to drain the vault.

Detection: the bot tracks each address's deposited balance. A `Transfer` event where the sent amount exceeds the tracked balance signals an underflow.

### Access Control
`VulnerableVault.sol` has a `drainVault()` function with no `onlyOwner` guard. Any address can call it to sweep the entire vault balance.

Detection: the bot records the owner address at deploy time. A `VaultDrained` event emitted by any other address is flagged as a critical access control violation.

---

## Alert severity

| Type | Severity | Discord colour |
|---|---|---|
| Access Control | CRITICAL | Dark red |
| Reentrancy | HIGH | Red |
| Integer Overflow | HIGH | Red |
