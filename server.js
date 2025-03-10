import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { http, publicActions, verifyMessage } from "viem";
import { createWalletClient, createPublicClient } from "viem";
import { foundry, scrollSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import * as dotenv from 'dotenv'
dotenv.config({path:'.env.local'})

const GAMBIT_ABI=[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_tokenAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "AlreadyRegistered",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			}
		],
		"name": "registerPlayer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_matchId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_moveHistory",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "_player1",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_player2",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_startSignature1",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_startSignature2",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_stakeAmount",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_winnerAddress",
				"type": "address"
			}
		],
		"name": "settleMatch",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newTokenAddress",
				"type": "address"
			}
		],
		"name": "updateTokenContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "UsernameAlreadyTaken",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "addressToPlayer",
		"outputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "playerAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "rating",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "gambitToken",
		"outputs": [
			{
				"internalType": "contract IGambitToken",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_playerAddress",
				"type": "address"
			}
		],
		"name": "getFullPlayerData",
		"outputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "playerAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "rating",
				"type": "uint256"
			},
			{
				"internalType": "uint256[]",
				"name": "matchIds",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_playerAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_limit",
				"type": "uint256"
			}
		],
		"name": "getMatchesByPlayer",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "matchId",
						"type": "uint256"
					},
					{
						"internalType": "address[]",
						"name": "playerAddresses",
						"type": "address[]"
					},
					{
						"internalType": "string[]",
						"name": "startSignatures",
						"type": "string[]"
					},
					{
						"internalType": "string",
						"name": "moveHistory",
						"type": "string"
					},
					{
						"internalType": "address",
						"name": "winnerAddress",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "stakeAmount",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isSettled",
						"type": "bool"
					}
				],
				"internalType": "struct Gambit.Match[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "isUsernameTaken",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "matchIdToMatch",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "matchId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "moveHistory",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "winnerAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "stakeAmount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isSettled",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
const GAMBIT_ADDRESS="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const account = privateKeyToAccount(process.env.PRIVATE_KEY)

const walletClient  = createWalletClient({
  account:account,
  chain: foundry,
  transport: http(),
  
}).extend(publicActions)



app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  // Data structures
  const games = new Map();
  const challenges = new Map(); // Only public challenges

  const waitingPlayers = {
    ranked: {
      novice: [],
      amateur: [],
      pro: [],
      expert: [],
      grandmaster: []
    },
    unranked: {
      novice: [],
      amateur: [],
      pro: [],
      expert: [],
      grandmaster: [],
      open: []
    }
  };

  const walletToSocket = new Map();
  const rankedWagers = {
    novice: 10,
    amateur: 20,
    pro: 50,
    expert: 100,
    grandmaster: 200
  };

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);



    socket.on("join_room", ({ walletAddress, roomId }) => {
      console.log("join room received from client")
      const game = games.get(roomId);

      if (!game) return;


      game.playerColors.b = walletAddress;
      console.log("game is here ", game)

      socket.join(roomId); 
      io.to(roomId).emit('match_found', game);
    });

    //for ranked and unranked modes
    socket.on("join_lobby", ({ walletAddress, username, tier, rankedOrUnranked }) => {
      console.log("join lobby received");
      console.log("Join lobby request:", { walletAddress, username, tier, rankedOrUnranked });
    
      socket.walletAddress = walletAddress;
      socket.username = username; // Store username in socket object
      walletToSocket.set(walletAddress, socket);
    
      const waitingList = waitingPlayers[rankedOrUnranked][tier];
    
      // Don't add if already in queue
      if (!waitingList.includes(walletAddress)) {
        waitingList.push(walletAddress);
      }
    
      // Match players if enough are waiting
      if (waitingList.length >= 2) {
        const player1 = waitingList.shift();
        const player2 = waitingList.shift();
        const roomId = Date.now().toString();
    
        // Get the sockets to retrieve usernames
        const player1Socket = walletToSocket.get(player1);
        const player2Socket = walletToSocket.get(player2);
    
        // Get current time in GMT
        const currentTime = new Date().toUTCString();
    
        // Create message for signing
        const username1 = player1Socket.username || "Player 1";
        const username2 = player2Socket.username || "Player 2";
        const message = `${username1} vs ${username2} | ${tier} | ${rankedOrUnranked} | ${currentTime}`;
    
        // Create game
        games.set(roomId, {
          roomId,
          mode: rankedOrUnranked,
          tier,
          wager: rankedOrUnranked === 'ranked' ? rankedWagers[tier] : 0,
          playerColors: {
            'w': player1,
            'b': player2
          },
          playerUsernames: {
            'w': username1,
            'b': username2
          },
          moves: [],
          captures: {
            w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
            b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
          },
          compactHistory: "",
          currentTurn: 'w',
          gameStatus: 'signing_start',
          winner: "",
          start_sigs: [],
          end_sigs: [],
          message: message // Store the message in the game object
        });
    
        if (player1Socket && player2Socket) {
          console.log("match found");
          player1Socket.join(roomId);
          player2Socket.join(roomId);
    
          // Get the game with the message
          const game = games.get(roomId);
    
          // Send the game with the message to both players
          io.to(roomId).emit('match_found', game);
        }
      }
    });

    //for arena and private matches
    socket.on("create_room", ({ walletAddress, tier, wager, isChallenge }) => {
      console.log("create room received")
      socket.walletAddress = walletAddress;
      walletToSocket.set(walletAddress, socket);

      const roomId = Date.now().toString();
      const roomData = {
        roomId,
        mode: "unranked",
        tier,
        wager,
        capturedPieces:{w:[], b:[]},
        playerColors: {
          'w': walletAddress,
          'b': ""
        },
        moves: [],
        compactHistory: "",
        currentTurn: 'w',
        gameStatus: 'waiting',
        winner: ""
      };

      // Store in appropriate map(s)
      games.set(roomId, roomData);
      socket.join(roomId);

      if (isChallenge) {
        challenges.set(roomId, roomData);
        // Broadcast the full challenge data to all clients
        io.emit('challenge_created', roomData);
      } else {
        // Only tell the creator
        console.log("emitting private room created")
        socket.emit('private_room_created', { roomId });
      }

    });


    socket.on("get_game_data", ({ roomId, walletAddress }) => {
      console.log("room id idhar hai", roomId)
      const game = games.get(roomId.toString());
    
      console.log("ye dekh game", game)
      if (!game) {
        socket.emit('game_data', { error: 'Game not found' });
        return;
      }
    
      // Store the wallet address for this socket
      socket.walletAddress = walletAddress;
      walletToSocket.set(walletAddress, socket);
    
      // Join the room
      socket.join(roomId);
    
      // Send the game data
      socket.emit('game_data', (game));
    });

    socket.on("sign_start", async({ roomId, signature, address }) => {
      console.log("Signature received from client:", { roomId, signature, address });

      const game = games.get(roomId);
      if (!game) {
        console.log("Game not found for signature verification");
        return;
      }

      const valid = await verifyMessage({
        address: address ,
        message: game.message,
        signature: signature 
      })

      console.log(valid)

      if(!valid){
        console.log("invalid signature")
        return
      }
      // Increment signature count
      game.start_sigs.push(signature);
      console.log(`Signature count for game ${roomId}: ${game.start_sigs.length}`);

      // If both players have signed, start the game
      if (game.start_sigs.length === 2) {
        console.log("Both players have signed. Starting game!");
        game.gameStatus = 'started';

        // Emit start_game event to the room
        io.to(roomId).emit('game_started', (game));
      }
    });

    socket.on("sign_end", async({ roomId, signature, address }) => {
      console.log("Signature received from client:", { roomId, signature, address });

      const game = games.get(roomId);
      if (!game) {
        console.log("Game not found for signature verification");
        return;
      }

      const valid = await verifyMessage({
        address: address ,
        message: `Game History is:\n${game.compactHistory}`,
        signature: signature 
      })

      console.log(valid)

      if(!valid){
        console.log("invalid signature")
        return
      }
      // Increment signature count
      game.end_sigs.push(signature);
      console.log(`End signature count for game ${roomId}: ${game.end_sigs.length}`);

      // If both players have signed, start the game
      if (game.end_sigs.length === 2) {
        console.log("Both players have signed. Ending game!");
        game.gameStatus = 'ended';

        const { request } = await walletClient.simulateContract({
          address: GAMBIT_ADDRESS,
          abi: GAMBIT_ABI,
          functionName: 'settleMatch',
          args:[Number(game.roomId), game.compactHistory, game.playerColors['w'], game.playerColors['b'], game.start_sigs[0], game.start_sigs[0], game.wager, game.winner   ]
        })

        console.log(request)
        await walletClient.writeContract(request)

        // Emit game_ended event to the room
        io.to(roomId).emit('game_ended', (game));
        games.delete(roomId);
      }
    });


    socket.on("get_challenges", () => {
      console.log("Client requested available challenges");

      // Convert challenges Map to an array
      const availableChallenges = Array.from(challenges.values()).filter(challenge =>
        challenge.gameStatus === 'waiting' && challenge.playerColors.b === ""
      );

      // Send the challenges back to the client
      socket.emit('challenges_list', availableChallenges);

      console.log(`Sent ${availableChallenges.length} available challenges to client`);
    });

    socket.on("make_move", ({ roomId, walletAddress, from, to, piece, promotion, captured }) => {
      console.log("make move received from client");

      console.log("here's captured")
      console.log(captured)
      
      const game = games.get(roomId);
      if (!game) {
        console.log("no game");
        return;
      }
    
      // Update game state - store the complete move details
      const moveData = {
        from,
        to,
        color: game.currentTurn,
        player: walletAddress,
        piece,
        promotion,
        captured
      };
      
      game.moves.push(moveData);
      
      // Handle capture if a piece was captured
      if (captured) {
        // Initialize captures object if it doesn't exist
        if (!game.captures) {
          game.captures = {
            w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
            b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
          };
        }
        
        // Increment the capture count for the player who made the capture
        // game.currentTurn is the color that just moved and made the capture
        game.captures[game.currentTurn][captured] = (game.captures[game.currentTurn][captured] || 0) + 1;
      }
    
      console.log("from", from);
      console.log("to", to);
      game.compactHistory += from + to;
    
      // Add promotion piece if there is one
      if (promotion) {
        game.compactHistory += promotion.toUpperCase();
      }
    
      // Switch turns
      game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';
    
      // Broadcast move to room with current capture state
      console.log("emitting move event");
      io.in(roomId).emit('move', {
        from,
        to,
        color: game.currentTurn === 'w' ? 'b' : 'w',
        whoseTurn: game.currentTurn,
        promotion,
        history: game.compactHistory,
        captures: game.captures // Send the current capture state
      });
    });

    socket.on("disconnect", () => {
      // Remove from waiting lists
      Object.values(waitingPlayers).forEach(modes => {
        Object.values(modes).forEach(tier => {
          const index = tier.indexOf(socket.walletAddress);
          if (index !== -1) {
            tier.splice(index, 1);
          }
        });
      });

      // Handle active games
      games.forEach((game, roomId) => {
        if (Object.values(game.playerColors).includes(socket.walletAddress)) {
          const winner = game.playerColors.w === socket.walletAddress ?
            game.playerColors.b : game.playerColors.w;

          io.to(roomId).emit('game_ended', {
            reason: 'disconnection',
            winner
          });

          games.delete(roomId);
        }
      });

      walletToSocket.delete(socket.walletAddress);
    });

    // Game end conditions
    socket.on("game_end", ({ roomId, result, winner }) => {

      console.log("game_end event received from client")
      const game = games.get(roomId);
      if (!game) return;

      game.gameStatus = "ending";
      game.winner = winner;

      console.log("Compact game history:", game.compactHistory);
      console.log("emitting game_ending from server")


      io.to(roomId).emit('game_ending', {
        result,
        winner,
        finalMove: game.moves[game.moves.length - 1],
        compactHistory:game.compactHistory
      });


      //gonna implement ranked rating adjustment logic here soon along with any wagers etc too.
      console.log("ye dekh wager: ", game.wager)
      console.log("ye dekh winner: ", game.winner)

      console.log("ye dekh poora game data:", game)
      // Clean up the game
      
    });

    // Resign handler
    socket.on("resign", ({ roomId, walletAddress }) => {
      const game = games.get(roomId);
      if (!game) return;

      const winner = walletAddress === game.playerColors.w ?
        game.playerColors.b : game.playerColors.w;

      io.to(roomId).emit('game_ended', {
        result: 'resignation',
        winner
      });

      games.delete(roomId);
    });
  });

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});