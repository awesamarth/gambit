'use client'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from 'react';
import { getTierFromRating, Tier } from '@/utils';
import { useAccount, useReadContract } from 'wagmi';
import { socket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import { GAMBIT_ABI, GAMBIT_ADDRESS } from '@/constants';
import { Loader2, Edit2 } from 'lucide-react';

export default function Home() {
  type GameMode = 'ranked' | 'unranked';

  const [mode, setMode] = useState<GameMode>('ranked');
  const [tier, setTier] = useState<Tier>('novice');
  const [isWaiting, setIsWaiting] = useState(false);
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const router = useRouter();
  const { address } = useAccount();

  const playerData = useReadContract({
    abi: GAMBIT_ABI,
    address: GAMBIT_ADDRESS,
    functionName: "getFullPlayerData",
    args: [address]
  })?.data;

  useEffect(() => {
    if (playerData) {
      //@ts-ignore
      setTier(getTierFromRating(Number(playerData[2])));
      //@ts-ignore
      setUsername(playerData[0]);
      //@ts-ignore
      setTempUsername(playerData[0]);
    }
  }, [playerData]);

  useEffect(() => {
    socket.on('match_found', (gameData) => {
      setIsWaiting(false);
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


  const getTierColor = (tier: Tier) => {
    const colors = {
      'novice': 'text-gray-300',
      'amateur': 'text-green-400',
      'pro': 'text-blue-400',
      'expert': 'text-purple-400',
      'grandmaster': 'text-red-400'
    };
    //@ts-ignore
    return colors[tier] || 'text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b pt-12 from-[#594205] to-[#352702] text-white flex items-center justify-center">
      <div className="container max-w-md px-4 py-8">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300 tracking-wide">
            Ranked Match
          </h1>

          <Card className="w-full bg-[#1F1A0E] border border-amber-900/50 rounded-xl shadow-xl overflow-hidden">


            <div className="p-6 space-y-6">
              {!address ? (
                <div className="text-center p-4 bg-amber-900/20 rounded-lg">
                  <p className="text-amber-200 mb-2">Wallet Not Connected</p>
                  <p className="text-sm text-amber-200/70">Connect your wallet to find a match</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="wallet" className="text-amber-200 text-sm">Wallet Address</Label>
                    <div className="bg-black/30 p-3 text-white rounded-lg text-sm font-mono overflow-hidden text-ellipsis">
                      {address}
                    </div>
                  </div>

                  <div className="space-y-2 text-white ">
                    <Label className="text-amber-200 text-sm">Username</Label>
                    <div className="bg-black/30 p-3 rounded-lg font-medium">
                      {username || "anon"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-amber-200 text-sm">Tier</Label>
                    <div className={`bg-black/30 p-3 rounded-lg font-bold ${getTierColor(tier)} flex items-center`}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={joinLobby}
                disabled={isWaiting || !address}
                className={`w-full py-6 text-lg font-bold mt-4 ${isWaiting
                  ? 'bg-amber-700/50 hover:bg-amber-700/50'
                  : 'bg-amber-600 hover:bg-amber-500'} transition-all duration-200`}
              >
                {isWaiting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    <span>Finding Opponent...</span>
                  </div>
                ) : (
                  'Find Match'
                )}
              </Button>

              {isWaiting && (
                <p className="text-center text-sm text-amber-200/70 mt-2">
                  Matching you with a player of similar skill...
                </p>
              )}
            </div>
          </Card>


        </div>
      </div>
    </div>
  );
}