'use client';

import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { socket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

type GameMode = 'ranked' | 'unranked';
type Tier = 'novice' | 'amateur' | 'pro' | 'expert' | 'grandmaster' | 'open';

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState('');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [mode, setMode] = useState<GameMode>('unranked');
  const [tier, setTier] = useState<Tier>('novice');
  const [walletAddress, setWalletAddress] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  
  const { toast } = useToast();
  
  useEffect(() => {
    socket.on('match_found', (gameData) => {
      setGameId(gameData.roomId);
      setIsWaiting(false);
      
      const isWhite = gameData.playerColors.w === walletAddress;
      setPlayerColor(isWhite ? 'white' : 'black');
      setIsMyTurn(isWhite);
      
      toast({
        title: 'Match Found!',
        description: `You are playing as ${isWhite ? 'white' : 'black'}`,
      });
    });

    socket.on('move', ({ from, to }) => {

      console.log("opponent move recieved")
      setGame((currentGame) => {
        const newGame = new Chess(currentGame.fen());
        try {
          if (!newGame.get(from)) {
            return currentGame;
          }
          newGame.move({ from, to });
          setIsMyTurn(true);
          return newGame;
        } catch (error) {
          console.error('Invalid move received:', error);
          return currentGame;
        }
      });
    });

    socket.on('game_ended', (data) => {
      let message = 'Game Over! ';
      if (data.reason === 'disconnection') {
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
      socket.off('match_found');
      socket.off('move');
      socket.off('game_ended');
    };
  }, [walletAddress]);

  function makeMove(sourceSquare: string, targetSquare: string) {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
      });

      if (move) {
        setGame(new Chess(game.fen()));
        socket.emit('make_move', {
          roomId: gameId,
          walletAddress,
          from: sourceSquare,
          to: targetSquare
        });
        setIsMyTurn(false);
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  const joinLobby = () => {

    console.log("join lobby called")
    if (!walletAddress) {
      toast({
        title: 'Error',
        description: 'Please enter your wallet address',
        variant: 'destructive',
      });
      return;
    }

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
              {['novice', 'amateur', 'pro', 'expert', 'grandmaster'].map((t) => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={t} />
                  <Label htmlFor={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Label>
                </div>
              ))}
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
      </Card>
      
      <div className="aspect-square max-w-2xl mx-auto">
        <Chessboard
          position={game.fen()}
          onPieceDrop={makeMove}
          boardOrientation={playerColor}
          arePiecesDraggable={isMyTurn}
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