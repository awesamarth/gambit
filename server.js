const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Data structures
  const games = new Map();
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

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_lobby', ({ walletAddress, tier, rankedOrUnranked }) => {
      console.log('Join lobby request:', { walletAddress, tier, rankedOrUnranked });
      
      socket.walletAddress = walletAddress;
      walletToSocket.set(walletAddress, socket);

      const waitingList = waitingPlayers[rankedOrUnranked][tier];
      
      // Don't add if already in queue
      if (!waitingList.includes(walletAddress)) {
        waitingList.push(walletAddress);
      }

      console.log('Current waiting list:', waitingList);

      // Match players if enough are waiting
      if (waitingList.length >= 2) {
        const player1 = waitingList.shift();
        const player2 = waitingList.shift();
        const gameId = `${rankedOrUnranked}_${tier}_${Date.now()}`;

        console.log('Creating game:', { gameId, player1, player2 });

        // Create game
        games.set(gameId, {
          id: gameId,
          mode: rankedOrUnranked,
          tier,
          wager: rankedOrUnranked === 'ranked' ? rankedWagers[tier] : 0,
          playerColors: {
            'w': player1,
            'b': player2
          },
          moves: [],
          currentTurn: 'w',
          gameStatus: 'started'
        });

        // Join players to game room
        const player1Socket = walletToSocket.get(player1);
        const player2Socket = walletToSocket.get(player2);

        if (player1Socket && player2Socket) {
          player1Socket.join(gameId);
          player2Socket.join(gameId);
          io.to(gameId).emit('match_found', games.get(gameId));
        }
      }
    });

    socket.on('make_move', ({ roomId, walletAddress, from, to }) => {
      console.log('Move request:', { roomId, walletAddress, from, to });
      
      const game = games.get(roomId);
      if (!game) {
        console.log('Game not found:', roomId);
        return;
      }

      // Validate it's the player's turn
      if (walletAddress !== game.playerColors[game.currentTurn]) {
        console.log('Not player\'s turn');
        socket.emit('invalid_move', { message: 'Not your turn' });
        return;
      }

      // Update game state
      game.moves.push({ from, to, color: game.currentTurn });
      game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';

      // Broadcast move to both players
      io.to(roomId).emit('move_made', {
        from,
        to,
        color: game.currentTurn === 'w' ? 'b' : 'w',
        whoseTurn: game.currentTurn,
        nextPlayer: game.playerColors[game.currentTurn]
      });
    });

    socket.on('game_end', ({ roomId, result, winner }) => {
      console.log('Game end:', { roomId, result, winner });
      
      const game = games.get(roomId);
      if (!game) return;

      game.gameStatus = 'ended';
      game.winner = winner;

      io.to(roomId).emit('game_ended', {
        result,
        winner,
        finalMove: game.moves[game.moves.length - 1]
      });

      // Clean up
      games.delete(roomId);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
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
      games.forEach((game, gameId) => {
        if (Object.values(game.playerColors).includes(socket.walletAddress)) {
          const winner = game.playerColors.w === socket.walletAddress ? 
            game.playerColors.b : game.playerColors.w;

          io.to(gameId).emit('game_ended', {
            result: 'disconnection',
            winner
          });

          games.delete(gameId);
        }
      });

      walletToSocket.delete(socket.walletAddress);
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});