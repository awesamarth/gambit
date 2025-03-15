export default function Leaderboard() {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#594205] to-[#352702] text-white flex items-center justify-center pt-12">
        <div className="container max-w-4xl px-4 py-8">
          <div className="flex flex-col items-center">
            <div className="text-6xl mb-6">🏆</div>
            <h1 className="text-4xl font-bold mb-8 text-center text-amber-300 tracking-wide">
              Leaderboard Coming Soon
            </h1>
            <div className="w-full max-w-md bg-[#1F1A0E] border border-amber-900/50 rounded-xl shadow-xl overflow-hidden mb-8 p-6">
              <p className="text-amber-200 mb-6 text-center">
                We're working hard to bring you the ultimate chess ranking experience. Check back later to see where you stand!
              </p>
              <div className="flex justify-center">
                <a 
                  href="/modes" 
                  className="text-amber-300 hover:text-amber-200 font-medium transition-colors"
                >
                  ← Back to Game
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }