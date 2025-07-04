'use client'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Zap, Shield, Crown } from 'lucide-react';

export default function AIModePage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const router = useRouter();

  const difficulties = [
    {
      id: 'easy',
      name: 'Easy',
      icon: <Bot className="w-8 h-8 text-green-400" />,
      description: 'Perfect for beginners and learning',
      color: 'border-green-400 bg-green-400/10',
      textColor: 'text-green-400'
    },
    {
      id: 'medium',
      name: 'Medium', 
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      description: 'Balanced challenge for improving players',
      color: 'border-yellow-400 bg-yellow-400/10',
      textColor: 'text-yellow-400'
    },
    {
      id: 'hard',
      name: 'Hard',
      icon: <Crown className="w-8 h-8 text-red-400" />,
      description: 'Tough opponent for experienced players',
      color: 'border-red-400 bg-red-400/10', 
      textColor: 'text-red-400'
    }
  ];

  const startGame = () => {
    // Navigate to AI game with selected difficulty as query param
    router.push(`/play/ai?difficulty=${selectedDifficulty}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b pt-12 from-[#594205] to-[#352702] text-white flex items-center justify-center">
      <div className="container max-w-md px-4 py-8">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300 tracking-wide">
            Versus AI Mode
          </h1>

          <Card className="w-full bg-[#1F1A0E] border border-amber-900/50 rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 space-y-6">
              
              <div className="text-center p-4 bg-amber-900/20 rounded-lg">
                <Shield className="w-6 h-6 text-amber-200 mx-auto mb-2" />
                <p className="text-amber-200 mb-1 font-medium">Unranked Practice</p>
                <p className="text-sm text-amber-200/70">No tokens required • No registration needed • Match history not recorded</p>
              </div>

              <div className="space-y-3">
                <Label className="text-amber-200 text-sm">Select Difficulty</Label>
                
                {difficulties.map((difficulty) => (
                  <div
                    key={difficulty.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDifficulty === difficulty.id
                        ? difficulty.color
                        : 'border-gray-600 bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => setSelectedDifficulty(difficulty.id as 'easy' | 'medium' | 'hard')}
                  >
                    <div className="flex items-center space-x-3">
                      {difficulty.icon}
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-lg ${
                          selectedDifficulty === difficulty.id 
                            ? difficulty.textColor 
                            : 'text-white'
                        }`}>
                          {difficulty.name}
                        </div>
                        <div className="text-sm text-gray-300">
                          {difficulty.description}
                        </div>
                      </div>
                      <div className="w-4 h-4 flex-shrink-0">
                        {selectedDifficulty === difficulty.id && (
                          <div className={`w-4 h-4 rounded-full ${difficulty.color.split(' ')[1]}`} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={startGame}
                className="w-full py-6 text-lg font-bold mt-6 bg-amber-600 hover:bg-amber-500 transition-all duration-200"
              >
                Start Game
              </Button>

              <p className="text-center text-sm text-amber-200/70 mt-2">
                Play against AI • No stakes • Pure practice
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}