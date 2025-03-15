'use client'
// components/Navbar.tsx
import Link from 'next/link';
import Image from 'next/image';
import { useAccount, useDisconnect, useReadContract } from 'wagmi';
import { useState } from 'react';
import { User } from 'lucide-react';
import { formatEther } from 'viem';
import { GAMBIT_TOKEN_ABI, GAMBIT_ABI, GAMBIT_ADDRESS, GAMBIT_TOKEN_ADDRESS } from '@/constants';

export default function Navbar() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect()
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const playerData = useReadContract({
    abi: GAMBIT_ABI,
    address: GAMBIT_ADDRESS,
    // to  do: rename this to getplayerdata and make all corresponding changes 
    functionName: "getFullPlayerData",
    args: [address]
  }).data

  console.log(playerData)
  const playerBalance = useReadContract({
    abi: GAMBIT_TOKEN_ABI,
    address: GAMBIT_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: [address]
  }).data




  return (
    <nav className="w-full h-[75px] bg-[#3B2A0A] absolute top-0 px-6 flex items-center justify-between">
      {/* Logo/Brand */}
      <Link href="/" className="text-white text-3xl font-bold">
        Gambit
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-8">
      </div>

      {/* Stats/Currency Display */}
      <div className="flex items-center gap-8 rounded-full py-2">
  <Link
    href="/modes"
    className="bg-[#906810] px-6 py-1 rounded-md text-white text-xl hover:bg-[#A77812] transition-colors"
  >
    Play
  </Link>

  <Link
    href="/leaderboard"
    className="px-6 py-1 rounded-md text-white text-xl"
  >
    Leaderboard
  </Link>

  <Link
    href="/buy"
    className="px-6 py-1 rounded-md text-white text-xl"
  >
    Buy
  </Link>

  {address ? (
    <div className="flex items-center gap-4 bg-gray-200 rounded-full px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-yellow-500">⭐</span>
        {/* @ts-ignore */}
        <span className="font-medium">{playerData ? Number(playerData[2]) : "0"}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>🪙</span>
        {/* @ts-ignore */}
        <span className="font-medium">{playerBalance ? formatEther(playerBalance) : 0}</span>
      </div>
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
        >
          <User size={18} className="text-gray-600" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
            <div className="py-1">
              <div className='w-full text-sm font-bold text-left px-4 py-2 text-gray-700'>
                {/* @ts-ignore */}
                <div className="pb-2 border-b">Hi, {playerData ? playerData[0] != "" ? playerData[0] : "anon" : "anon"}!</div>
              </div>
              <Link href="/profile">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    // Handle view profile
                    setIsOpen(false);
                  }}
                >
                  View Profile
                </button>
              </Link>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  // Handle disconnect
                  disconnect()
                  setIsOpen(false);
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-4 rounded-full px-4 py-2">
      <w3m-button />
    </div>
  )}
</div>
    </nav>
  );
}