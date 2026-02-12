from web3 import Web3
from config import RPC_URL

w3 = Web3(Web3.HTTPProvider(RPC_URL))

def get_transaction(tx_hash: str):
    tx = w3.eth.get_transaction(tx_hash)
    receipt = w3.eth.get_transaction_receipt(tx_hash)
    block = w3.eth.get_block(tx.blockNumber)

    return {
        "hash": tx.hash.hex(),
        "from": tx["from"],
        "to": tx["to"],
        "value": tx["value"],
        "input": tx["input"],
        "gas_price": tx["gasPrice"],
        "block_number": tx.blockNumber,
        "timestamp": block.timestamp
    }
