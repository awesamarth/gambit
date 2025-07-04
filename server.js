import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { http, publicActions, verifyMessage } from "viem";
import { createWalletClient, createPublicClient } from "viem";
import { foundry, scrollSepolia, riseTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import * as dotenv from 'dotenv'
dotenv.config({path:'.env.local'})

const GAMBIT_ABI=[
  {
      "type": "constructor",
      "inputs": [
          {
              "name": "_tokenAddress",
              "type": "address",
              "internalType": "address"
          }
      ],
      "stateMutability": "nonpayable"
  },
  {
      "type": "function",
      "name": "addressToPlayer",
      "inputs": [
          {
              "name": "",
              "type": "address",
              "internalType": "address"
          }
      ],
      "outputs": [
          {
              "name": "username",
              "type": "string",
              "internalType": "string"
          },
          {
              "name": "playerAddress",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "rating",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "gambitToken",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "address",
              "internalType": "contract IGambitToken"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "getFullPlayerData",
      "inputs": [
          {
              "name": "_playerAddress",
              "type": "address",
              "internalType": "address"
          }
      ],
      "outputs": [
          {
              "name": "username",
              "type": "string",
              "internalType": "string"
          },
          {
              "name": "playerAddress",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "rating",
              "type": "uint256",
              "internalType": "uint256"
          },
          {
              "name": "matchIds",
              "type": "uint256[]",
              "internalType": "uint256[]"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "getMatchesByPlayer",
      "inputs": [
          {
              "name": "_playerAddress",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "_limit",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "outputs": [
          {
              "name": "",
              "type": "tuple[]",
              "internalType": "struct Gambit.Match[]",
              "components": [
                  {
                      "name": "matchId",
                      "type": "uint256",
                      "internalType": "uint256"
                  },
                  {
                      "name": "playerAddresses",
                      "type": "address[]",
                      "internalType": "address[]"
                  },
                  {
                      "name": "startSignatures",
                      "type": "string[]",
                      "internalType": "string[]"
                  },
                  {
                      "name": "moveHistory",
                      "type": "string",
                      "internalType": "string"
                  },
                  {
                      "name": "winnerAddress",
                      "type": "address",
                      "internalType": "address"
                  },
                  {
                      "name": "stakeAmount",
                      "type": "uint256",
                      "internalType": "uint256"
                  },
                  {
                      "name": "isSettled",
                      "type": "bool",
                      "internalType": "bool"
                  }
              ]
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "isUsernameTaken",
      "inputs": [
          {
              "name": "",
              "type": "string",
              "internalType": "string"
          }
      ],
      "outputs": [
          {
              "name": "",
              "type": "bool",
              "internalType": "bool"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "matchIdToMatch",
      "inputs": [
          {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
          }
      ],
      "outputs": [
          {
              "name": "matchId",
              "type": "uint256",
              "internalType": "uint256"
          },
          {
              "name": "moveHistory",
              "type": "string",
              "internalType": "string"
          },
          {
              "name": "winnerAddress",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "stakeAmount",
              "type": "uint256",
              "internalType": "uint256"
          },
          {
              "name": "isSettled",
              "type": "bool",
              "internalType": "bool"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "address",
              "internalType": "address"
          }
      ],
      "stateMutability": "view"
  },
  {
      "type": "function",
      "name": "registerPlayer",
      "inputs": [
          {
              "name": "_username",
              "type": "string",
              "internalType": "string"
          }
      ],
      "outputs": [],
      "stateMutability": "payable"
  },
  {
      "type": "function",
      "name": "settleMatch",
      "inputs": [
          {
              "name": "_matchId",
              "type": "uint256",
              "internalType": "uint256"
          },
          {
              "name": "_moveHistory",
              "type": "string",
              "internalType": "string"
          },
          {
              "name": "_ranked",
              "type": "bool",
              "internalType": "bool"
          },
          {
              "name": "_player1",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "_player2",
              "type": "address",
              "internalType": "address"
          },
          {
              "name": "_startSignature1",
              "type": "string",
              "internalType": "string"
          },
          {
              "name": "_startSignature2",
              "type": "string",
              "internalType": "string"
          },
          {
              "name": "_stakeAmount",
              "type": "uint256",
              "internalType": "uint256"
          },
          {
              "name": "_winnerAddress",
              "type": "address",
              "internalType": "address"
          }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
  },
  {
      "type": "function",
      "name": "updateTokenContract",
      "inputs": [
          {
              "name": "_newTokenAddress",
              "type": "address",
              "internalType": "address"
          }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
  },
  {
      "type": "error",
      "name": "AlreadyRegistered",
      "inputs": []
  },
  {
      "type": "error",
      "name": "InsufficientEther",
      "inputs": []
  },
  {
      "type": "error",
      "name": "UsernameAlreadyTaken",
      "inputs": []
  }
]
const GAMBIT_ADDRESS="0x8243c5735a9cf61ef356a8a11cfa42f87573ac5f"

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const account = privateKeyToAccount(process.env.PRIVATE_KEY)

const walletClient  = createWalletClient({
  account:account,
  chain: scrollSepolia,
  transport: http("https://scroll-sepolia.chainstacklabs.com"),
  
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
          captures: {
            w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
            b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
          },
          formattedMoves:[],
          currentTurn: 'w',
          gameStatus: 'signing_start',
          winner: "",
          start_sigs: [],
          end_sigs: [],
          message: message 
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
    socket.on("create_room", ({ walletAddress, tier, wager, isChallenge, username }) => {
      console.log("create room received")
      socket.walletAddress = walletAddress;
      socket.username=username;

      const roomId = Date.now().toString();
      const roomData = {
        roomId,
        mode: "unranked",
        tier,
        wager: wager,
        playerColors: {
          'w': walletAddress,
          'b': ""
        },
        playerUsernames: {
          'w': username || "Player 1",
          'b': ""
        },
        captures: {
          w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
          b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
        },
        formattedMoves:[],
        currentTurn: 'w',
        gameStatus: 'waiting',
        winner: "",
        start_sigs: [],
        end_sigs: [],
        message: "" // Store the message in the game object
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

    socket.on("join_room", ({ walletAddress, roomId, username }) => {
      console.log("join room received from client")
      const game = games.get(roomId);

      if (!game) return;

      const currentTime = new Date().toUTCString();
      
      
      
      game.playerColors.b = walletAddress;
      game.gameStatus= "signing_start"
      game.playerColors['b']=walletAddress
      game.playerUsernames['b']= username || "Player 2"
      const message = `${game.playerUsernames['w']} vs ${game.playerUsernames['b']} | ${game.tier} | ${currentTime}`;
      game.message=message
      console.log("game is here ", game)
      socket.join(roomId); 
      io.to(roomId).emit('match_found', game);
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
        message: `Game History is:\n${game.formattedMoves.join('')}`,
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
        console.log("game status while ending is: ")
        console.log(game)
        const ranked = game.mode==="ranked"?true:false
        const { request } = await walletClient.simulateContract({
          address: GAMBIT_ADDRESS,
          abi: GAMBIT_ABI,
          functionName: 'settleMatch',
          args:[
            Number(game.roomId), game.formattedMoves.join(''), ranked, game.playerColors['w'], game.playerColors['b'], 
            game.start_sigs[0], game.start_sigs[1], game.wager, game.winner]
        })

        const result = await walletClient.writeContract(request)
        console.log("ye dekh result")
        console.log(result)

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

    socket.on("make_move", ({ roomId, walletAddress, from, to, piece, promotion, captured, sanNotation }) => {
      console.log("make move received from client");

      console.log("here's captured")
      console.log(captured)
      
      const game = games.get(roomId);
      if (!game) {
        console.log("no game");
        return;
      }
    
      // Update game state - store the complete move details

      
      
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
    
      console.log("to", to);
      


      // if (piece !== 'p') {
      //   // Non-pawn piece - add the piece letter
      //   game.compactHistory += piece.toUpperCase() + to;
      // } else {
      //   // Pawn - just add destination
      //   game.compactHistory += to;
      // }
      
    
      // Add promotion piece if there is one
      // if (promotion) {
      //   game.compactHistory += promotion.toUpperCase();
      // }
    
      // Switch turns
      game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';
      game.formattedMoves.push(sanNotation);
    
      // Broadcast move to room with current capture state
      console.log("emitting move event");
      io.in(roomId).emit('move', {
        from,
        to,
        color: game.currentTurn === 'w' ? 'b' : 'w',
        whoseTurn: game.currentTurn,
        promotion,
        // history: game.compactHistory,
        captures: game.captures,
        formattedMoves:game.formattedMoves
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

      console.log("emitting game_ending from server")


      io.to(roomId).emit('game_ending', {
        result,
        winner,
        history: game.formattedMoves ? game.formattedMoves.join('') : ''
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