'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getTierFromRating, Tier } from '@/utils';
import { useAccount } from 'wagmi';
import { socket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

type Challenge = {
  roomId: string;
  tier: string;
  wager: number;
  playerColors: {
    w: string;
    b: string;
  };
  mode: string;
  gameStatus: string;
};

export default function ArenaPage() {
  const [tier, setTier] = useState<Tier>('novice');
  const [rating, setRating] = useState<number>(0);
  const [wager, setWager] = useState<number>(0);
  const [openToAll, setOpenToAll] = useState<boolean>(false);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [waitingRoomId, setWaitingRoomId] = useState<string>("");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [username, setUsername] = useState("")

  const { toast } = useToast();
  const router = useRouter();
  const { address } = useAccount();

  useEffect(() => {
    // Demo rating fetch - replace with actual API call
    const demoRating = 0;
    setRating(demoRating);
    setTier(getTierFromRating(demoRating));

    // Get all existing challenges when page loads
    socket.emit('get_challenges');

    // Handle responses from server
    socket.on('challenges_list', (challengesList) => {
      console.log(challengesList);
      // Filter out challenges created by current user and ensure proper structure
      const filteredChallenges = challengesList.filter(
        //@ts-ignore
        challenge => challenge &&
          challenge.playerColors &&
          challenge.playerColors.w !== address
      );
      setChallenges(filteredChallenges);
    });

    socket.on('challenge_created', (challenge) => {
      // Only add challenges from other users
      if (challenge.playerColors?.w !== address) {
        setChallenges(prev => [challenge, ...prev]);
      } else {
        // This is my own challenge
        setWaitingRoomId(challenge.roomId);
        toast({
          title: "Challenge Created",
          description: "Waiting for an opponent to accept your challenge.",
        });
      }
    });

    socket.on('match_found', (gameData) => {
      setIsWaiting(false);
      setWaitingRoomId("");
      router.push(`/play/arena/${gameData.roomId}`);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off('challenges_list');
      socket.off('challenge_created');
      socket.off('match_found');
    };
  }, [address, router, toast]);

  const createChallenge = () => {
    if (!address) return;

    socket.emit('create_room', {
      walletAddress: address,
      username: username,
      tier: openToAll ? 'open' : tier,
      wager: Number(wager),
      isChallenge: true
    });

    setIsWaiting(true);
  };

  const acceptChallenge = (challenge: Challenge) => {
    if (!address) return;

    socket.emit('join_room', {
      walletAddress: address,
      roomId: challenge.roomId
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b pt-12 from-[#594205] to-[#352702] text-white flex items-center justify-center">
      <div className="container max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300 tracking-wide">
            Arena Mode
          </h1>
  
          {/* Challenge Creation Form */}
          <Card className="w-full bg-[#1F1A0E] border border-amber-900/50 rounded-xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="wallet" className="text-amber-200 text-sm">Wallet Address</Label>
                <div className="bg-black/30 p-3 text-white rounded-lg text-sm font-mono overflow-hidden text-ellipsis">
                  {address || "Not connected"}
                </div>
              </div>
  
              <div className="space-y-2 text-white">
                <Label className="text-amber-200 text-sm">Username</Label>
                <div className="bg-black/30 p-3 rounded-lg font-medium">
                  {username || "anon"}
                </div>
              </div>
  
              <div className="space-y-4">
                <Label className="text-amber-200 text-sm">Current Tier: 
                  <span className="font-bold ml-2">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                </Label>
  
                <div className="flex items-center space-x-2 text-amber-200">
                  <Switch
                    id="tier-switch"
                    checked={openToAll}
                    onCheckedChange={setOpenToAll}
                  />
                  <Label htmlFor="tier-switch" className="text-sm">Open to all tiers</Label>
                </div>
              </div>
  
              <div className="space-y-2">
                <Label htmlFor="wager" className="text-amber-200 text-sm">Wager Amount</Label>
                <Input
                  id="wager"
                  type="number"
                  min="0"
                  value={wager}
                  onChange={(e) => setWager(Math.max(0, Number(e.target.value)))}
                  placeholder="Enter wager amount"
                  className="bg-black/30 border-amber-900/50 text-white"
                />
              </div>
  
              {isWaiting ? (
                <div className="text-center p-4 bg-amber-900/20 rounded-lg">
                  <p className="text-amber-200 mb-2">Waiting for an opponent...</p>
                  {waitingRoomId && (
                    <p className="text-sm text-amber-200/70">Challenge ID: {waitingRoomId}</p>
                  )}
                </div>
              ) : (
                <Button
                  onClick={createChallenge}
                  disabled={!address}
                  className="w-full py-6 text-lg font-bold mt-4 bg-amber-600 hover:bg-amber-500 transition-all duration-200"
                >
                  Create Challenge
                </Button>
              )}
            </div>
          </Card>
  
          {/* Available Challenges */}
          <h2 className="text-3xl font-bold mb-6 text-amber-300 self-start">Available Challenges</h2>
          {challenges.length === 0 ? (
            <div className="text-center p-8 border border-amber-900/50 border-dashed rounded-xl w-full bg-[#1F1A0E]/50">
              <p className="text-amber-200/70">No active challenges available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {challenges.map((challenge) => (
                <Card key={challenge.roomId} className="bg-[#1F1A0E] border border-amber-900/50 rounded-xl shadow-xl overflow-hidden">
                  <div className="flex flex-col h-full p-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <Label className="text-amber-200 text-sm">Tier:</Label>
                        <span className="font-medium text-white">
                          {challenge.tier ? challenge.tier.charAt(0).toUpperCase() + challenge.tier.slice(1) : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <Label className="text-amber-200 text-sm">Wager:</Label>
                        <span className="font-medium text-white">{challenge.wager || 0} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <Label className="text-amber-200 text-sm">Creator:</Label>
                        <span className="text-xs text-white truncate max-w-[150px]">
                          {challenge.playerColors?.w || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => acceptChallenge(challenge)}
                      className="mt-auto bg-amber-600 hover:bg-amber-500 transition-all duration-200"
                      disabled={!address}
                    >
                      Accept Challenge
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}