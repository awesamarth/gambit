import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

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


    socket.on("join_lobby", ({ walletAddress, tier, rankedOrUnranked }) => {
      console.log("join lobby received")
      console.log("Join lobby request:", { walletAddress, tier, rankedOrUnranked });

      socket.walletAddress = walletAddress;
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
          moves: [],
          compactHistory:"",
          currentTurn: 'w',
          gameStatus: 'started',
          winner: ""
        });

        // Join players to game room
        const player1Socket = walletToSocket.get(player1);
        const player2Socket = walletToSocket.get(player2);

        if (player1Socket && player2Socket) {

          console.log("match found")
          player1Socket.join(roomId);
          player2Socket.join(roomId);
          io.to(roomId).emit('match_found', games.get(roomId));
        }
      }
    });

    socket.on("get_game_data", ({ roomId, walletAddress }) => {
      console.log("room id idhar hai", roomId)
      console.log("saare games idhar hain", games)
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
      socket.emit('game_data', game);
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
    socket.on("create_room", ({ walletAddress, tier, wager, isChallenge }) => {
      console.log("create  room received")
      socket.walletAddress = walletAddress;
      walletToSocket.set(walletAddress, socket);

      const roomId = Date.now().toString();
      const roomData = {
        roomId,
        mode: "unranked",
        tier,
        wager,
        playerColors: {
          'w': walletAddress,
          'b': ""
        },
        moves: [],
        compactHistory:"",
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

    socket.on("make_move", ({ roomId, walletAddress, from, to, piece, promotion }) => {

      console.log("make move received from client")
      // console.log("games are: ", games)
      // console.log("roomId received:", roomId);  // Add this

      const game = games.get(roomId);
      if (!game) {
        console.log("no game")
        return
      };


      // Update game state
      game.moves.push({
        from,
        to,
        color: game.currentTurn,
        player: walletAddress,
        piece,
        promotion
      });

      console.log("from", from)
      console.log("to", to)
      game.compactHistory += from + to;
  
      // Add promotion piece if there is one
      if (promotion) {
        game.compactHistory += promotion.toUpperCase();
      }

      // Switch turns
      game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';


      // Broadcast move to room
      io.in(roomId).emit('move', {
        from,
        to,
        color: game.currentTurn === 'w' ? 'b' : 'w',
        whoseTurn: game.currentTurn,
        promotion
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

      game.gameStatus = "ended";
      game.winner = winner;

      console.log("Compact game history:", game.compactHistory);


      io.to(roomId).emit('game_ended', {
        result,
        winner,
        finalMove: game.moves[game.moves.length - 1]
      });


      //gonna implement ranked rating adjustment logic here soon along with any wagers etc too.
      // Clean up the game
      games.delete(roomId);
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