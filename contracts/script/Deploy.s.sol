// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {TributaryFlow} from "../src/TributaryFlow.sol";
import {TributarySplit} from "../src/TributarySplit.sol";

/// @dev Arc native USDC ERC-20 interface address (same on mainnet & testnet).
address constant ARC_USDC = 0x3600000000000000000000000000000000000000;

contract Deploy is Script {
    function run() external returns (TributaryFlow flow, TributarySplit split) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        flow = new TributaryFlow(ARC_USDC);
        split = new TributarySplit(ARC_USDC);
        vm.stopBroadcast();

        console2.log("TributaryFlow:", address(flow));
        console2.log("TributarySplit:", address(split));
        console2.log("USDC (native ERC-20 iface):", ARC_USDC);
    }
}
