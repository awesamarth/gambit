// app/register/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
// You'll need to create these hooks for contract interaction
// import { useGambitContract } from '@/hooks/useGambitContract';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const { address } = useAccount();
  const { toast } = useToast();
//   const { registerPlayer, isPlayerRegistered } = useGambitContract();

  const handleRegister = async () => {
    if (!address || !username.trim()) return;
    
    try {
      setIsRegistering(true);
    //   await registerPlayer();
      
      toast({
        title: "Registration successful!",
        description: "200 GBT tokens have been added to your account.",
      });
      
      // Redirect to modes page after successful registration
      router.push('/modes');
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-[100px] p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Gambit Chess</h1>
        
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
              <li>Track your performance on the leaderboard</li>
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