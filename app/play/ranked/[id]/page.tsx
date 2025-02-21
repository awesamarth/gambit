//@ts-nocheck
'use client'
import { useEffect, useState } from 'react';
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
    const params = useParams();
    const gameId = params.id as string;
    const pathname = usePathname();
    const { address } = useAccount();


    useEffect(() => {
        if (!gameId || !address) return;

        // Request game data when component mounts
        socket.emit('get_game_data', {
            roomId: gameId,
            walletAddress: address
        });

        // Listen for game data response
        socket.on('game_data', (data) => {
            setGameData(data);

            // Initialize chess board with any existing moves
            if (data.moves && data.moves.length > 0) {
                const newGame = new Chess();
                data.moves.forEach(move => {
                    try {
                        newGame.move({
                            from: move.from,
                            to: move.to,
                            promotion: move.promotion || 'q'
                        });
                    } catch (error) {
                        console.error('Error applying move:', error);
                    }
                });
                setGame(newGame);
            }

            // Set player color and turn
            const isWhite = data.playerColors.w === address;
            console.log(isWhite)
            setPlayerColor(isWhite ? 'w' : 'b');
            setIsMyTurn(data.currentTurn === (isWhite ? 'w' : 'b'));
        });

        // Handle incoming moves
        socket.on('move', ({ from, to, promotion, whoseTurn }) => {
            setGame(currentGame => {
                const newGame = new Chess(currentGame.fen());
                try {
                    newGame.move({ from, to, promotion: promotion || 'q' });
                    return newGame;
                } catch (error) {
                    console.error('Invalid move received:', error);
                    return currentGame;
                }
            });

            console.log("iski turn hai: ", whoseTurn)
            console.log(playerColor === 'white' ? 'w' : 'b')

            // Update turn
            setIsMyTurn(whoseTurn === (playerColor === 'white' ? 'w' : 'b'));
        });

        return () => {
            socket.off('game_state');
            socket.off('move');
            socket.off('game_data');
        };
    }, [gameId, address]);

    function makeMove(sourceSquare, targetSquare, promotionPiece = 'q') {

        console.log("making move")
        if (!isMyTurn) return false;

        try {
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: promotionPiece,
            });

            if (move) {
                console.log("yes move is there")
                setGame(new Chess(game.fen()));

                setIsMyTurn(false);
                // Send move to server
                socket.emit('make_move', {
                    roomId: gameId,
                    walletAddress: address,
                    from: sourceSquare,
                    to: targetSquare,
                    piece: move.piece,
                    promotion: promotionPiece
                });

                return true;
            }
        } catch (error) {
            return false;
        }
        return false;
    }

    // Handle game end (checkmate, stalemate, etc.)
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
                winner: winner ? (winner === 'w' ? gameData?.playerColors.w : gameData?.playerColors.b) : null
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
                                {gameData.mode.charAt(0).toUpperCase() + gameData.mode.slice(1)} Game
                            </h1>
                            <p>Tier: {gameData.tier}</p>
                            {gameData.mode === 'ranked' && <p>Wager: {gameData.wager}</p>}
                        </div>

                        <div className="aspect-square">
                            <Chessboard
                                position={game.fen()}
                                onPieceDrop={makeMove}
                                boardOrientation={playerColor==='w'?'white':'black'}
                                areArrowsAllowed={true}
                            />
                        </div>

                        <div className="mt-4">
                            <p>Status: {isMyTurn ? "Your turn" : "Opponent's turn"}</p>
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