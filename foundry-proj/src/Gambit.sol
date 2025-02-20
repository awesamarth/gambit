// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

contract Gambit {

    address owner;

    constructor () {
        owner = msg.sender;
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
        address [] playerAddresses;
        string [] startSignatures;
        string moveHistory;  
        address winnerAddress;
    }
    
    mapping (address=>Player) public addressToPlayer;
    mapping (string => Match) public matchIdToMatch;
     

    function adjustRating (uint _change, bool _inc, address _playerAddress) public onlyOwner {
        if (_inc){

        addressToPlayer[_playerAddress].rating += _change;
        }

        else{
            addressToPlayer[_playerAddress].rating-=_change;
        }
    } 

    function addStartSignatures (address _player1, address _player2, string memory _matchId, string memory _signature1, string memory _signature2) public onlyOwner {
        
        matchIdToMatch[_matchId].playerAddresses.push(_player1);
        matchIdToMatch[_matchId].playerAddresses.push(_player2);
        matchIdToMatch[_matchId].startSignatures.push(_signature1);
        matchIdToMatch[_matchId].startSignatures.push(_signature2);

    }


    function matchDone(string memory _matchId, 
    string memory _moveHistory, 
    address _winnerAddress 
    ) public onlyOwner {
        matchIdToMatch[_matchId].moveHistory = _moveHistory;
        matchIdToMatch[_matchId].winnerAddress = _winnerAddress;
    }




    
    

}


