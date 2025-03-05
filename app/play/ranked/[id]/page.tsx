'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [hasSigned, setHasSigned] = useState(false);
  const { signMessageAsync } = useSignMessage()
  const [isEndingSigning, setIsEndingSigning] = useState(false);
  const [hasSignedEnding, setHasSignedEnding] = useState(false);
  const [gameHistory, setGameHistory] = useState('');
  const [isGameCompletelyOver, setIsGameCompletelyOver] = useState(false);


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
      if (data.gameStatus === 'signing_start') {
        console.log("state rn is signing start")
        setIsSigning(true);
      } else {
        setIsSigning(false);

      }

      // Determine if you're white or black
      const isWhite = data.playerColors.w === address;
      setPlayerColor(isWhite ? 'w' : 'b');

    });
    socket.on('game_ended', (data) => {
      console.log('Game has officially ended:', data);
      setIsGameCompletelyOver(true);
      setIsEndingSigning(false);
      setHasSignedEnding(false);
    });

    socket.on('game_ending', (data) => {
      console.log('Game ending received:', data);
      // Set the game history for signing
      if (data.compactHistory) {
        console.log(data.compactHistory)
        setGameHistory(data.compactHistory);
        setIsEndingSigning(true);
      }
    });

    return () => {
      socket.off('game_data');
      socket.off('game_ending');
      socket.off('game_ended')
    };
  }, [gameId, address]);

  // NEW: Listen for game started event
  useEffect(() => {
    socket.on('game_started', (data) => {
      console.log('Game started:', data);

      // FORCE a completely new object to ensure React detects change
      setGameData({ ...data });

      // Game is no longer in signing state
      setIsSigning(false);
      setHasSigned(false);

      // Initialize with a fresh chess board
      setGame(new Chess());

      // Update turn status - white always starts in chess
      const isWhite = data?.playerColors?.w === address;
      setPlayerColor(isWhite ? 'w' : 'b');
      setIsMyTurn(isWhite);
    });

    return () => {
      socket.off('game_started');
    };
  }, [address]);

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
            ? gameData?.playerColors.w
            //@ts-ignore
            : gameData?.playerColors.b
          : null,
      });
    }
  }, [game, gameId, gameData, isSigning]);

  // Log the current FEN for debugging
  useEffect(() => {
    console.log("Current FEN:", game.fen());
  }, [game]);

  return (
    <div className="text-white mx-auto p-4 mt-[75px] min-h-screen w-full bg-[#594205]">
      <div className="max-w-3xl mx-auto">
        {isGameCompletelyOver ? (
          <div className="text-center p-8 bg-gradient-to-b from-[#906810] to-[#744D0B] text-white rounded-lg shadow-xl border-2 border-[#B88A24]">
            <h1 className="text-4xl font-bold mb-6">Game Over</h1>
            <p className="text-xl mb-8">Thanks for playing!</p>
            <button
              onClick={() => window.location.href = '/modes'}
              className="bg-[#3B2A0A] text-white font-bold py-3 px-6 rounded-md hover:bg-[#594205] transition-colors border border-[#B88A24]"
            >
              Back to Game Modes
            </button>
          </div>
        ) : gameData ? (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold">
                {/* @ts-ignore */}
                    Ranked Game
              </h1>
              {/* @ts-ignore */}
              <p>Tier: {gameData.tier}</p>
              {/* @ts-ignore */}
              {gameData.mode === 'ranked' && <p>Wager: {gameData.wager}</p>}
            </div>

            {isSigning ? (
              <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-4">
                {hasSigned ? (
                  <h2 className="font-bold text-lg mb-2">Waiting for opponent to sign...</h2>
                ) : (
                  <>
                    <h2 className="font-bold text-lg mb-2">Please sign the message to start the game</h2>
                    <div className="bg-gray-100 p-2 rounded mb-4 font-mono text-sm overflow-auto">
                      {message}
                    </div>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={async () => {
                        try {
                          const signature = await signMessageAsync({ message: message })
                          console.log('Signature:', signature)
                          socket.emit("sign_start", { roomId: gameId, signature: signature, address })
                          setHasSigned(true)
                        } catch (error) {
                          console.error('Error signing message:', error)
                        }
                      }}
                    >
                      Sign Message
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {/* Add this after the isSigning section but before the chessboard */}
            {isEndingSigning ? (
              <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-4">
                {hasSignedEnding ? (
                  <h2 className="font-bold text-lg mb-2">Waiting for opponent to sign game ending...</h2>
                ) : (
                  <>
                    <h2 className="font-bold text-lg mb-2">Please sign to confirm game results</h2>
                    <div className="bg-gray-100 p-2 rounded mb-4 font-mono text-sm overflow-auto">
                      Game History is:
                      <br />
                      {gameHistory}
                    </div>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={async () => {
                        try {
                          const signingMessage = `Game History is:\n${gameHistory}`;
                          const signature = await signMessageAsync({ message: signingMessage });
                          console.log('End Signature:', signature);

                          // Emit the sign_end event with required data
                          socket.emit("sign_end", {
                            roomId: gameId,
                            signature: signature,
                            address
                          });

                          setHasSignedEnding(true);
                        } catch (error) {
                          console.error('Error signing end message:', error);
                        }
                      }}
                    >
                      Sign Game Results
                    </button>
                  </>
                )}
              </div>
            ) : null}

            <div className="aspect-square">
              <Chessboard
                position={game.fen()}
                onPieceDrop={onDrop}
                // @ts-ignore
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