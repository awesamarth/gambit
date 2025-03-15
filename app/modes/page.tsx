// app/modes/page.tsx
'use client';

import Link from 'next/link';
import { Trophy, Sword, Target, Lock } from 'lucide-react';
import { GAMBIT_ABI, GAMBIT_ADDRESS } from '@/constants';
import { useAccount, useReadContract } from 'wagmi';
import { useEffect, useState } from 'react';

export default function ModesPage() {
    const [locked, setLocked] = useState(true);
    const { address } = useAccount();
    const [loading, setLoading] = useState(true);

    const { data: playerData } = useReadContract({
        abi: GAMBIT_ABI,
        address: GAMBIT_ADDRESS,
        functionName: "getFullPlayerData",
        args: [address],
    });

    useEffect(() => {
        if (playerData) {
            // Check if user is registered (playerData[0] is not empty)
            //@ts-ignore
            setLocked(playerData[0] === "");
            setLoading(false);
        } else if (address) {
            setLoading(false);
        } else {
            // Add this case to handle when there's no wallet connected
            setLoading(false);
        }
    }, [playerData, address]);

    // Helper function to render the appropriate link and content based on locked status
    const renderModeCard = (
        name: string,
        icon: React.ReactNode,
        description: string,
        gradient: string,
        borderColor: string,
        href: string
    ) => {
        const destination = (locked && name !== "Unranked") ? "/register" : href;

        return (
            <Link href={destination}>
                <div className={`${gradient} rounded-lg p-6 h-[300px] 
                    flex flex-col items-center justify-center gap-4
                    hover:scale-105 transition-all cursor-pointer
                    border-2 ${borderColor} shadow-lg
                    relative`}>

                    {/* Lock overlay for locked modes */}
                    {locked && name !== "Unranked" && (
                        <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center z-10">
                            <Lock className="w-12 h-12 text-white mb-2" />
                            <p className="text-white text-center font-medium">
                                Registration Required
                            </p>
                        </div>
                    )}

                    {icon}
                    <h2 className="text-2xl font-bold text-white">{name}</h2>
                    <p className="text-gray-200 text-center text-sm">
                        {description}
                    </p>
                </div>
            </Link>
        );
    };

    return (
        <main className="min-h-screen bg-[#594205] py-16">
            <div className="container mx-auto px-4 mt-[75px]">
                <h1 className="text-4xl font-bold text-white text-center mb-16">
                    Mode Selection
                </h1>

                {loading ? (
                    <div className="flex justify-center items-center h-[300px]">
                        <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {/* Ranked Mode */}
                        {renderModeCard(
                            "Ranked",
                            <Trophy className="w-16 h-16 text-yellow-400 mb-2" />,
                            "Compete for rewards and climb the leaderboard",
                            "bg-gradient-to-b from-[#906810] to-[#744D0B]",
                            "border-[#B88A24]",
                            "/modes/ranked"
                        )}

                        {/* Arena Mode */}
                        {renderModeCard(
                            "Arena",
                            <Target className="w-16 h-16 text-white mb-2" />,
                            "Tournament-style matches with prize pools",
                            "bg-gradient-to-b from-[#C4A256] to-[#9E7F36]",
                            "border-[#D4B266]",
                            "/modes/arena"
                        )}

                        {/* Unranked Mode - Always available */}
                        {renderModeCard(
                            "Unranked",
                            <Sword className="w-16 h-16 text-gray-300 mb-2" />,
                            "Practice matches with no stakes",
                            "bg-gradient-to-b from-[#363636] to-[#2A2A2A]",
                            "border-gray-600",
                            "/modes/unranked"
                        )}

                        {/* Private Room */}
                        {renderModeCard(
                            "Private Room",
                            <Lock className="w-16 h-16 text-gray-300 mb-2" />,
                            "Create or join private matches",
                            "bg-gradient-to-b from-[#363636] to-[#2A2A2A]",
                            "border-gray-600",
                            "/modes/private"
                        )}
                    </div>
                )}

                {locked && !loading && (
                    <div className="mt-8 text-center text-white">
                        <p className="mb-4">You need to register to access Ranked, Arena and Private modes</p>
                        <Link href="/register">
                            <button className="bg-[#B88A24] hover:bg-[#D4B266] text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                Register Now
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}