// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract GambitToken is ERC20, Ownable {
    address public gambitContract;
    
    constructor() ERC20("Gambit Token", "GBT") Ownable(msg.sender) {}
    
    function setGambitContract(address _gambitContract) external onlyOwner {
        gambitContract = _gambitContract;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    
    
    function mintAndApproveGambit(address player, uint256 amount) external onlyOwner {
        require(gambitContract != address(0), "Gambit contract not set");
        
        _mint(player, amount);
        _approve(player, gambitContract, type(uint256).max);
    }
}