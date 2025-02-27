// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract GambitToken is ERC20, Ownable {
    // Game contract address that will handle token transfers
    address public gambitContract;
    
    constructor() ERC20("Gambit Token", "GBT") Ownable(msg.sender) {}
    
    modifier onlyOwnerOrGambit (){
        require(msg.sender==gambitContract || msg.sender== owner());
        _;
    }

    // Allow owner to set the Gambit contract address
    function setGambitContract(address _gambitContract) external onlyOwner {
        gambitContract = _gambitContract;
    }
    
    // Mint tokens to a player
    function mint(address to, uint256 amount) public onlyOwnerOrGambit {
        _mint(to, amount);
    }

    
    
    function mintAndApproveGambit(address player, uint256 amount) external onlyOwnerOrGambit {
        require(gambitContract != address(0), "Gambit contract not set");
        
        // Mint tokens to player
        _mint(player, amount);
        _approve(player, gambitContract, type(uint256).max);
    }
}