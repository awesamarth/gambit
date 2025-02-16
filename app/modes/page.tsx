// app/modes/page.tsx
'use client';

import Link from 'next/link';
import { Trophy, Sword, Target, Lock } from 'lucide-react';

export default function ModesPage() {
    return (
        <main className="min-h-screen bg-[#594205]  py-16">
            <div className="container mx-auto px-4 mt-[75px]">
                <h1 className="text-4xl font-bold text-white text-center mb-16">
                    Mode Selection
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                    {/* Ranked Mode */}
                    <Link href="/play/ranked">
                        <div className="bg-gradient-to-b from-[#906810] to-[#744D0B] rounded-lg p-6 h-[300px] 
                          flex flex-col items-center justify-center gap-4
                          hover:scale-105 transition-all cursor-pointer
                          border-2 border-[#B88A24] shadow-lg">
                            <Trophy className="w-16 h-16 text-yellow-400 mb-2" />
                            <h2 className="text-2xl font-bold text-white">Ranked</h2>
                            <p className="text-gray-200 text-center text-sm">
                                Compete for rewards and climb the leaderboard
                            </p>
                        </div>
                    </Link>
                    {/* Arena Mode */}
                    <Link href="/play/arena">
                        <div className="bg-gradient-to-b from-[#C4A256] to-[#9E7F36] rounded-lg p-6 h-[300px] 
                          flex flex-col items-center justify-center gap-4
                          hover:scale-105 transition-all cursor-pointer
                          border-2 border-[#D4B266] shadow-lg">
                            <Target className="w-16 h-16 text-white mb-2" />
                            <h2 className="text-2xl font-bold text-white">Arena</h2>
                            <p className="text-gray-200 text-center text-sm">
                                Tournament-style matches with prize pools
                            </p>
                        </div>
                    </Link>

                    {/* Unranked Mode */}
                    <Link href="/play/unranked">
                        <div className="bg-gradient-to-b from-[#363636] to-[#2A2A2A] rounded-lg p-6 h-[300px] 
                          flex flex-col items-center justify-center gap-4
                          hover:scale-105 transition-all cursor-pointer
                          border-2 border-gray-600 shadow-lg">
                            <Sword className="w-16 h-16 text-gray-300 mb-2" />
                            <h2 className="text-2xl font-bold text-white">Unranked</h2>
                            <p className="text-gray-200 text-center text-sm">
                                Practice matches with no stakes
                            </p>
                        </div>
                    </Link>



                    {/* Private Room */}
                    <Link href="/play/private">
                        <div className="bg-gradient-to-b from-[#363636] to-[#2A2A2A] rounded-lg p-6 h-[300px] 
                          flex flex-col items-center justify-center gap-4
                          hover:scale-105 transition-all cursor-pointer
                          border-2 border-gray-600 shadow-lg">
                            <Lock className="w-16 h-16 text-gray-300 mb-2" />
                            <h2 className="text-2xl font-bold text-white">Private Room</h2>
                            <p className="text-gray-200 text-center text-sm">
                                Create or join private matches
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    );
}