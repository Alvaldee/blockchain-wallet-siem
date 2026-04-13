// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Vulnerable {
    mapping(address => uint256) public balances;

    // Deposit ETH into the contract
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // Vulnerable withdraw function
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        // Vulnerability: external call BEFORE state update
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");

        // State update AFTER sending ETH (this is the flaw)
        unchecked {
            balances[msg.sender] -= _amount;
        }
    }

    // Helper: check contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}