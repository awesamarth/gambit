// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IGambitToken is IERC20 {
    function mintAndApproveGambit(address player, uint256 amount) external;
}
contract Gambit {
    error AlreadyRegistered();
    error UsernameAlreadyTaken();
    error InsufficientEther();

    address public owner;
    IGambitToken public gambitToken;
    uint totalPlayerCount;


    constructor(address _tokenAddress) {
        owner = msg.sender;
        gambitToken = IGambitToken(_tokenAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    struct Player {
        string username;
        address playerAddress;
        uint rating;
        uint[] matchIds;
    }

    struct Match {
        uint matchId;
        address[] playerAddresses;
        string[] startSignatures;
        string moveHistory;
        address winnerAddress;
        uint256 stakeAmount;
        bool isSettled ;
    }

    mapping(address => Player) public addressToPlayer;
    mapping(uint => Match) public matchIdToMatch;
    mapping(string => bool) public isUsernameTaken;

    function registerPlayer(string memory _username) external payable{
        if (bytes(addressToPlayer[msg.sender].username).length != 0) {
            
            revert AlreadyRegistered();
        }

        if (isUsernameTaken[_username]) {
            revert UsernameAlreadyTaken();
        }
        if (msg.value< 0.01 ether){
            revert InsufficientEther();
        }
        addressToPlayer[msg.sender].username = _username;
        addressToPlayer[msg.sender].playerAddress = msg.sender;
        isUsernameTaken[_username] = true;
        totalPlayerCount++;
        gambitToken.mintAndApproveGambit(msg.sender, 200 * 10 ** 18); // 200 full GBT tokens
    
    }

    function getMatchesByPlayer(
        address _playerAddress,
        uint _limit
    ) external view returns (Match[] memory) {
        uint[] memory matchIds = addressToPlayer[_playerAddress].matchIds;

        // If limit is 0 or greater than array length, return all matches
        uint resultLength = (_limit == 0 || _limit > matchIds.length)
            ? matchIds.length
            : _limit;
        Match[] memory matches = new Match[](resultLength);

        // Start from the end of the array to get most recent matches first
        for (uint i = 0; i < resultLength; i++) {
            uint index = matchIds.length - resultLength + i;
            matches[i] = matchIdToMatch[matchIds[index]];
        }

        return matches;
    }

    function getFullPlayerData(
        address _playerAddress
    )
        public
        view
        returns (
            string memory username,
            address playerAddress,
            uint rating,
            uint[] memory matchIds
        )
    {
        Player storage player = addressToPlayer[_playerAddress];
        return (
            player.username,
            player.playerAddress,
            player.rating,
            player.matchIds
        );
    }

    function settleMatch(
        uint _matchId,
        string memory _moveHistory,
        bool _ranked,
        address _player1,
        address _player2,
        string memory _startSignature1,
        string memory _startSignature2,
        uint256 _stakeAmount,
        address _winnerAddress
    ) public onlyOwner {
        Match storage _match = matchIdToMatch[_matchId];

        // Update match data
        _match.matchId = _matchId;
        _match.playerAddresses.push(_player1);
        _match.playerAddresses.push(_player2);
        _match.startSignatures.push(_startSignature1);
        _match.startSignatures.push(_startSignature2);
        _match.stakeAmount = _stakeAmount;

        _match.moveHistory = _moveHistory;
        _match.winnerAddress = _winnerAddress;

        addressToPlayer[_player1].matchIds.push(_matchId);
        addressToPlayer[_player2].matchIds.push(_matchId);

        // Find loser address
        address loserAddress;
        if (_match.playerAddresses[0] == _winnerAddress) {
            loserAddress = _match.playerAddresses[1];
        } else {
            loserAddress = _match.playerAddresses[0];
        }

        if (_ranked){
        addressToPlayer[_winnerAddress].rating += 20;
        if (addressToPlayer[loserAddress].rating >= 20) {
            addressToPlayer[loserAddress].rating -= 20;
        }
        }


        // Transfer stake from loser to winner
        require(
            gambitToken.transferFrom(
                loserAddress,
                _winnerAddress,
                _match.stakeAmount*10**18
            ),
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
