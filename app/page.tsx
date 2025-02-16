// app/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#594205] ">
      <div className="container mx-auto px-4 py-12  ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-[75px]">
          {/* Left side - Chessboard */}
          <div className="w-full max-w-[600px] mx-auto">
            <Chessboard 
              position={new Chess().fen()}
              boardWidth={600}
              animationDuration={0}
              arePiecesDraggable={false}
            />
          </div>

          {/* Right side - Content */}
          <div className="text-white space-y-8">
            <h1 className="text-5xl font-bold mb-6">
              Chess on the blockchain
            </h1>

            <div className="space-y-4 text-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#a77f29] rounded-full"></div>
                <p>Pure chess gameplay</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#a77f29] rounded-full"></div>
                <p>Season Leaderboards</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#a77f29] rounded-full"></div>
                <p>Unique Profile Cards</p>
              </div>
            </div>

            <p className="text-2xl font-medium text-gray-300 mt-8">
              Do you have the guts to put your crypto where your skills are?
            </p>

            <Link href="/modes">
              <Button 
                className="mt-8 bg-[#906810] hover:bg-[#A77812] text-white px-12 py-6 text-xl rounded-lg transition-all hover:scale-105"
              >
                Play Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Optional: Additional Features Section */}
      <div className="bg-[#2A1D07] py-16 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-white text-center p-6">
              <h3 className="text-2xl font-bold mb-4">Ranked Matches</h3>
              <p className="text-gray-300">Compete in different tiers and earn rewards</p>
            </div>
            <div className="text-white text-center p-6">
              <h3 className="text-2xl font-bold mb-4">Tournaments</h3>
              <p className="text-gray-300">Join weekly tournaments with prize pools</p>
            </div>
            <div className="text-white text-center p-6">
              <h3 className="text-2xl font-bold mb-4">Profile Cards</h3>
              <p className="text-gray-300">Collect and showcase unique achievements</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}