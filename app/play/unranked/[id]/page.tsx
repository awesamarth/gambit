  //@ts-nocheck
  'use client';
  import { useEffect, useState, useRef } from 'react';
  import { Chessboard } from 'react-chessboard';
  import { Chess } from 'chess.js';
  import { socket } from '@/lib/socket';
  import { useParams } from 'next/navigation';
  import { useAccount, useSignMessage } from 'wagmi';

  export default function GamePage() {
    const [game, setGame] = useState(new Chess());
    const [playerColor, setPlayerColor] = useState('w');
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
    const [moveHistory, setMoveHistory] = useState([]);
    const [formattedMoves, setFormattedMoves] = useState([])
    const [capturedPieces, setCapturedPieces] = useState({
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    });
    const promotionPieceRef = useRef('');
    const lastMoveRef = useRef(null); // Track the last move to avoid duplicate capture counting

    const params = useParams();
    const gameId = params.id;
    const { address } = useAccount();



    // Load game data from server
    useEffect(() => {
      if (!gameId || !address) return;

      socket.emit('get_game_data', {
        roomId: gameId,
        walletAddress: address,
      });

      socket.on('game_data', (data) => {

        console.log("game data aaya")
        console.log(data)
        setGameData(data);
        setMessage(data.message);

        if (data.gameStatus === 'signing_start') {
          setIsSigning(true);
        } else {
          setIsSigning(false);
        }

        const isWhite = data.playerColors.w === address;
        setPlayerColor(isWhite ? 'w' : 'b');

        if (data.captures) {
          setCapturedPieces(data.captures);
        }
      });

      socket.on('game_ended', (data) => {
        setIsGameCompletelyOver(true);
        setIsEndingSigning(false);
        setHasSignedEnding(false);
      });

      socket.on('game_ending', (data) => {
        if (data.history) {
          console.log("yens history is there")
          setGameHistory(data.history)
          setIsEndingSigning(true);
        }
      });

      return () => {
        socket.off('game_data');
        socket.off('game_ending');
        socket.off('game_ended');
      };
    }, [gameId, address]);

    // Listen for game started event
    useEffect(() => {
      socket.on('game_started', (data) => {
        setGameData({ ...data });
        setIsSigning(false);
        setHasSigned(false);

        const newGame = new Chess();
        setGame(newGame);

        // Reset captured pieces
        setCapturedPieces({
          w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
          b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
        });

        const isWhite = data?.playerColors?.w === address;
        setPlayerColor(isWhite ? 'w' : 'b');
        setIsMyTurn(isWhite);
      });

      return () => {
        socket.off('game_started');
      };
    }, [address]);

    // Handle moves coming from the opponent
    useEffect(() => {
      if (!gameId) return;

      const handleMove = ({ from, to, promotion, whoseTurn, color, history, captures, formattedMoves }) => {
        if (formattedMoves) {
          setFormattedMoves(formattedMoves);
        }

        // Apply the move to local game state
        if (color !== playerColor) {
          setGame((currentGame) => {
            const newGame = new Chess(currentGame.fen());
            try {
              const moveDetails = newGame.move({ from, to, promotion });

              // Update formatted move history


              return newGame;
            } catch (error) {
              console.error('Invalid move received:', error);
              return currentGame;
            }
          });
        }

        // Update captures from server state
        if (captures) {
          setCapturedPieces(captures);
        }

        if (!isSigning) {
          setIsMyTurn(whoseTurn === playerColor);
        }
      };

      socket.off('move');
      socket.on('move', handleMove);

      return () => {
        socket.off('move');
      };
    }, [gameId, playerColor, isSigning]);

    // Execute a move in Chess.js
    function completeMove(from, to) {
      if (isSigning || !isMyTurn) return false;

      const promotion = promotionPieceRef.current;
      try {
        const moveDetails = game.move({
          from,
          to,
          promotion,
        });

        if (moveDetails) {
          // Update board locally
          setGame(new Chess(game.fen()));
          setIsMyTurn(false);


          // Send move to server (including capture info)
          socket.emit('make_move', {
            roomId: gameId,
            walletAddress: address,
            from,
            to,
            piece: moveDetails.piece,
            promotion,
            captured: moveDetails.captured,
            sanNotation: moveDetails.san
          });

          return true;
        }
      } catch (error) {
        console.error('Error making move:', error);
      }
      return false;
    }

    // The onDrop handler
    function onDrop(sourceSquare, targetSquare) {
      if (isSigning || !isMyTurn) return false;
      return completeMove(sourceSquare, targetSquare);
    }

    // Check for game end
    useEffect(() => {
      if (game.isGameOver() && !isSigning) {
        let result = 'draw';
        let winner = null;

        if (game.isCheckmate()) {
          result = 'checkmate';
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
              ? gameData?.playerColors.w
              : gameData?.playerColors.b
            : null,
        });
      }
    }, [game, gameId, gameData, isSigning]);

    // Function to get piece symbol for display
    function getPieceSymbol(piece) {
      const symbols = {
        p: '♟',
        n: '♞',
        b: '♝',
        r: '♜',
        q: '♛',
      };
      return symbols[piece] || '';
    }

    return (
      <div className="text-white mx-auto p-4 mt-[75px] min-h-screen w-full bg-[#594205]">
        <div className="max-w-5xl mx-auto">
    
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
                  Unranked Game
                </h1>
                <p>Tier: {gameData.tier}</p>
              </div>
    
              {isSigning ? (
                <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-4">
                  {hasSigned ? (
                    <h2 className="font-bold text-lg mb-2">Waiting for opponent to sign...</h2>
                  ) : (
                    <>
                      <h2 className="font-bold text-lg mb-2">Please sign this message to start the game</h2>
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
    
              {/* Game ending signing section */}
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
    
              {/* Main game area - board and move history side by side */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left side: chessboard with captured pieces */}
                <div className="flex flex-col flex-grow max-w-[555px] mx-auto">
                  {/* Opponent's captured pieces (top) */}
                  <div className="mb-3 bg-[#3B2A0A] p-3 rounded-md border border-[#B88A24]">
                    <div className="captured-pieces">
                      <h3 className="text-sm font-bold mb-1">
                        {playerColor === 'w' ? "Black's captures:" : "White's captures:"}
                      </h3>
                      <div className="flex space-x-2">
                        {Object.entries(capturedPieces[playerColor === 'w' ? 'b' : 'w']).map(([piece, count]) => (
                          count > 0 ? (
                            <div key={`top-captured-${piece}`} className="flex items-center">
                              <span className="text-xl text-white">{getPieceSymbol(piece)}</span>
                              {count > 1 && <span className="text-xs ml-1">×{count}</span>}
                            </div>
                          ) : null
                        ))}
                        {!Object.values(capturedPieces[playerColor === 'w' ? 'b' : 'w']).some(count => count > 0) &&
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
                        const validPiece = piece.slice(1).toLowerCase();
                        promotionPieceRef.current = validPiece;
                        return validPiece;
                      }}
                      boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                      areArrowsAllowed={true}
                    />
                  </div>
    
                  {/* Your captured pieces (bottom) */}
                  <div className="mt-3 bg-[#3B2A0A] p-3 rounded-md border border-[#B88A24]">
                    <div className="captured-pieces">
                      <h3 className="text-sm font-bold mb-1">
                        {playerColor === 'w' ? "White's captures:" : "Black's captures:"}
                      </h3>
                      <div className="flex space-x-2">
                        {Object.entries(capturedPieces[playerColor]).map(([piece, count]) => (
                          count > 0 ? (
                            <div key={`bottom-captured-${piece}`} className="flex items-center">
                              <span className="text-xl text-white">{getPieceSymbol(piece)}</span>
                              {count > 1 && <span className="text-xs ml-1">×{count}</span>}
                            </div>
                          ) : null
                        ))}
                        {!Object.values(capturedPieces[playerColor]).some(count => count > 0) &&
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
                    {game.isGameOver() && !isSigning ? (
                      <div className="text-white">
                        <h3 className="font-bold mb-1">Game Over</h3>
                        {game.isCheckmate() ? (
                          <p>{game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate</p>
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
                    ) : isSigning ? (
                      <p className="text-amber-300">Waiting for signatures</p>
                    ) : (
                      <p className={isMyTurn ? "text-green-400" : "text-gray-300"}>
                        {isMyTurn ? 'Your turn' : "Opponent's turn"}
                      </p>
                    )}
                  </div>
                </div>
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