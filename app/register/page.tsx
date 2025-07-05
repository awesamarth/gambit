// app/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GAMBIT_ABI, GAMBIT_ADDRESS } from '@/constants';
import { parseEther } from 'viem';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const router = useRouter();
  const { address } = useAccount();
  const {writeContractAsync} = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleRegister = async () => {
    if (!address || !username.trim()) return;

    try {
      setIsRegistering(true);

      const hash = await writeContractAsync({
        abi: GAMBIT_ABI,
        address: GAMBIT_ADDRESS,
        functionName: "registerPlayer",
        args: [username],
        value: parseEther('0.0001')
      })

      setTxHash(hash);
    } catch (error) {
      console.error("Registration failed:", error);
      setIsRegistering(false);
    }
  };

  // Effect to handle successful confirmation
  useEffect(() => {
    if (isConfirmed) {
      setIsRegistering(false);
      router.push('/modes');
    }
  }, [isConfirmed, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b pt-12 from-[#594205] to-[#352702] text-white flex items-center justify-center">
      <div className="container max-w-md px-4 py-8">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300 tracking-wide">
            Welcome to Gambit!
          </h1>
  
          <Card className="w-full bg-[#1F1A0E] border border-amber-900/50 rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <Label htmlFor="username" className="text-amber-200 text-sm">Choose a Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="mt-2 bg-black/30 border-amber-900/50 text-white"
                />
              </div>
  
              <div className="bg-amber-900/20 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2 text-amber-200">Registration Benefits:</p>
                <ul className="list-disc pl-4 space-y-1 text-white">
                  <li>2x joining bonus! Receive <b>200 GBT</b> tokens for just 0.0001 ETH!</li>
                  <li>Play in ranked and wager matches</li>
                  <li>Create and join private rooms</li>
                  <li>Track your performance on the leaderboard (coming soon)</li>
                </ul>
              </div>
  
              <Button 
                onClick={handleRegister} 
                disabled={isRegistering || isConfirming || !username.trim() || !address}
                className="w-full py-6 text-lg font-bold bg-amber-600 hover:bg-amber-500 transition-all duration-200"
              >
                {isRegistering && !txHash ? 'Signing Transaction...' : 
                 isConfirming ? 'Confirming Transaction...' : 
                 'Register (0.0001 ETH)'}
              </Button>
  
              {!address && (
                <span className="text-amber-500 mt-2 text-center w-full flex flex-col">
                  Please connect your wallet!
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}