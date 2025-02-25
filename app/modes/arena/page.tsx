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

  const { toast } = useToast();
  const router = useRouter();
  const { address } = useAccount();

  useEffect(() => {
    // Demo rating fetch - replace with actual API call
    const demoRating = 201;
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className='mt-[75px]'>
          <h1 className="text-3xl font-bold mb-6">Arena Mode</h1>

          {/* Challenge Creation Form */}
          <Card className="p-6 mb-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="wallet">Wallet Address</Label>
                <div>{address || "Not connected"}</div>
              </div>

              <div className="space-y-4">
                <Label>Current Tier: {tier.charAt(0).toUpperCase() + tier.slice(1)}</Label>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="tier-switch"
                    checked={openToAll}
                    onCheckedChange={setOpenToAll}
                  />
                  <Label htmlFor="tier-switch">Open to all tiers</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wager">Wager Amount</Label>
                <Input
                  id="wager"
                  type="number"
                  min="0"
                  value={wager}
                  onChange={(e) => setWager(Math.max(0, Number(e.target.value)))}
                  placeholder="Enter wager amount"
                />
              </div>

              {isWaiting ? (
                <div className="text-center p-4 bg-muted rounded-md">
                  <p className="font-medium mb-2">Waiting for an opponent...</p>
                  {waitingRoomId && (
                    <p className="text-sm text-muted-foreground">Challenge ID: {waitingRoomId}</p>
                  )}
                </div>
              ) : (
                <Button
                  onClick={createChallenge}
                  disabled={!address}
                  className="w-full"
                >
                  Create Challenge
                </Button>
              )}
            </div>
          </Card>

          {/* Available Challenges */}
          <h2 className="text-2xl font-bold mb-4">Available Challenges</h2>
          {challenges.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-md">
              <p className="text-muted-foreground">No active challenges available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge) => (
                <Card key={challenge.roomId} className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <Label>Tier:</Label>
                        <span className="font-medium">
                          {challenge.tier ? challenge.tier.charAt(0).toUpperCase() + challenge.tier.slice(1) : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <Label>Wager:</Label>
                        <span className="font-medium">{challenge.wager || 0} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <Label>Creator:</Label>
                        <span className="text-xs truncate max-w-[150px]">
                          {challenge.playerColors?.w || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => acceptChallenge(challenge)}
                      className="mt-auto"
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