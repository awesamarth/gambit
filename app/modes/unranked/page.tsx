'use client'

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { socket } from '@/lib/socket';


export default function Home() {
  type GameMode = 'ranked' | 'unranked';
  type Tier = 'novice' | 'amateur' | 'pro' | 'expert' | 'grandmaster' | 'open';

  const [mode, setMode] = useState<GameMode>('unranked');
  const [tier, setTier] = useState<Tier>('novice');
  const [walletAddress, setWalletAddress] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);  

  const joinLobby = () => {

    console.log("join lobby called")
    if (!walletAddress) {
      console.log("address hi nahi hai bc")
      return;
    }

    socket.emit('join_lobby', {
      walletAddress,
      tier,
      rankedOrUnranked: mode
    });
    
    setIsWaiting(true);
   
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className='mt-[75px]'>
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
        </div>
      </div>
    </div>
  );
}