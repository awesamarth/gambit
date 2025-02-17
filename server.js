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
      const game = games.get(roomId);
      if (!game) return;

      
      // Update black player's wallet address
      game.playerColors.b = walletAddress;
      console.log(game)

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
        const roomId = `${rankedOrUnranked}_${tier}_${Date.now()}`;

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
          currentTurn: 'w',
          gameStatus: 'started',
          winner: ""
        });

        // Join players to game room
        const player1Socket = walletToSocket.get(player1);
        const player2Socket = walletToSocket.get(player2);

        if (player1Socket && player2Socket) {
          player1Socket.join(roomId);
          player2Socket.join(roomId);
          io.to(roomId).emit('match_found', games.get(roomId));
        }
      }
    });

    socket.on("create_room", ({ walletAddress, tier, wager, isChallenge }) => {
      socket.walletAddress = walletAddress;
      walletToSocket.set(walletAddress, socket);

      const roomId = `${isChallenge ? 'challenge' : 'private'}_${tier}_${Date.now()}`
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
        currentTurn: 'w',
        gameStatus: 'waiting',
        winner: ""
      };

      // Store in appropriate map(s)
      games.set(roomId, roomData);
      socket.join(roomId);

      if (isChallenge) {
        challenges.set(roomId, roomData);
        // Broadcast to all clients
        io.emit('challenge_created', { roomId, tier, wager });
      } else {
        // Only tell the creator
        socket.emit('private_room_created', { roomId });
      }

    });

    socket.on("make_move", ({ roomId, walletAddress, from, to, piece, promotion }) => {

      console.log("make move received from client")
      console.log("games are: ", games)
      console.log("roomId received:", roomId);  // Add this

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

      // Switch turns
      game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';

      console.log("game is currently: ", game)

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
      const game = games.get(roomId);
      if (!game) return;

      game.gameStatus = "ended";
      game.winner = winner;

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