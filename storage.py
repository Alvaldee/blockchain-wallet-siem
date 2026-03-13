import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "wallet.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tx_hash TEXT UNIQUE,
            from_address TEXT,
            to_address TEXT,
            value REAL,
            block_number INTEGER,
            risk_score INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()


def insert_transaction(tx):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR IGNORE INTO transactions
        (tx_hash, from_address, to_address, value, block_number)
        VALUES (?, ?, ?, ?, ?)
    """, (
        tx["hash"],
        tx["from"],
        tx["to"],
        tx["value"],
        tx["blockNumber"]
    ))

    conn.commit()
    conn.close()
