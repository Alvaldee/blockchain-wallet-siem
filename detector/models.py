from dataclasses import dataclass

@dataclass
class Transaction:
    tx_hash: str
    sender: str
    recipient: str
    value: int
    method: str
    gas_price: int
    timestamp: int
    block_number: int
