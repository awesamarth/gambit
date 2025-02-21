// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Gambit {
    address public owner;
    IERC20 public gambitToken;

    constructor(address _tokenAddress) {
        owner = msg.sender;
        gambitToken = IERC20(_tokenAddress);
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "not owner");
        _ ;
    }

    struct Player{
        address playerAddress;
        uint rating;
        uint[] matchIds;
    }

    struct Match{
        string matchId;
        address[] playerAddresses;
        string[] startSignatures;
        string moveHistory;  
        address winnerAddress;
        uint256 wager;
        bool isSettled;
    }
    
    mapping(address => Player) public addressToPlayer;
    mapping(string => Match) public matchIdToMatch;
    mapping(string => uint) public tierToWager;
     
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
        uint256 _wager
    ) public onlyOwner {
        Match storage newMatch = matchIdToMatch[_matchId];
        
        newMatch.playerAddresses.push(_player1);
        newMatch.playerAddresses.push(_player2);
        newMatch.startSignatures.push(_signature1);
        newMatch.startSignatures.push(_signature2);
        newMatch.wager = _wager;
        
        addressToPlayer[_player1].matchIds.push(uint(keccak256(abi.encodePacked(_matchId))));
        addressToPlayer[_player2].matchIds.push(uint(keccak256(abi.encodePacked(_matchId))));
    }

    function settleMatch(
        string memory _matchId, 
        string memory _moveHistory, 
        address _winnerAddress
    ) public onlyOwner {
        Match storage _match = matchIdToMatch[_matchId];
        
        require(!_match.isSettled, "Match already settled");
        

        _match.moveHistory = _moveHistory;
        _match.winnerAddress = _winnerAddress;
        
        address loserAddress;
        if (_match.playerAddresses[0] == _winnerAddress) {
            loserAddress = _match.playerAddresses[1];
        } else {
            loserAddress = _match.playerAddresses[0];
        }
        
        require(
            gambitToken.transferFrom(loserAddress, _winnerAddress, _match.wager),
            "Token transfer failed"
        );
        
        _match.isSettled = true;
    }
    
    function updateTokenContract(address _newTokenAddress) external onlyOwner {
        gambitToken = IERC20(_newTokenAddress);
    }
}