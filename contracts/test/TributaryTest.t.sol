// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "./MockUSDC.sol";
import {TributaryFlow} from "../src/TributaryFlow.sol";
import {TributarySplit} from "../src/TributarySplit.sol";

contract TributaryTest is Test {
    MockUSDC usdc;
    TributaryFlow flow;
    TributarySplit split;

    address alice = address(0xA11CE); // payer / funder
    address bob = address(0xB0B);     // recipient
    address carol = address(0xC0CA);  // bystander
    address dave = address(0xDA0E);   // split payee

    uint256 constant RATE = 1e6;      // 1 USDC per second
    uint256 constant FUND = 100e6;    // 100 USDC

    function setUp() public {
        usdc = new MockUSDC();
        flow = new TributaryFlow(address(usdc));
        split = new TributarySplit(address(usdc));
        usdc.mint(alice, 1_000e6);
        vm.prank(alice);
        usdc.approve(address(flow), type(uint256).max);
        vm.prank(alice);
        usdc.approve(address(split), type(uint256).max);
    }

    // ---------- Streams ----------

    function test_CreateAndSettleStream() public {
        vm.prank(alice);
        uint256 id = flow.createStream(bob, RATE, FUND);

        assertEq(usdc.balanceOf(address(flow)), FUND);
        assertEq(flow.accruedOf(id), 0);

        vm.warp(block.timestamp + 10);
        assertEq(flow.accruedOf(id), 10e6);

        flow.settle(id); // permissionless settle by anyone
        assertEq(usdc.balanceOf(bob), 10e6);
        assertEq(flow.accruedOf(id), 0);

        (, , , uint256 balance, , , ) = flow.streamOf(id);
        assertEq(balance, 90e6);
    }

    function test_StreamAccruesCappedAtBalance() public {
        vm.prank(alice);
        uint256 id = flow.createStream(bob, RATE, 5e6);
        vm.warp(block.timestamp + 10);
        assertEq(flow.accruedOf(id), 5e6, "accrual must cap at stream balance");
        flow.settle(id);
        assertEq(flow.accruedOf(id), 0);
        assertEq(usdc.balanceOf(bob), 5e6);
    }

    function test_PauseSettlesThenStops() public {
        vm.prank(alice);
        uint256 id = flow.createStream(bob, RATE, FUND);
        vm.warp(block.timestamp + 4);

        vm.prank(bob);
        flow.setPaused(id, true);
        assertEq(usdc.balanceOf(bob), 4e6, "pause must settle first");

        vm.warp(block.timestamp + 100);
        assertEq(flow.accruedOf(id), 0, "paused stream must not accrue");

        vm.prank(alice);
        flow.setPaused(id, false);
        vm.warp(block.timestamp + 2);
        assertEq(flow.accruedOf(id), 2e6, "unpause resumes accrual");
    }

    function test_CloseRefundsPayer() public {
        vm.prank(alice);
        uint256 id = flow.createStream(bob, RATE, FUND);
        vm.warp(block.timestamp + 10);

        vm.prank(bob);
        flow.closeStream(id);
        assertEq(usdc.balanceOf(bob), 10e6, "recipient gets accrued");
        assertEq(usdc.balanceOf(alice), 1_000e6 - 10e6, "payer gets refund");
        assertEq(usdc.balanceOf(address(flow)), 0);
    }

    function test_FundAndSettle() public {
        vm.prank(alice);
        uint256 id = flow.createStream(bob, RATE, FUND);
        vm.warp(block.timestamp + 3);
        vm.prank(alice);
        flow.fundAndSettle(id, 50e6);
        assertEq(usdc.balanceOf(bob), 3e6);
        (, , , uint256 balance, , , ) = flow.streamOf(id);
        assertEq(balance, FUND + 50e6 - 3e6);
    }

    function test_NonPartyCannotPause() public {
        vm.prank(alice);
        uint256 id = flow.createStream(bob, RATE, FUND);
        vm.prank(carol);
        vm.expectRevert(TributaryFlow.NotParty.selector);
        flow.setPaused(id, true);
    }

    function test_StreamIdsTrackedForBothParties() public {
        vm.prank(alice);
        uint256 id = flow.createStream(bob, RATE, FUND);
        assertEq(flow.streamIdsFor(alice)[0], id);
        assertEq(flow.streamIdsFor(bob)[0], id);
    }

    // ---------- Splits ----------

    function test_CreateAndDepositSplit() public {
        address[] memory payees = new address[](2);
        payees[0] = bob;
        payees[1] = dave;
        uint16[] memory shares = new uint16[](2);
        shares[0] = 6_000; // 60%
        shares[1] = 4_000; // 40%

        vm.prank(alice);
        uint256 id = split.createSplit(payees, shares);

        vm.prank(alice);
        split.depositAndSplit(id, 10e6);
        assertEq(usdc.balanceOf(bob), 6e6);
        assertEq(usdc.balanceOf(dave), 4e6);
        assertEq(usdc.balanceOf(address(split)), 0, "no dust left on exact split");
    }

    function test_SplitDustGoesToLastPayee() public {
        address[] memory payees = new address[](3);
        payees[0] = bob;
        payees[1] = dave;
        payees[2] = carol;
        uint16[] memory shares = new uint16[](3);
        shares[0] = 3_333;
        shares[1] = 3_333;
        shares[2] = 3_334;

        vm.prank(alice);
        uint256 id = split.createSplit(payees, shares);
        vm.prank(alice);
        split.depositAndSplit(id, 1); // 1 unit of USDC (6 decimals)
        assertEq(usdc.balanceOf(carol), 1, "last payee absorbs rounding");
        assertEq(usdc.balanceOf(address(split)), 0);
    }

    function test_UpdateShares() public {
        address[] memory payees = new address[](2);
        payees[0] = bob;
        payees[1] = dave;
        uint16[] memory shares = new uint16[](2);
        shares[0] = 5_000;
        shares[1] = 5_000;

        vm.prank(alice);
        uint256 id = split.createSplit(payees, shares);

        uint16[] memory newShares = new uint16[](2);
        newShares[0] = 9_000;
        newShares[1] = 1_000;
        split.setShares(id, newShares);

        vm.prank(alice);
        split.depositAndSplit(id, 10e6);
        assertEq(usdc.balanceOf(bob), 9e6);
        assertEq(usdc.balanceOf(dave), 1e6);
    }

    function test_SplitValidation() public {
        address[] memory payees = new address[](2);
        payees[0] = bob;
        payees[1] = dave;
        uint16[] memory bad = new uint16[](2);
        bad[0] = 6_000;
        bad[1] = 3_000; // sums to 9000, not 10000
        vm.prank(alice);
        vm.expectRevert(TributarySplit.SharesMismatch.selector);
        split.createSplit(payees, bad);

        uint16[] memory good = new uint16[](2);
        good[0] = 5_000;
        good[1] = 5_000;
        vm.prank(alice);
        uint256 id = split.createSplit(payees, good);
        vm.expectRevert(TributarySplit.NoSplit.selector);
        split.splitOf(999);
    }
}
