'use client'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { useEffect, useState } from 'react';
import { getTierFromRating, Tier } from '@/utils';
import { useAccount, useReadContract } from 'wagmi';
import { socket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import { GAMBIT_ABI, GAMBIT_ADDRESS } from '@/constants';

export default function Home() {
  type GameMode = 'ranked' | 'unranked';

  const [mode, setMode] = useState<GameMode>('ranked');
  const [tier, setTier] = useState<Tier>('novice');
  const [isWaiting, setIsWaiting] = useState(false);
  const [username, setUsername] = useState("")
  const router = useRouter();
  const { address } = useAccount();

  //@ts-ignore
  let playerData:any

//@ts-ignore
  playerData = useReadContract({
      abi: GAMBIT_ABI,
      address: GAMBIT_ADDRESS,
      // to  do: rename this to getplayerdata and make all corresponding changes 
      functionName: "getFullPlayerData",
      args: [address]
    })?.data


    
  useEffect(() => {
    // Demo rating - replace with actual rating fetch
    if (playerData){
      //@ts-ignore
      console.log(Number(playerData[2]))
      // @ts-ignore
      setTier(getTierFromRating(Number(playerData[2])));
      setUsername(playerData[0])
    }
  }, [playerData]);

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
      username: username,
      tier,
      rankedOrUnranked: mode
    });

    setIsWaiting(true);
  };

  return (
    <div className="min-h-screen  bg-[#594205] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className='mt-[75px]'>
          <div className=' text-3xl mb-12 w-full text-center'>Ranked Match</div>
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