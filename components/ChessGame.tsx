'use client';

import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { initSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

type GameMode = 'ranked' | 'unranked';
type Tier = 'novice' | 'amateur' | 'pro' | 'expert' | 'grandmaster' | 'open';

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState('');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [mode, setMode] = useState<GameMode>('unranked');
  const [tier, setTier] = useState<Tier>('novice');
  const [walletAddress, setWalletAddress] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const socket = initSocket();
    console.log('Socket initialized');

    socket.on('match_found', (gameData) => {
      console.log('Match found:', gameData);
      setGameId(gameData.id);
      setIsWaiting(false);
      
      const isWhite = gameData.playerColors.w === walletAddress;
      setPlayerColor(isWhite ? 'white' : 'black');
      
      toast({
        title: 'Match Found!',
        description: `You are playing as ${isWhite ? 'white' : 'black'}`,
      });
    });

    socket.on('move_made', (moveData) => {
      console.log('Move received:', moveData);
      try {
        setGame(game => {
          const newGame = new Chess(game.fen());
          const move = newGame.move({
            from: moveData.from,
            to: moveData.to,
            promotion: 'q',
          });
          console.log('Server move applied:', move);
          return newGame;
        });
      } catch (error) {
        console.error('Invalid move:', error);
      }
    });

    socket.on('invalid_move', (data) => {
      console.log('Invalid move:', data);
      toast({
        title: 'Invalid Move',
        description: data.message,
        variant: 'destructive',
      });
    });

    socket.on('game_ended', (data) => {
      console.log('Game ended:', data);
      let message = 'Game Over! ';
      if (data.result === 'disconnection') {
        message += 'Opponent disconnected';
      } else if (data.result === 'checkmate') {
        message += 'Checkmate!';
      } else if (data.result === 'draw') {
        message += 'Draw!';
      }

      toast({
        title: message,
        description: data.winner === walletAddress ? 'You won!' : 'You lost!',
      });
    });

    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('match_found');
      socket.off('move_made');
      socket.off('invalid_move');
      socket.off('game_ended');
    };
  }, [walletAddress]);

  function makeMove(sourceSquare: string, targetSquare: string) {
    console.log('Attempting move:', { sourceSquare, targetSquare });
    const socket = initSocket();
    
    const currentColor = game.turn() === 'w' ? 'white' : 'black';
    if (currentColor !== playerColor) {
      console.log('Not player\'s turn');
      toast({
        title: 'Not your turn',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move) {
        console.log('Valid move:', move);
        setGame(newGame);
        socket.emit('make_move', {
          roomId: gameId,
          walletAddress,
          from: sourceSquare,
          to: targetSquare
        });
        return true;
      }
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
    return false;
  }

  const joinLobby = () => {
    console.log('Joining lobby:', { walletAddress, mode, tier });
    if (!walletAddress) {
      toast({
        title: 'Error',
        description: 'Please enter your wallet address',
        variant: 'destructive',
      });
      return;
    }

    const socket = initSocket();
    socket.emit('join_lobby', {
      walletAddress,
      tier,
      rankedOrUnranked: mode
    });
    
    setIsWaiting(true);
    toast({
      title: 'Joining Lobby',
      description: `Waiting for opponent in ${mode} ${tier} tier...`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">WebSocket Chess</h1>
      
      <Card className="p-6 mb-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="wallet">Wallet Address</Label>
            <input
              id="wallet"
              type="text"
              placeholder="Enter wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>

          <div className="space-y-4">
            <Label>Game Mode</Label>
            <RadioGroup 
              value={mode} 
              onValueChange={(value: GameMode) => setMode(value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ranked" id="ranked" />
                <Label htmlFor="ranked">Ranked</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unranked" id="unranked" />
                <Label htmlFor="unranked">Unranked</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Tier</Label>
            <RadioGroup 
              value={tier} 
              onValueChange={(value: Tier) => setTier(value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="novice" id="novice" />
                <Label htmlFor="novice">Novice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amateur" id="amateur" />
                <Label htmlFor="amateur">Amateur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pro" id="pro" />
                <Label htmlFor="pro">Pro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expert" id="expert" />
                <Label htmlFor="expert">Expert</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grandmaster" id="grandmaster" />
                <Label htmlFor="grandmaster">Grandmaster</Label>
              </div>
              {mode === 'unranked' && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="open" id="open" />
                  <Label htmlFor="open">Open</Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <Button 
            onClick={joinLobby}
            disabled={isWaiting}
            className="w-full"
          >
            {isWaiting ? 'Waiting for opponent...' : 'Find Match'}
          </Button>
        </div>

        {gameId && (
          <p className="text-sm text-muted-foreground mt-4">
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