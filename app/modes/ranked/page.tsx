'use client'
import ChessGame from '@/components/ChessGame';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from 'react';
import { getTierFromRating, Tier } from '@/utils';
import { useAccount } from 'wagmi';
import { socket } from '@/lib/socket';


export default function Home() {
  type GameMode = 'ranked' | 'unranked';

  const [mode, setMode] = useState<GameMode>('ranked');
  const [rating, setRating] = useState<number | undefined>()
  const [tier, setTier] = useState<Tier>('novice');
  const [status, setStatus] = useState<string>()
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    let rating = 201
    setRating(rating)
    setTier(getTierFromRating(rating))

  }, [])

  const { address } = useAccount()


  const joinLobby = () => {

    console.log("join lobby called")
    if (!address) {
      console.log("address hi nahi hai bc")
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
          <div className='border-2 w-full text-center'>Ranked</div>
          <Card className="p-6 mb-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="wallet">Wallet Address</Label>
                <div>{address}</div>
              </div>



              <div className="space-y-4">
                <Label>Tier</Label>
                <div>{tier}</div>

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
        </div>
      </div>
    </div>
  );
}