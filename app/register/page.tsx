// app/register/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Assuming you have these UI components
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { GAMBIT_ABI, GAMBIT_ADDRESS } from '@/constants';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  // This hook will wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    isError: isConfirmError,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });
  
  // Handle transaction confirmation error
  if (isConfirmError && confirmError) {
    console.error("Transaction confirmation error:", confirmError);
    // Extract error message - adjust this based on your error structure
    const errorMsg = confirmError.message || "Transaction failed";
    setErrorMessage(errorMsg);
    setIsRegistering(false)
    
    setTxHash(''); // Reset hash to allow retrying
  }
  
  // Redirect after transaction is confirmed
  if (isConfirmed) {
    router.push('/modes');
  }

  const alreadyRegistered = useReadContract({
      abi:GAMBIT_ABI,
      address:GAMBIT_ADDRESS,
      //to do replapce this with getplayerdata
      functionName:"getFullPlayerData",
      args:[address]
  }).data

  if(alreadyRegistered){
    //@ts-ignore
    if(alreadyRegistered[4]){
      router.push("/")
    }
  }
  
  const handleRegister = async () => {
    if (!address || !username.trim()) return;
    
    try {
      setIsRegistering(true);
      setErrorMessage(''); // Clear any previous errors
      
      // Submit transaction
      const hash = await writeContractAsync({
        abi: GAMBIT_ABI,
        address: GAMBIT_ADDRESS,
        functionName: "registerPlayer",
        args: [username]
      });
      
      // Store hash for tracking confirmation
      setTxHash(hash);
      
    } catch (error: any) {
      console.error("Registration failed:", error);
      
      // Check for custom errors
      if (error.cause?.data?.data) {
        // This is where custom errors are typically found in returned error objects
        const errorData = error.cause.data.data;
        if (errorData.includes("AlreadyRegistered")) {
          setErrorMessage("This wallet is already registered");
        } else if (errorData.includes("UsernameAlreadyTaken")) {
          setErrorMessage("This username is already taken");
        } else {
          setErrorMessage(error.message || "Registration failed");
        }
      } else {
        setErrorMessage(error.message || "Registration failed");
      }
      
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-[100px] p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Gambit Chess</h1>
        
        <div className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Username is already taken</AlertDescription>
            </Alert>
          )}
          
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
            disabled={isRegistering || isConfirming || !username.trim() || !address}
            className="w-full"
          >
            {isRegistering ? 'Initiating transaction...' : 
             isConfirming ? 'Confirming transaction...' : 
             'Register & Claim 200 GBT'}
          </Button>
        </div>
      </Card>
    </div>
  );
}