'use client'
// components/Navbar.tsx
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';

export default function Navbar() {
  const {address} = useAccount()

  console.log(address)
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
      <div className="flex items-center gap-8  rounded-full  py-2">
      <Link 
          href="/modes" 
          className="bg-[#906810] px-6 py-1 rounded-md text-white text-xl hover:bg-[#A77812] transition-colors"
        >
          Play
        </Link>
        <Link 
          href="/leaderboard" 
          className="text-white text-xl hover:text-gray-200 transition-colors"
        >
          Leaderboard
        </Link>

        {address?
        (
          <div className="flex items-center gap-4 bg-gray-200 rounded-full px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">⭐</span>
          <span className="font-medium">1103</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🪙</span>
          <span className="font-medium">100</span>
        </div>
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
        </div>
        ):(
        <div className="flex items-center gap-4 rounded-full px-4 py-2">
        <w3m-button />
        </div>

        )}
        


      </div>
    </nav>
  );
}