'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { socket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function PrivateRoom() {
  const [inputGameId, setInputGameId] = useState('');
const [roomId, setRoomId] = useState("")
  const [wager, setWager] = useState(0);
  const { toast } = useToast();
  const router = useRouter();
  const { address } = useAccount();

  const createGame = () => {


    if (!address) {
      
      return;
    }

    console.log("create game invoked")
    socket.emit('create_room', {
      walletAddress: address,
      tier: 'open',
      wager: Number(wager),
      isChallenge: false
    });
  };

  const joinGame = () => {
    if (!address) {
      console.log("address hi nahi hai bc")
      return;
    }

    if (!inputGameId.trim()) {
      console.log("room Id hi nahi hai bc")
      return;
    }

    socket.emit('join_room', {
      walletAddress: address,
      roomId: inputGameId
    });
  };

  useEffect(() => {
    socket.on('private_room_created', ({ roomId }) => {
      console.log("private room has been created")
      setRoomId(roomId)


      // Optional: copy to clipboard
      navigator.clipboard.writeText(roomId).then(() => {

      });
    });

    socket.on('match_found', (gameData) => {

      console.log("match has been found. router.pushing")
      router.push(`/play/private/${gameData.roomId}`);
    });

    return () => {
      socket.off('private_room_created');
      socket.off('match_found');
    };
  }, [router, toast]);

  return (
    <div className="max-w-4xl mt-[75px] mx-auto">
      <Card className="p-8 mt-12 mb-6">
        <h2 className="text-2xl font-bold mb-6">Private Game Room</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="wager">Wager Amount (optional)</Label>
            <Input
              id="wager"
              type="number"
              min="0"
              placeholder="Enter wager amount"
              value={wager}
              onChange={(e) => setWager(Math.max(0, Number(e.target.value)))}
              className="mb-4"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={createGame}
              className="flex-1"
            >
              Create New Game {wager > 0 ? `(${wager} token wager)` : ''}
            </Button>
          </div>

          <div>{roomId?`waiting for opponent. room ID is: ${roomId}`:""}</div>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-xl font-medium mb-4">Join Existing Game</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Enter room ID to join"
                value={inputGameId}
                onChange={(e) => setInputGameId(e.target.value)}
              />
              <Button onClick={joinGame}>Join Game</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}