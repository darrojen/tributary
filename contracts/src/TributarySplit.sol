// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FlowBase} from "./FlowBase.sol";

/// @title TributarySplit — split incoming USDC across payees by percentage.
/// @notice One deposit fans out to up to 10 payees in the same transaction.
///         Shares are basis points (10000 = 100%). Rounding dust stays in the
///         contract and is absorbed by the first payee on the next deposit.
contract TributarySplit is FlowBase {
    uint256 private _nextId = 1;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_PAYEES = 10;

    struct Split {
        address[] payees;
        uint16[] sharesBps; // basis points, must sum to 10_000
        bool exists;
    }

    mapping(uint256 => Split) internal _splits;
    mapping(address => uint256[]) internal _idsOf;

    event SplitCreated(uint256 indexed id, address indexed owner, address[] payees, uint16[] sharesBps);
    event SplitDeposited(uint256 indexed id, address indexed from, uint256 amount);
    event Paid(uint256 indexed id, address indexed payee, uint256 amount);
    event SharesUpdated(uint256 indexed id, uint16[] sharesBps);

    error TooManyPayees();
    error SharesMismatch();
    error ZeroShares();
    error NoSplit();
    error NotPayee();
    error ArrayMismatch();

    constructor(address usdc_) FlowBase(usdc_) {}

    function createSplit(address[] calldata payees, uint16[] calldata sharesBps)
        external
        returns (uint256 id)
    {
        if (payees.length == 0 || payees.length > MAX_PAYEES) revert TooManyPayees();
        if (payees.length != sharesBps.length) revert ArrayMismatch();
        uint256 total;
        for (uint256 i = 0; i < sharesBps.length; i++) {
            if (sharesBps[i] == 0) revert ZeroShares();
            if (payees[i] == address(0)) revert NoSplit();
            total += sharesBps[i];
        }
        if (total != BPS_DENOMINATOR) revert SharesMismatch();

        id = _nextId++;
        Split storage sp = _splits[id];
        sp.exists = true;
        for (uint256 i = 0; i < payees.length; i++) {
            sp.payees.push(payees[i]);
            sp.sharesBps.push(sharesBps[i]);
            _idsOf[payees[i]].push(id);
        }
        emit SplitCreated(id, msg.sender, payees, sharesBps);
    }

    function setShares(uint256 id, uint16[] calldata sharesBps) external {
        Split storage sp = _splits[id];
        if (!sp.exists) revert NoSplit();
        uint256 total;
        for (uint256 i = 0; i < sharesBps.length; i++) {
            if (sharesBps[i] == 0) revert ZeroShares();
            total += sharesBps[i];
        }
        if (sharesBps.length != sp.payees.length) revert ArrayMismatch();
        if (total != BPS_DENOMINATOR) revert SharesMismatch();
        for (uint256 i = 0; i < sharesBps.length; i++) sp.sharesBps[i] = sharesBps[i];
        emit SharesUpdated(id, sharesBps);
    }

    /// @notice Pull `amount` USDC from the caller and immediately pay each payee their share.
    function depositAndSplit(uint256 id, uint256 amount) external {
        Split storage sp = _splits[id];
        if (!sp.exists) revert NoSplit();
        _pull(amount);
        emit SplitDeposited(id, msg.sender, amount);
        _distribute(id, sp, amount);
    }

    function splitOf(uint256 id)
        external
        view
        returns (address[] memory payees, uint16[] memory sharesBps)
    {
        Split storage sp = _splits[id];
        if (!sp.exists) revert NoSplit();
        return (sp.payees, sp.sharesBps);
    }

    function splitIdsFor(address who) external view returns (uint256[] memory) {
        return _idsOf[who];
    }

    function _distribute(uint256 id, Split storage sp, uint256 amount) internal {
        uint256 paid;
        for (uint256 i = 0; i < sp.payees.length; i++) {
            uint256 share = (amount * sp.sharesBps[i]) / BPS_DENOMINATOR;
            if (i == sp.payees.length - 1) {
                share = amount - paid; // absorb rounding dust
            }
            paid += share;
            if (share > 0) {
                _push(sp.payees[i], share);
                emit Paid(id, sp.payees[i], share);
            }
        }
    }
}
