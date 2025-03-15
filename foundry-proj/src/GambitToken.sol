// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract GambitToken is ERC20, Ownable {
    
    error InsufficientEther();
    
    // Game contract address that will handle token transfers
    
    address public gambitContract;
    uint constant PRICE_PER_FULL_TOKEN= 10**14 ;
    

    
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
    function mint(address _to, uint256 _amount) public onlyOwnerOrGambit {
        _mint(_to, _amount);
    }

    function buyTokens(uint256 _fullTokenAmount) external payable{
        if (msg.value < _fullTokenAmount * PRICE_PER_FULL_TOKEN){
            revert InsufficientEther();
        }

        _mint(msg.sender, _fullTokenAmount*10**18);

    }

    
    
    function mintAndApproveGambit(address _player, uint256 _amount) external onlyOwnerOrGambit {
        require(gambitContract != address(0), "Gambit contract not set");
        
        // Mint tokens to player
        _mint(_player, _amount);
        _approve(_player, gambitContract, type(uint256).max);
    }
}