// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IGambitToken is IERC20 {
    function mintAndApproveGambit(address player, uint256 amount) external;
}
contract Gambit {
    address public owner;
    IGambitToken public gambitToken;

    error AlreadyRegistered();
    error UsernameAlreadyTaken();

    constructor(address _tokenAddress) {
        owner = msg.sender;
        gambitToken = IGambitToken(_tokenAddress);
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "not owner");
        _ ;
    }

    struct Player{
        string username;
        address playerAddress;
        uint rating;
        uint[] matchIds;
        bool isRegistered;
    }

    struct Match{
        string matchId;
        address[] playerAddresses;
        string[] startSignatures;
        string moveHistory;  
        address winnerAddress;
        uint256 stakeAmount;
        bool isSettled;
    }
    
    mapping(address => Player) public addressToPlayer;
    mapping(string => Match) public matchIdToMatch;
    mapping(string => bool) public isUsernameTaken;

    function registerPlayer(string memory _username) public {
        if(addressToPlayer[msg.sender].isRegistered==true){
            revert AlreadyRegistered();
        }
        if (isUsernameTaken[_username]){
            revert UsernameAlreadyTaken();
        }
        addressToPlayer[msg.sender].username = _username;
        addressToPlayer[msg.sender].playerAddress = msg.sender;
        addressToPlayer[msg.sender].isRegistered = true;
        isUsernameTaken[_username] = true;
        gambitToken.mintAndApproveGambit(msg.sender, 200* 10**18); // 200 full GBT tokens
    }
     
    function adjustRating(uint _change, bool _inc, address _playerAddress) public onlyOwner {
        if (_inc){
            addressToPlayer[_playerAddress].rating += _change;
        } else {
            addressToPlayer[_playerAddress].rating -= _change;
        }
    } 

    function createMatch(
        string memory _matchId,
        address _player1,
        address _player2,
        string memory _signature1,
        string memory _signature2,
        uint256 _stakeAmount
    ) public onlyOwner {
        Match storage newMatch = matchIdToMatch[_matchId];
        
        // Initialize arrays
        newMatch.playerAddresses.push(_player1);
        newMatch.playerAddresses.push(_player2);
        newMatch.startSignatures.push(_signature1);
        newMatch.startSignatures.push(_signature2);
        newMatch.stakeAmount = _stakeAmount;
        
        // Update player match history
        addressToPlayer[_player1].matchIds.push(uint(keccak256(abi.encodePacked(_matchId))));
        addressToPlayer[_player2].matchIds.push(uint(keccak256(abi.encodePacked(_matchId))));
    }
    
    function getFullPlayerData(address _playerAddress) public view  returns (string memory username, address playerAddress, uint rating, uint[] memory matchIds, bool isRegistered) {
    
    Player storage player = addressToPlayer[_playerAddress];
    return (player.username, player.playerAddress, player.rating, player.matchIds, player.isRegistered);
    
    }

    function settleMatch(
        string memory _matchId, 
        string memory _moveHistory, 
        address _winnerAddress
    ) public onlyOwner {
        Match storage _match = matchIdToMatch[_matchId];
        
        // Prevent double settlement
        require(!_match.isSettled, "Match already settled");
        
        // Update match data
        _match.moveHistory = _moveHistory;
        _match.winnerAddress = _winnerAddress;
        
        // Find loser address
        address loserAddress;
        if (_match.playerAddresses[0] == _winnerAddress) {
            loserAddress = _match.playerAddresses[1];
        } else {
            loserAddress = _match.playerAddresses[0];
        }
        
        // Transfer stake from loser to winner
        require(
            gambitToken.transferFrom(loserAddress, _winnerAddress, _match.stakeAmount),
            "Token transfer failed"
        );
        
        // Mark as settled
        _match.isSettled = true;
    }
    
    // Emergency function to update token contract if needed
    function updateTokenContract(address _newTokenAddress) external onlyOwner {
        gambitToken = IGambitToken(_newTokenAddress);
    }
}



