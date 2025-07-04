# Gambit

A blockchain-based chess platform where players wager cryptocurrency on realtime matches with smart contract settlement.

## Overview

Gambit combines traditional chess gameplay with Web3 technology, enabling players to compete in chess matches with real financial stakes. Players can participate in ranked matches, tournaments, and private rooms, all while earning and wagering the native GBT token.

## Features

### Game Modes
- **Ranked Matches**: ELO-based rating system with mandatory wagers
- **Arena Tournaments**: Prize pool competitions with multiple participants
- **Unranked Practice**: Casual matches without stakes
- **Private Rooms**: Custom games with friends

### Blockchain Integration
- Smart contracts deployed on RISE Testnet
- Custom ERC-20 token (GBT) for in-game currency

- Player registration fee: 0.0001 ETH (grants 200 GBT tokens)
- Automatic settlement of match results and token transfers

### Realtime Features
- WebSocket-based live chess matches
- Move synchronization between players
- Cryptographic message signing for match verification
- Live capture tracking and move history

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS
- **Backend**: Node.js with Socket.IO for realtime communication
- **Blockchain**: Solidity smart contracts using Foundry
- **Chess Engine**: Chess.js with react-chessboard
- **Wallet Integration**: Wagmi/Viem for Ethereum interactions

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/gambit.git
cd gambit
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Smart Contract Deployment

The smart contracts are built with Foundry:

```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy contracts
cd contracts
forge script script/Deploy.s.sol --rpc-url <YOUR_RPC_URL> --private-key <YOUR_PRIVATE_KEY>
```

## How to Play

1. **Connect Wallet**: Connect your MetaMask wallet to get started
2. **Register**: Pay the 0.0001 ETH registration fee to receive 200 GBT tokens
3. **Choose Game Mode**: Select from ranked, arena, practice, or private rooms
4. **Place Wager**: For ranked matches, set your wager amount in GBT
5. **Play Chess**: Make moves in realtime against your opponent
6. **Win Tokens**: Victory automatically transfers opponent's wager to your account

## Project Structure

```
gambit/
   src/                    # Next.js frontend application
   server/                 # Node.js WebSocket server
   contracts/              # Solidity smart contracts
   components/             # React components
   lib/                    # Utility functions and configurations
   public/                 # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.