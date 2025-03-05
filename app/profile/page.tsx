'use client'
import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { GAMBIT_ABI, GAMBIT_ADDRESS, GAMBIT_TOKEN_ABI, GAMBIT_TOKEN_ADDRESS } from '@/constants';
import Link from 'next/link';

function truncateAddress(address: string) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
    const { address } = useAccount();
    const [isLoading, setIsLoading] = useState(true);

    // Get player data
    const { data: playerData, isLoading: isPlayerLoading } = useReadContract({
        abi: GAMBIT_ABI,
        address: GAMBIT_ADDRESS,
        functionName: "getFullPlayerData",
        args: [address]
    });

    // Get token balance
    const { data: playerBalance } = useReadContract({
        abi: GAMBIT_TOKEN_ABI,
        address: GAMBIT_TOKEN_ADDRESS,
        functionName: "balanceOf",
        args: [address]
    });

    const { data: matchesData } = useReadContract({
        abi: GAMBIT_ABI,
        address: GAMBIT_ADDRESS,
        functionName: "getMatchesByPlayer",
        args: [address, 0]
    })

    console.log("ye dekh match data", matchesData)



    if (!address) {
        return (
            <div className="min-h-screen bg-[#594205] pt-[100px] px-6">
                <div className="max-w-4xl mx-auto bg-[#906810] rounded-lg p-8 shadow-lg text-white text-center">
                    <h2 className="text-2xl font-bold mb-6">Please connect your wallet to view your profile</h2>
                    <div className="flex justify-center">
                        <w3m-button />
                    </div>
                </div>
            </div>
        );
    }
    //@ts-ignore
    if (playerData && (!playerData[0] || playerData[0] === "")) {
        return (
            <div className="min-h-screen bg-[#594205] pt-[100px] px-6">
                <div className="max-w-4xl mx-auto bg-[#906810] rounded-lg p-8 shadow-lg text-white text-center">
                    <h2 className="text-2xl font-bold mb-6">Please register to view your profile statistics</h2>
                    <p className="mb-6">You need to create a username to start playing and tracking your stats.</p>
                    <Link href="/register"><button
                        className="bg-[#3B2A0A] px-6 py-2 rounded-md text-white hover:bg-[#594205] transition-colors border border-[#B88A24]"
                    >
                        Register Now
                    </button>
                    </Link>
                </div>
            </div>
        );
    }


    // Extract player info from the data
    //@ts-ignore
    const username = playerData?.[0] || "anon";
    //@ts-ignore
    const rating = playerData?.[2] ? Number(playerData[2]) : 0;
    //@ts-ignore
    const formattedBalance = playerBalance ? formatEther(playerBalance) : "0";

    return (
        <div className="min-h-screen bg-[#594205] pt-[100px] px-6">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-[#906810] rounded-lg p-8 shadow-lg border-2 border-[#B88A24] mb-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-24 h-24 bg-[#3B2A0A] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                            {username.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 text-white">
                            <h1 className="text-3xl font-bold mb-2">{username}</h1>
                            <div className="text-gray-200 mb-4">{address}</div>

                            <div className="flex flex-wrap gap-6 mb-4">
                                <div className="bg-[#744D0B] px-6 py-3 rounded-lg border border-[#B88A24]">
                                    <div className="text-lg">Rating</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-500 text-2xl">⭐</span>
                                        <span className="font-bold text-xl">{rating}</span>
                                    </div>
                                </div>

                                <div className="bg-[#744D0B] px-6 py-3 rounded-lg border border-[#B88A24]">
                                    <div className="text-lg">Balance</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🪙</span>
                                        <span className="font-bold text-xl">{formattedBalance}</span>
                                    </div>
                                </div>

                                <div className="bg-[#744D0B] px-6 py-3 rounded-lg border border-[#B88A24]">
                                    <div className="text-lg">Games Played</div>
                                    {/* @ts-ignore */}
                                    <div className="font-bold text-xl">{matchesData?.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Match History */}
                <div className="bg-[#906810] rounded-lg p-8 shadow-lg border-2 border-[#B88A24]">
                    <h2 className="text-2xl font-bold mb-6 text-white">Match History</h2>
{/* @ts-ignore */}
                    {matchesData?.length === 0 ? (
                        <div className="text-white text-center py-6">
                            <p>No matches played yet.</p>
                            <button
                                onClick={() => window.location.href = '/modes'}
                                className="mt-4 bg-[#3B2A0A] px-6 py-2 rounded-md text-white hover:bg-[#594205] transition-colors border border-[#B88A24]"
                            >
                                Play Your First Game
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-white">
                                <thead className="bg-[#3B2A0A] border-b border-[#B88A24]">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Match ID</th>
                                        <th className="px-4 py-3 text-left">Opponent</th>
                                        <th className="px-4 py-3 text-left">Stake</th>
                                        <th className="px-4 py-3 text-left">Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* @ts-ignore */}
                                    {matchesData?.map((match, index) => {
                                        //@ts-ignore
                                        const isWinner = match.winnerAddress === address;

                                        console.log("match dekh:")
                                        console.log(match)
                                        //@ts-ignore
                                        const opponent = match.playerAddresses.find(a => a !== address);

                                        return (
                                            <tr key={index} className="border-b border-[#744D0B] hover:bg-[#A77812] transition-colors">
                                                {/*@ts-ignore */}
                                                <td className="px-4 py-3">{match.matchId.toString()}</td>
                                                <td className="px-4 py-3">{truncateAddress(opponent)}</td>
                                                {/*@ts-ignore*/}
                                                <td className="px-4 py-3">{Number(match.stakeAmount)} GBT</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full ${isWinner
                                                                ? 'bg-green-700 text-white'
                                                                : 'bg-red-700 text-white'
                                                            }`}
                                                    >
                                                        {isWinner ? 'Won' : 'Lost'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}