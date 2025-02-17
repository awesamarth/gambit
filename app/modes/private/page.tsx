'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { socket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function PrivateRoom() {
  const [inputGameId, setInputGameId] = useState('');
  const [walletAddress, setWalletAddress] = useState(''); 
  const { toast } = useToast();
  const router = useRouter();

  const createGame = () => {
    socket.emit('create_room', {
      walletAddress,
      tier: 'open',
      wager: 0,
      isChallenge: false
    });
  };

  const joinGame = () => {

    console.log("join game clicked")

    socket.emit('join_room', {
      walletAddress,
      roomId: inputGameId
    });
  };

  useEffect(() => {
    socket.on('private_room_created', ({ roomId }) => {
      toast({
        title: 'Room Created',
        description: `Share this room ID with your opponent: ${roomId}`,
      });

      console.log("ye dekh room id: ", roomId)
      // router.push(`/game/${roomId}`);
    });

    socket.on('match_found', (gameData) => {
      router.push(`/game/${gameData.roomId}`);
    });

    return () => {
      socket.off('private_room_created');
      socket.off('match_found');
    };
  }, [router]);

  return (
    <div className="max-w-4xl mt-[75px] mx-auto">
      <Card className="p-24 mt-12`    mb-6">
        <div className="flex gap-4 mb-6 ">
          <Input
            placeholder="Enter room ID to join"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
          />
          <Button onClick={joinGame}>Join Game</Button>
          <Button onClick={createGame}>Create New Game</Button>
        </div>
      </Card>
    </div>
  );
}