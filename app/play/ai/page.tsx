'use client';
import { useEffect, useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useSearchParams } from 'next/navigation';
// @ts-ignore
import { Game } from 'js-chess-engine';

export default function AIGamePage() {
  const [game, setGame] = useState(new Chess());
  const playerColor = 'w'; // AI is always black
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [formattedMoves, setFormattedMoves] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState({
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  });
  const [isGameCompletelyOver, setIsGameCompletelyOver] = useState(false);
  const promotionPieceRef = useRef('');
  
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'easy';

  // Initialize game
  useEffect(() => {
    const newGame = new Chess();
    setGame(newGame);
    setIsMyTurn(true);
    setFormattedMoves([]);
    setCapturedPieces({
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    });
  }, []);

  // Update captured pieces helper
  const updateCapturedPieces = (moveDetails: any) => {
    if (moveDetails.captured) {
      const color = moveDetails.color as 'w' | 'b';
      const piece = moveDetails.captured as 'p' | 'n' | 'b' | 'r' | 'q';
      setCapturedPieces(prev => ({
        ...prev,
        [color]: {
          ...prev[color],
          [piece]: prev[color][piece] + 1
        }
      }));
    }
  };

  // Update move history helper
  const updateMoveHistory = (moveDetails: any) => {
    setFormattedMoves(prev => [...prev, moveDetails.san]);
  };

  // Execute a move in Chess.js
  function completeMove(from: string, to: string) {
    if (!isMyTurn) return false;

    const promotion = promotionPieceRef.current;
    try {
      const moveDetails = game.move({
        from,
        to,
        promotion,
      });

      if (moveDetails) {
        // Update board locally
        const newGame = new Chess(game.fen());
        setGame(newGame);
        setIsMyTurn(false);

        // Update captured pieces
        updateCapturedPieces(moveDetails);
        
        // Update move history
        updateMoveHistory(moveDetails);

        // TODO: Trigger AI move after player move
        setTimeout(() => {
          makeAIMove(newGame);
        }, 500);

        return true;
      }
    } catch (error) {
      console.error('Error making move:', error);
    }
    return false;
  }

  // Get AI difficulty level
  const getAILevel = () => {
    switch (difficulty) {
      case 'easy': return 0;
      case 'medium': return 1;
      case 'hard': return 2;
      default: return 0;
    }
  };

  // AI move function
  const makeAIMove = (currentGame: any) => {
    if (currentGame.isGameOver()) return;

    try {
      // Create js-chess-engine game from current position
      const aiGame = new Game(currentGame.fen());
      
      // Get AI move with difficulty level
      const aiMove = aiGame.aiMove(getAILevel());
      
      if (aiMove) {
        // Convert js-chess-engine move format to chess.js format
        const moveKey = Object.keys(aiMove)[0];
        const moveValue = aiMove[moveKey];
        
        // Parse the move (e.g., "e2" -> "e4")
        const from = moveKey;
        const to = moveValue;
        
        // Apply the move to our chess.js game
        const moveDetails = currentGame.move({ from, to });
        if (moveDetails) {
          setGame(new Chess(currentGame.fen()));
          updateCapturedPieces(moveDetails);
          updateMoveHistory(moveDetails);
          setIsMyTurn(true);
        }
      }
    } catch (error) {
      console.error('Error making AI move:', error);
      // Fallback to random move if AI fails
      const moves = currentGame.moves();
      if (moves.length > 0) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        const moveDetails = currentGame.move(randomMove);
        if (moveDetails) {
          setGame(new Chess(currentGame.fen()));
          updateCapturedPieces(moveDetails);
          updateMoveHistory(moveDetails);
          setIsMyTurn(true);
        }
      }
    }
  };

  // The onDrop handler
  function onDrop(sourceSquare: string, targetSquare: string) {
    if (!isMyTurn) return false;
    return completeMove(sourceSquare, targetSquare);
  }

  // Check for game end
  useEffect(() => {
    if (game.isGameOver()) {
      setIsGameCompletelyOver(true);
    }
  }, [game]);

  // Function to get piece symbol for display
  function getPieceSymbol(piece: string) {
    const symbols: Record<string, string> = {
      p: '♟',
      n: '♞',
      b: '♝',
      r: '♜',
      q: '♛',
    };
    return symbols[piece] || '';
  }

  // Get difficulty display info
  const getDifficultyInfo = () => {
    const info = {
      easy: { name: 'Easy', color: 'text-green-400' },
      medium: { name: 'Medium', color: 'text-yellow-400' },
      hard: { name: 'Hard', color: 'text-red-400' }
    };
    return info[difficulty as keyof typeof info] || info.easy;
  };

  const difficultyInfo = getDifficultyInfo();

  return (
    <div className="text-white mx-auto p-4 mt-[75px] min-h-screen w-full bg-[#594205]">
      <div className="max-w-5xl mx-auto">
        {isGameCompletelyOver ? (
          <div className="text-center p-8 bg-gradient-to-b from-[#906810] to-[#744D0B] text-white rounded-lg shadow-xl border-2 border-[#B88A24]">
            <h1 className="text-4xl font-bold mb-6">Game Over</h1>
            <div className="mb-6">
              {game.isCheckmate() ? (
                <p className="text-xl mb-2">
                  {game.turn() === 'w' ? 'AI' : 'You'} won by checkmate!
                </p>
              ) : game.isDraw() ? (
                <p className="text-xl mb-2">
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
                <p className="text-xl mb-2">Game ended</p>
              )}
            </div>
            <button
              onClick={() => window.location.href = '/modes'}
              className="bg-[#3B2A0A] text-white font-bold py-3 px-6 rounded-md hover:bg-[#594205] transition-colors border border-[#B88A24]"
            >
              Back to Game Modes
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold">
                AI Chess Game
              </h1>
              <p>Difficulty: <span className={`font-bold ${difficultyInfo.color}`}>{difficultyInfo.name}</span></p>
              <p className="text-sm text-gray-300">Practice mode • No stakes • Match history not recorded</p>
            </div>

            {/* Main game area - board and move history side by side */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Left side: chessboard with captured pieces */}
              <div className="flex flex-col flex-grow max-w-[555px] mx-auto">
                {/* AI's captured pieces (top) */}
                <div className="mb-3 bg-[#3B2A0A] p-3 rounded-md border border-[#B88A24]">
                  <div className="captured-pieces">
                    <h3 className="text-sm font-bold mb-1">AI&apos;s captures:</h3>
                    <div className="flex space-x-2">
                      {Object.entries(capturedPieces.b).map(([piece, count]) => (
                        count > 0 ? (
                          <div key={`ai-captured-${piece}`} className="flex items-center">
                            <span className="text-xl text-white">{getPieceSymbol(piece)}</span>
                            {count > 1 && <span className="text-xs ml-1">×{count}</span>}
                          </div>
                        ) : null
                      ))}
                      {!Object.values(capturedPieces.b).some(count => count > 0) &&
                        <span className="text-gray-400 text-sm">No pieces captured</span>}
                    </div>
                  </div>
                </div>

                {/* Chessboard */}
                <div className="aspect-square">
                  <Chessboard
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    onPromotionPieceSelect={(piece) => {
                      console.log("Selected promotion piece:", piece);
                      const validPiece = piece?.slice(1).toLowerCase() || 'q';
                      promotionPieceRef.current = validPiece;
                      return true;
                    }}
                    boardOrientation="white"
                    areArrowsAllowed={true}
                  />
                </div>

                {/* Your captured pieces (bottom) */}
                <div className="mt-3 bg-[#3B2A0A] p-3 rounded-md border border-[#B88A24]">
                  <div className="captured-pieces">
                    <h3 className="text-sm font-bold mb-1">Your captures:</h3>
                    <div className="flex space-x-2">
                      {Object.entries(capturedPieces.w).map(([piece, count]) => (
                        count > 0 ? (
                          <div key={`player-captured-${piece}`} className="flex items-center">
                            <span className="text-xl text-white">{getPieceSymbol(piece)}</span>
                            {count > 1 && <span className="text-xs ml-1">×{count}</span>}
                          </div>
                        ) : null
                      ))}
                      {!Object.values(capturedPieces.w).some(count => count > 0) &&
                        <span className="text-gray-400 text-sm">No pieces captured</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: move history */}
              <div className="bg-[#3B2A0A] p-4 rounded-md border border-[#B88A24] w-full md:w-64 md:self-stretch flex flex-col">
                <h2 className="text-lg font-bold mb-3 text-white">Move History</h2>
                <div className="text-white overflow-auto flex-grow">
                  {formattedMoves.length > 0 ? (
                    <table className="w-full">
                      <tbody>
                        {Array.from({ length: Math.ceil(formattedMoves.length / 2) }).map((_, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-[#4C350C]" : ""}>
                            <td className="py-1 px-2 w-8 text-gray-400">{index + 1}.</td>
                            <td className="py-1 px-2">{formattedMoves[index * 2] || ""}</td>
                            <td className="py-1 px-2">{formattedMoves[index * 2 + 1] || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-400 text-sm">No moves yet</p>
                  )}
                </div>

                {/* Game status at the bottom of move history */}
                <div className="mt-4 pt-3 border-t border-[#594205]">
                  {game.isGameOver() ? (
                    <div className="text-white">
                      <h3 className="font-bold mb-1">Game Over</h3>
                      {game.isCheckmate() ? (
                        <p>{game.turn() === 'w' ? 'AI' : 'You'} won by checkmate</p>
                      ) : game.isDraw() ? (
                        <p>
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
                        <p>Game ended</p>
                      )}
                    </div>
                  ) : (
                    <p className={isMyTurn ? "text-green-400" : "text-gray-300"}>
                      {isMyTurn ? 'Your turn' : "AI is thinking..."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}