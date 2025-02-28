'use client';
import { useEffect, useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { socket } from '@/lib/socket';
import { useParams, usePathname } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';

export default function GamePage() {
  const [game, setGame] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [message, setMessage] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const { signMessageAsync } = useSignMessage()

  // Remove state for promotionPiece and use a ref instead
  const promotionPieceRef = useRef('q');

  const params = useParams();
  const gameId = params.id as string;
  const pathname = usePathname();
  const { address } = useAccount();

  // 1) Load game data from server
  useEffect(() => {
    if (!gameId || !address) return;

    socket.emit('get_game_data', {
      roomId: gameId,
      walletAddress: address,
    });

    socket.on('game_data', (data) => {
      setGameData(data);
      setMessage(data.message);

      console.log("game_data received: ")
      console.log(data)

      // Check if game is in signing state
      if (data.game.gameStatus === 'signing_start') {
        console.log("state rn is signing start")
        setIsSigning(true);
      } else {
        setIsSigning(false);
        
        // If game is already in started state, initialize the board
        if (data.game.gameStatus === 'started') {
          // Apply any existing moves
          if (data.game.moves && data.game.moves.length > 0) {
            const newGame = new Chess();
            data.game.moves.forEach((move: any) => {
              try {
                newGame.move({
                  from: move.from,
                  to: move.to,
                  promotion: move.promotion,
                });
              } catch (error) {
                console.error('Error applying move:', error);
              }
            });
            setGame(newGame);
          } else {
            // No moves yet, just use a fresh board
            setGame(new Chess());
          }
        }
      }

      // Determine if you're white or black
      const isWhite = data.game.playerColors.w === address;
      setPlayerColor(isWhite ? 'w' : 'b');

      // Set whose turn it is (only if game has started)
      if (data.game.gameStatus === 'started') {
        setIsMyTurn(data.game.currentTurn === (isWhite ? 'w' : 'b'));
      } else {
        setIsMyTurn(false); // No moves allowed during signing
      }
    });
    socket.on('game_started', (data) => {
      console.log('Game started data', data);
      
      // Update the game data locally
      setGameData((currentGameData) => {
        if (!currentGameData) return null;
        
        return {
          ...currentGameData,
          game: {
            ...currentGameData.game,
            gameStatus: 'started'
          }
        };
      });
      
      // Game is no longer in signing state
      setIsSigning(false);
      
      // Initialize with a fresh chess board
      setGame(new Chess());
      
      // Update turn status - white always starts in chess
      const isWhite = data?.playerColors?.w === address;
      
      setPlayerColor(isWhite ? 'w' : 'b');
      setIsMyTurn(isWhite); // If you're white, it's your turn
      
      console.log("Game started, board reset to initial position");
    });

    return () => {
      socket.off('game_data');
      socket.off('game_started');

    };
  }, [gameId, address]);


  // 2) Handle moves coming from the opponent
  useEffect(() => {
    if (!gameId) return;

    socket.on('move', ({ from, to, promotion, whoseTurn, color }) => {
      console.log('Received move:', { from, to, promotion, whoseTurn, color });

      // Only apply the move if it's from the opponent
      if (color !== playerColor) {
        setGame((currentGame) => {
          const newGame = new Chess(currentGame.fen());
          try {
            newGame.move({ from, to, promotion });
            return newGame;
          } catch (error) {
            console.error('Invalid move received:', error);
            return currentGame;
          }
        });
      }

      // Update local "turn" state (only if not in signing state)
      if (!isSigning) {
        setIsMyTurn(whoseTurn === playerColor);
      }
    });

    return () => {
      socket.off('move');
    };
  }, [gameId, playerColor, isSigning]);

  // 3) The function that actually executes a move in Chess.js
  function completeMove(from: string, to: string) {
    // Prevent moves during signing state
    if (isSigning || !isMyTurn) return false;

    const promotion = promotionPieceRef.current;
    try {
      const move = game.move({
        from,
        to,
        promotion,
      });

      if (move) {
        // Update board locally
        setGame(new Chess(game.fen()));

        // It's now opponent's turn
        setIsMyTurn(false);

        // Send move to server
        socket.emit('make_move', {
          roomId: gameId,
          walletAddress: address,
          from,
          to,
          piece: move.piece,
          promotion,
        });

        return true;
      }
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
    return false;
  }

  // 4) The onDrop handler (no custom popups)
  function onDrop(sourceSquare: string, targetSquare: string) {
    // Prevent moves during signing state
    if (isSigning || !isMyTurn) return false;
    return completeMove(sourceSquare, targetSquare);
  }

  // 5) Check for game end (checkmate, draw, etc.)
  useEffect(() => {
    if (game.isGameOver() && !isSigning) {
      let result = 'draw';
      let winner = null;

      if (game.isCheckmate()) {
        result = 'checkmate';
        // In Chess.js, if it's checkmate and it's white's turn, black has won
        winner = game.turn() === 'w' ? 'b' : 'w';
      } else if (game.isDraw()) {
        if (game.isStalemate()) result = 'stalemate';
        else if (game.isThreefoldRepetition()) result = 'repetition';
        else if (game.isInsufficientMaterial()) result = 'insufficient';
        else result = 'fifty-move-rule';
      }

      socket.emit('game_end', {
        roomId: gameId,
        result,
        winner: winner
          ? winner === 'w'
            //@ts-ignore
            ? gameData?.game.playerColors.w
            //@ts-ignore
            : gameData?.game.playerColors.b
          : null,
      });
    }
  }, [game, gameId, gameData, isSigning]);
  
  // Log the current FEN for debugging
  useEffect(() => {
    console.log("Current FEN:", game.fen());
  }, [game]);

  return (
    <div className="container mx-auto p-4 mt-[75px]">
      <div className="max-w-3xl mx-auto">
        {gameData ? (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold">
                {gameData.game.mode.charAt(0).toUpperCase() + gameData.game.mode.slice(1)} Game
              </h1>
              <p>Tier: {gameData.game.tier}</p>
              {gameData.game.mode === 'ranked' && <p>Wager: {gameData.game.wager}</p>}
            </div>

            {isSigning ? (
              <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-4">
                <h2 className="font-bold text-lg mb-2">Please sign the message to start the game</h2>
                <div className="bg-gray-100 p-2 rounded mb-4 font-mono text-sm overflow-auto">
                  {message}
                </div>
                <button 
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={async() => {
                    try {
                      const signature = await signMessageAsync({ message:message })
                      console.log('Signature:', signature)
                      socket.emit("sign", {roomId:gameId, signature:signature, address})
                    } catch (error) {
                      console.error('Error signing message:', error)
                    }
                  }}
                >
                  Sign Message
                </button>
              </div>
            ) : null}

            <div className="aspect-square">
              <Chessboard
                position={game.fen()}
                onPieceDrop={onDrop}
                onPromotionPieceSelect={(piece) => {
                  console.log("Selected promotion piece:", piece);
                  // Convert "wN" or "bB" to "n" or "b"
                  const validPiece = piece.slice(1).toLowerCase();
                  promotionPieceRef.current = validPiece;
                  return validPiece; // Return the transformed piece
                }}
                boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                areArrowsAllowed={true}
                isDraggablePiece={({ piece }) => {
                  console.log("Piece check:", { 
                    piece, 
                    pieceColor: piece.charAt(0), 
                    playerColor, 
                    isMyTurn, 
                    isSigning 
                  });
                  return !isSigning && isMyTurn;
                }}              />
            </div>

            <div className="mt-4">
              {game.isGameOver() && !isSigning ? (
                <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg">
                  <h2 className="text-xl font-bold mb-2">Game Over!</h2>
                  {game.isCheckmate() ? (
                    <p className="text-lg">
                      Checkmate! {game.turn() === 'w' ? 'Black' : 'White'} wins!
                    </p>
                  ) : game.isDraw() ? (
                    <p className="text-lg">
                      Draw:{' '}
                      {game.isStalemate()
                        ? 'Stalemate'
                        : game.isThreefoldRepetition()
                          ? 'Threefold Repetition'
                          : game.isInsufficientMaterial()
                            ? 'Insufficient Material'
                            : 'Fifty-move Rule'}
                    </p>
                  ) : (
                    <p className="text-lg">Game ended</p>
                  )}
                </div>
              ) : isSigning ? (
                <p>Status: Waiting for signatures</p>
              ) : (
                <p>Status: {isMyTurn ? 'Your turn' : "Opponent's turn"}</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-96">
            <p>Loading game...</p>
          </div>
        )}
      </div>
    </div>
  );
}