'use client'
import ChessGame from '@/components/ChessGame';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { useEffect, useState } from 'react';
import { getTierFromRating, Tier } from '@/utils';
import { useAccount } from 'wagmi';
import { socket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

export default function Home() {
  type GameMode = 'ranked' | 'unranked';

  const [mode, setMode] = useState<GameMode>('ranked');
  const [rating, setRating] = useState<number | undefined>()
  const [tier, setTier] = useState<Tier>('novice');
  const [isWaiting, setIsWaiting] = useState(false);
  const router = useRouter();
  const { address } = useAccount();

  useEffect(() => {
    // Demo rating - replace with actual rating fetch
    let rating = 201;
    setRating(rating);
    setTier(getTierFromRating(rating));
  }, []);

  useEffect(() => {
    socket.on('match_found', (gameData) => {
      setIsWaiting(false);
      
      
      // Navigate to the game page
      router.push(`/play/${mode}/${gameData.roomId}`);
    });

    return () => {
      socket.off('match_found');
    };
  }, [address, mode, router]);

  const joinLobby = () => {
    if (!address) {
      return;
    }

    socket.emit('join_lobby', {
      walletAddress: address,
      tier,
      rankedOrUnranked: mode
    });

    setIsWaiting(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className='mt-[75px]'>
          <div className='border-2 w-full text-center'>{mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
          <Card className="p-6 mb-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="wallet">Wallet Address</Label>
                <div>{address || "Not connected"}</div>
              </div>

              <div className="space-y-4">
                <Label>Tier</Label>
                <div>{tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
              </div>

              <Button
                onClick={joinLobby}
                disabled={isWaiting || !address}
                className="w-full"
              >
                {isWaiting ? 'Waiting for opponent...' : 'Find Match'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}