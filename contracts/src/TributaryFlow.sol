// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FlowBase} from "./FlowBase.sol";

/// @title TributaryFlow — per-second USDC streams on Arc.
/// @notice Fund a stream with USDC; it drips to the recipient every second.
///         Either party can pause or wind down at any time; no one is ever locked in.
contract TributaryFlow is FlowBase {
    uint256 private _nextId = 1;

    struct Stream {
        address payer;      // funds the stream
        address recipient;  // receives the drips
        uint256 ratePerSecond; // in USDC units (6 decimals)
        uint256 balance;    // USDC held by this stream
        uint64  lastSettled; // timestamp of last settlement
        uint64  start;      // stream start time
        bool    paused;
    }

    /// @dev streams indexed by external id to keep the struct out of the public getter
    mapping(uint256 => Stream) internal _streams;
    /// @dev stream ids for a given participant (payer or recipient)
    mapping(address => uint256[]) internal _idsOf;

    event StreamCreated(uint256 indexed id, address indexed payer, address indexed recipient, uint256 ratePerSecond, uint256 funded, uint64 start);
    event StreamFunded(uint256 indexed id, uint256 amount);
    event Settled(uint256 indexed id, address indexed to, uint256 amount, uint256 remainingBalance);
    event PauseToggled(uint256 indexed id, bool paused);
    event StreamClosed(uint256 indexed id, uint256 refundToPayer, uint256 paidToRecipient);

    error NotParty();
    error NotPayer();
    error NotRecipient();
    error Paused();
    error ZeroRate();
    error EmptyStream();

    modifier onlyParty(uint256 id) {
        Stream storage s = _streams[id];
        if (msg.sender != s.payer && msg.sender != s.recipient) revert NotParty();
        _;
    }

    constructor(address usdc_) FlowBase(usdc_) {}

    // ---------- create & fund ----------

    /// @notice Create a stream. `initialFunding` USDC is pulled from the caller
    ///         (approve the USDC ERC-20 interface first) and settles immediately.
    function createStream(address recipient, uint256 ratePerSecond, uint256 initialFunding)
        external
        returns (uint256 id)
    {
        if (recipient == address(0) || recipient == msg.sender) revert ZeroRate(); // reuse guard
        if (ratePerSecond == 0) revert ZeroRate();
        id = _nextId++;
        Stream storage s = _streams[id];
        s.payer = msg.sender;
        s.recipient = recipient;
        s.ratePerSecond = ratePerSecond;
        s.start = uint64(block.timestamp);
        s.lastSettled = uint64(block.timestamp);
        s.paused = false;
        _idsOf[msg.sender].push(id);
        _idsOf[recipient].push(id);
        if (initialFunding > 0) {
            _pull(initialFunding);
            s.balance = initialFunding;
        }
        emit StreamCreated(id, msg.sender, recipient, ratePerSecond, initialFunding, s.start);
    }

    /// @notice Top up a stream with more USDC.
    function fundStream(uint256 id, uint256 amount) external {
        Stream storage s = _streams[id];
        if (s.payer == address(0)) revert EmptyStream();
        _pull(amount);
        s.balance += amount;
        emit StreamFunded(id, amount);
    }

    // ---------- reading ----------

    function streamOf(uint256 id)
        external
        view
        returns (
            address payer,
            address recipient,
            uint256 ratePerSecond,
            uint256 balance,
            uint64 start,
            bool paused,
            uint256 accrued // USDC earned by recipient but not yet paid out
        )
    {
        Stream storage s = _streams[id];
        return (s.payer, s.recipient, s.ratePerSecond, s.balance, s.start, s.paused, _accrued(s));
    }

    function streamIdsFor(address who) external view returns (uint256[] memory) {
        return _idsOf[who];
    }

    /// @notice USDC accrued (unpaid) for the stream's recipient right now.
    function accruedOf(uint256 id) external view returns (uint256) {
        return _accrued(_streams[id]);
    }

    function _accrued(Stream storage s) internal view returns (uint256) {
        if (s.paused || s.balance == 0 || s.ratePerSecond == 0) return 0;
        uint256 elapsed = block.timestamp - s.lastSettled;
        uint256 due = elapsed * s.ratePerSecond;
        return due > s.balance ? s.balance : due; // capped at remaining balance
    }

    // ---------- settlement ----------

    /// @notice Pay out everything accrued so far to the recipient.
    ///         Permissionless — anyone can settle, the recipient always gets paid.
    function settle(uint256 id) external {
        Stream storage s = _streams[id];
        uint256 due = _accrued(s);
        if (due == 0) revert EmptyStream();
        s.balance -= due;
        s.lastSettled = uint64(block.timestamp);
        _push(s.recipient, due);
        emit Settled(id, s.recipient, due, s.balance);
    }

    /// @notice Payer tops up and settles in one call (nice UX for cron/auto-fund).
    function fundAndSettle(uint256 id, uint256 amount) external {
        Stream storage s = _streams[id];
        if (s.payer == address(0)) revert EmptyStream();
        _pull(amount);
        s.balance += amount;
        emit StreamFunded(id, amount);
        uint256 due = _accrued(s);
        if (due > 0) {
            s.balance -= due;
            s.lastSettled = uint64(block.timestamp);
            _push(s.recipient, due);
            emit Settled(id, s.recipient, due, s.balance);
        }
    }

    // ---------- control ----------

    function setPaused(uint256 id, bool paused) external onlyParty(id) {
        Stream storage s = _streams[id];
        // settle pending accrual and reset the clock so paused time never counts
        uint256 due = _accrued(s);
        if (due > 0) {
            s.balance -= due;
            _push(s.recipient, due);
            emit Settled(id, s.recipient, due, s.balance);
        }
        s.lastSettled = uint64(block.timestamp);
        s.paused = paused;
        emit PauseToggled(id, paused);
    }

    /// @notice Wind down: settle everything owed, refund the rest to the payer, delete.
    function closeStream(uint256 id) external onlyParty(id) {
        Stream storage s = _streams[id];
        uint256 due = _accrued(s);
        uint256 refund = s.balance - due;
        s.balance = 0;
        s.lastSettled = uint64(block.timestamp);
        if (due > 0) _push(s.recipient, due);
        if (refund > 0) _push(s.payer, refund);
        delete _streams[id];
        emit StreamClosed(id, refund, due);
    }
}
