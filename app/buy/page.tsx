'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAccount, useWriteContract } from 'wagmi';
import { GAMBIT_TOKEN_ABI, GAMBIT_TOKEN_ADDRESS } from '@/constants';
import { parseEther } from 'viem';

export default function BuyTokens() {
  const [tokenAmount, setTokenAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [txHash, setTxHash] = useState("");
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  

  // Price calculation
  const pricePerHundred = 0.0001; // ETH
  const totalPrice = (tokenAmount / 100) * pricePerHundred;


  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure only multiples of 100
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      // Round to nearest 100
      const roundedValue = Math.max(100, Math.round(value / 100) * 100);
      setTokenAmount(roundedValue);
    } else {
      setTokenAmount(100);
    }
  };

  const handleBuyTokens = async() => {
    if (!address) return;
    
    setIsProcessing(true);
    try {
      const result = await writeContractAsync({
        abi: GAMBIT_TOKEN_ABI,
        address: GAMBIT_TOKEN_ADDRESS,
        functionName: "buyTokens",
        args: [tokenAmount],
        value: parseEther(String(totalPrice))
      });

      console.log(result);
      if(result) {
        setTxHash(result);
        setPurchased(true);
      }
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPurchase = () => {
    setPurchased(false);
    setTxHash("");
    setTokenAmount(100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b pt-12 from-[#594205] to-[#352702] text-white flex items-center justify-center">
      <div className="container max-w-md px-4 py-8">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300 tracking-wide">
            {purchased ? "Purchase Complete!" : "Buy GBT Tokens"}
          </h1>

          <Card className="w-full bg-[#1F1A0E] border border-amber-900/50 rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 space-y-6">
              {purchased ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-amber-600/20 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-amber-300 mb-2">Thank You!</h2>
                    <p className="text-amber-200 mb-6">Your purchase of {tokenAmount} GBT tokens was successful!</p>
                    
                    <div className="bg-amber-900/20 p-4 rounded-lg mb-6">
                      <div className="flex justify-between text-amber-200 text-sm">
                        <span>Transaction:</span>
                        <span className="font-mono truncate max-w-[180px]">{txHash.substring(0, 10)}...{txHash.substring(txHash.length-8)}</span>
                      </div>
                      <div className="flex justify-between mt-2 text-amber-200 text-sm">
                        <span>Amount:</span>
                        <span>{tokenAmount} GBT</span>
                      </div>
                      <div className="flex justify-between mt-2 text-amber-200 text-sm">
                        <span>Price paid:</span>
                        <span>{totalPrice.toFixed(3)} ETH</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={resetPurchase}
                        className="w-full py-4 text-md font-bold bg-amber-600 hover:bg-amber-500 transition-all duration-200"
                      >
                        Buy More Tokens
                      </Button>
                      
                      <Button 
                        onClick={() => window.location.href = '/modes'}
                        className="w-full py-4 text-md font-bold bg-amber-900/40 hover:bg-amber-900/60 transition-all duration-200"
                      >
                        Go to Modes
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tokenAmount" className="text-amber-200 text-sm">Token Amount (multiples of 100)</Label>
                    <Input
                      id="tokenAmount"
                      type="number"
                      min="100"
                      step="100"
                      value={tokenAmount}
                      onChange={handleTokenAmountChange}
                      onBlur={() => {
                        // Ensure value is a multiple of 100 on blur
                        setTokenAmount(Math.max(100, Math.round(tokenAmount / 100) * 100));
                      }}
                      placeholder="Enter amount of tokens"
                      className="bg-black/30 border-amber-900/50 text-white"
                    />
                  </div>

                  <div className="bg-amber-900/20 p-4 rounded-lg">
                    <div className="flex justify-between text-amber-200">
                      <span>Price per 100 tokens:</span>
                      <span>0.0001 ETH</span>
                    </div>
                    <div className="flex justify-between mt-2 text-lg font-bold text-white">
                      <span>Total price:</span>
                      <span>{totalPrice.toFixed(3)} ETH</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBuyTokens} 
                    disabled={isProcessing || !address || tokenAmount < 100}
                    className="w-full py-6 text-lg font-bold bg-amber-600 hover:bg-amber-500 transition-all duration-200"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : `Buy ${tokenAmount} GBT`}
                  </Button>

                  {!address && (
                    <span className="text-amber-500 mt-2 text-center w-full flex flex-col">
                      Please connect your wallet!
                    </span>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}