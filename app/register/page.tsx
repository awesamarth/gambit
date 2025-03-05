// app/register/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract } from 'wagmi';
import { GAMBIT_ABI, GAMBIT_ADDRESS } from '@/constants';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const { address } = useAccount();
  const {writeContractAsync} = useWriteContract()

  const handleRegister = async () => {
    if (!address || !username.trim()) return;

    try {
      setIsRegistering(true);
    //   await registerPlayer();

    await writeContractAsync({
      abi:GAMBIT_ABI,
      address:GAMBIT_ADDRESS,
      functionName: "registerPlayer",
      args:[username]
    })

      // Redirect to modes page after successful registration
      router.push('/modes');
    } catch (error) {
      console.error("Registration failed:", error);

    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-[100px] p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Gambit!</h1>

        <div className="space-y-6">
          <div>
            <Label htmlFor="username">Choose a Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="mt-2"
            />
          </div>

          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-medium mb-2">Registration Benefits:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Receive 200 GBT tokens to your wallet</li>
              <li>Play in ranked and wager matches</li>
              <li>Create and join private rooms</li>
              <li>Track your performance on the leaderboard (coming soon)</li>
            </ul>
          </div>

          <Button 
            onClick={handleRegister} 
            disabled={isRegistering || !username.trim() || !address}
            className="w-full"
          >
            {isRegistering ? 'Registering...' : 'Register & Claim 200 GBT'}
          </Button>
        </div>
      </Card>
    </div>
  );
}