import ChessGame from '@/components/ChessGame';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">WebSocket Chess</h1>
        <ChessGame />
      </div>
    </div>
  );
}