'use client';

import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { socket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState('');
  const [inputGameId, setInputGameId] = useState('');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const { toast } = useToast();
  
  useEffect(() => {

    socket.on('gameState', (gameState) => {
      if (gameState.players.length === 2) {
        const playerIndex = gameState.players.indexOf(socket.id);
        setPlayerColor(playerIndex === 0 ? 'white' : 'black');
        toast({
          title: 'Game Started!',
          description: `You are playing as ${playerIndex === 0 ? 'white' : 'black'}`,
        });
      }
    });

    socket.on('move', ({ from, to }) => {
      setGame((currentGame) => {
        const newGame = new Chess(currentGame.fen());
        try {
          newGame.move({ from, to, promotion: 'q' });
          return newGame;
        } catch (error) {
          console.error('Invalid move received:', error);
          return currentGame;
        }
      });
    });

    return () => {
      socket.off('gameState');
      socket.off('move');
    };
  }, []);

  function makeMove(sourceSquare: string, targetSquare: string) {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move) {
        setGame(new Chess(game.fen()));
        socket.emit('move', { gameId, from: sourceSquare, to: targetSquare });
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  const createGame = () => {
    const newGameId = Math.random().toString(36).substring(7);
    setGameId(newGameId);
    socket.emit('createGame', newGameId);
    toast({
      title: 'Game Created',
      description: `Share this game ID with your opponent: ${newGameId}`,
    });
  };

  const joinGame = () => {
    socket.emit('joinGame', inputGameId);
    setGameId(inputGameId);
  };

  return (
    <div className="max-w-4xl mx-auto ">
      <Card className="p-6 mb-6 " >
        <div className="flex gap-4 mb-6 mt-[75px]">
          <Input
            placeholder="Enter game ID to join"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
          />
          <Button onClick={joinGame}>Join Game</Button>
          <Button onClick={createGame}>Create New Game</Button>
        </div>
        {gameId && (
          <p className="text-sm text-muted-foreground mb-4">
            Game ID: {gameId}
          </p>
        )}
      </Card>
      
      <div className="aspect-square max-w-2xl mx-auto">
        <Chessboard
          position={game.fen()}
          onPieceDrop={makeMove}
          boardOrientation={playerColor}
        />
      </div>
      
      {game.isGameOver() && (
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold">
            Game Over! {game.isCheckmate() ? 'Checkmate!' : 'Draw!'}
          </h2>
        </div>
      )}
    </div>
  );
}