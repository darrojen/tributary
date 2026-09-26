// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FlowBase — shared accounting for USDC-per-second flows on Arc.
/// @notice Arc's native gas token IS USDC, so value and gas share one currency.
///         All amounts use the ERC-20 USDC interface with 6 decimals.
abstract contract FlowBase {
    /// @dev Native USDC ERC-20 interface on Arc (mainnet & testnet):
    ///      0x3600000000000000000000000000000000000000
    address public immutable USDC;

    uint256 internal constant SCALE = 1e6; // USDC has 6 decimals

    constructor(address usdc_) {
        USDC = usdc_;
    }

    function _pull(uint256 amount) internal {
        require(amount > 0, "amount=0");
        (bool ok, bytes memory ret) = USDC.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount)
        );
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "USDC transferFrom failed");
    }

    function _push(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok, bytes memory ret) = USDC.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "USDC transfer failed");
    }
}
