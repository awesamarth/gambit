'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { socket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { GAMBIT_ABI, GAMBIT_ADDRESS } from '@/constants';

export default function PrivateRoom() {
  const [inputGameId, setInputGameId] = useState('');
  const [roomId, setRoomId] = useState("");
  const [wager, setWager] = useState(0);
  const [username, setUsername] = useState("anon"); // Added username state
  const { toast } = useToast();
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
        setUsername(playerData[0]);
  
      }
    }, [playerData]);
  



  const createGame = () => {
    if (!address) {
      return;
    }

    console.log("create game invoked");
    socket.emit('create_room', {
      walletAddress: address,
      tier: 'open',
      username:username,
      wager: Number(wager),
      isChallenge: false
    });
  };

  const joinGame = () => {
    if (!address) {
      console.log("address hi nahi hai bc");
      return;
    }

    if (!inputGameId.trim()) {
      console.log("room Id hi nahi hai bc");
      return;
    }

    socket.emit('join_room', {
      walletAddress: address,
      roomId: inputGameId,
      username:username
    });
  };

  useEffect(() => {
    socket.on('private_room_created', ({ roomId }) => {
      console.log("private room has been created");
      setRoomId(roomId);

      // Optional: copy to clipboard
      navigator.clipboard.writeText(roomId).then(() => {});
    });

    socket.on('match_found', (gameData) => {
      console.log("match has been found. router.pushing");
      router.push(`/play/private/${gameData.roomId}`);
    });

    return () => {
      socket.off('private_room_created');
      socket.off('match_found');
    };
  }, [router, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b pt-12 from-[#594205] to-[#352702] text-white flex items-center justify-center">
      <div className="container max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300 tracking-wide">
            Private Match
          </h1>

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

              <div className="space-y-2">
                <Label htmlFor="wager" className="text-amber-200 text-sm">Wager Amount (optional)</Label>
                <Input
                  id="wager"
                  type="number"
                  min="0"
                  placeholder="Enter wager amount"
                  value={wager}
                  onChange={(e) => setWager(Math.max(0, Number(e.target.value)))}
                  className="bg-black/30 border-amber-900/50 text-white"
                />
              </div>

              <Button 
                onClick={createGame}
                disabled={!address}
                className="w-full py-6 text-lg font-bold bg-amber-600 hover:bg-amber-500 transition-all duration-200"
              >
                Create New Game {wager > 0 ? `(${wager} GBT)` : ''}
              </Button>

              {roomId && (
                <div className="text-center p-4 bg-amber-900/20 rounded-lg">
                  <p className="text-amber-200 mb-2">Waiting for opponent...</p>
                  <p className="text-sm text-amber-200/70">Room ID: {roomId} <span className=' font-bold'>(copied to clipboard!)</span></p>
                </div>
              )}

              <div className="border-t border-amber-900/30 pt-6 mt-6">
                <h3 className="text-xl font-medium mb-4 text-amber-300">Join Existing Game</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-amber-200 text-sm">Room ID</Label>
                    <Input
                      placeholder="Enter room ID to join"
                      value={inputGameId}
                      onChange={(e) => setInputGameId(e.target.value)}
                      className="bg-black/30 border-amber-900/50 text-white"
                    />
                  </div>
                  <Button 
                    onClick={joinGame}
                    disabled={!address || !inputGameId.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-500 transition-all duration-200"
                  >
                    Join Game
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}