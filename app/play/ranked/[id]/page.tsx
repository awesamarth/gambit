'use client';
import { useEffect, useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { socket } from '@/lib/socket';
import { useParams, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function GamePage() {
  const [game, setGame] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameData, setGameData] = useState(null);
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

      // Apply all existing moves to a fresh Chess instance
      if (data.moves && data.moves.length > 0) {
        const newGame = new Chess();
        data.moves.forEach((move: any) => {
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
      }

      // Determine if you're white or black
      const isWhite = data.playerColors.w === address;
      setPlayerColor(isWhite ? 'w' : 'b');

      // Set whose turn it is
      setIsMyTurn(data.currentTurn === (isWhite ? 'w' : 'b'));
    });

    return () => {
      socket.off('game_data');
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

      // Update local "turn" state
      setIsMyTurn(whoseTurn === playerColor);
    });

    return () => {
      socket.off('move');
    };
  }, [gameId, playerColor]);

  // 3) The function that actually executes a move in Chess.js
  function completeMove(from: string, to: string) {
    if (!isMyTurn) return false;

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
    if (!isMyTurn) return false;
    return completeMove(sourceSquare, targetSquare);
  }

  // 5) Check for game end (checkmate, draw, etc.)
  useEffect(() => {
    if (game.isGameOver()) {
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
            ? gameData?.playerColors.w
            //@ts-ignore
            : gameData?.playerColors.b
          : null,
      });
    }
  }, [game, gameId, gameData]);

  return (
    <div className="container mx-auto p-4 mt-[75px]">
      <div className="max-w-3xl mx-auto">
        {gameData ? (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold">
                {/* @ts-ignore */}
                {gameData.mode.charAt(0).toUpperCase() + gameData.mode.slice(1)} Game
              </h1>
              {/* @ts-ignore */}
              <p>Tier: {gameData.tier}</p>
              {/* @ts-ignore */}
              {gameData.mode === 'ranked' && <p>Wager: {gameData.wager}</p>}
            </div>

            <div className="aspect-square">
              <Chessboard
                position={game.fen()}
                onPieceDrop={onDrop}
                //@ts-ignore
                onPromotionPieceSelect={(piece) => {
                    console.log("Selected promotion piece:", piece);
                    // Convert "wN" or "bB" to "n" or "b"
                    //@ts-ignore
                    const validPiece = piece.slice(1).toLowerCase();
                    promotionPieceRef.current = validPiece;
                    return validPiece; // Return the transformed piece
                  }}
                boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                areArrowsAllowed={true}
              />
            </div>

            <div className="mt-4">
              {game.isGameOver() ? (
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
