// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Selfdistructable is Ownable {
    address payable public defaultToken;

    constructor(address token) public payable {
        defaultToken = payable(token);
    }

    /* Withdraw and selfdistruct */
    function withdrawToken(address _tokenContract) public onlyOwner {
        IERC20 tokenContract = IERC20(_tokenContract);
        uint256 amount = tokenContract.balanceOf(address(this));
        tokenContract.transfer(owner(), amount);
    }

    function emptyERC20(address _tokenContract) public view returns (bool) {
        IERC20 tokenContract = IERC20(_tokenContract);
        return (tokenContract.balanceOf(address(this)) == 0);
    }

    function suicide(bool force) public onlyOwner {
        bool empty = false;
        if (!force) {
            withdrawToken(defaultToken);
            empty = emptyERC20(defaultToken);
        }
        if (empty || force) {
            selfdestruct(payable(owner()));
        }
    }
}
