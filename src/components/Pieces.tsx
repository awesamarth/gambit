'use client'

import Image from "next/image";
import { useState } from "react";

export default function Pieces() {
    const INITIAL_POSITION = [
        ['br', 'bh', 'bb', 'bq', 'bk', 'bb', 'bh', 'br'],
        ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
        ['wr', 'wh', 'wb', 'wq', 'wk', 'wb', 'wh', 'wr']
    ];
    const [selectedPiece, setSelectedPiece] = useState<{ rank: number, file: number } | null>(null);
    const [position, setPosition] = useState(INITIAL_POSITION);
    const [turn, setTurn] = useState<'w' | 'b'>('w'); // white starts
    const [validMoves, setValidMoves] = useState<{ rank: number, file: number }[]>([]);


    function calculateValidMoves(rank: number, file: number) {
        const validSquares = [];
        const piece = position[rank][file];

        if (piece[1] === 'r') {  // For Rook
            // Check horizontal moves
            for (let f = 0; f < 8; f++) {
                if (isValidMove(rank, file, rank, f)) {
                    validSquares.push({ rank, file: f });
                }
            }
            // Check vertical moves
            for (let r = 0; r < 8; r++) {
                if (isValidMove(rank, file, r, file)) {
                    validSquares.push({ rank: r, file });
                }
            }
        }
        else if (piece[1] === 'p') {  // For Pawn
            const direction = piece[0] === 'w' ? -1 : 1;

            // Check forward moves
            if (isValidMove(rank, file, rank + direction, file)) {
                validSquares.push({ rank: rank + direction, file });
            }

            // Check two-square first move
            const startRank = piece[0] === 'w' ? 6 : 1;
            if (rank === startRank && isValidMove(rank, file, rank + (2 * direction), file)) {
                validSquares.push({ rank: rank + (2 * direction), file });
            }

            // Check diagonal captures
            const captureMoves = [
                { rank: rank + direction, file: file - 1 },
                { rank: rank + direction, file: file + 1 }
            ];

            for (const move of captureMoves) {
                if (move.file >= 0 && move.file < 8 && // Check if within board
                    move.rank >= 0 && move.rank < 8 &&
                    isValidMove(rank, file, move.rank, move.file)) {
                    validSquares.push(move);
                }
            }
        }

        return validSquares;
    }


    function isValidMove(
        fromRank: number,
        fromFile: number,
        toRank: number,
        toFile: number
    ): boolean {
        const piece = position[fromRank][fromFile];
        const targetSquare = position[toRank][toFile];

        // Can't capture your own pieces
        if (targetSquare && targetSquare[0] === piece[0]) {
            return false;
        }

        // Identify piece type
        const pieceType = piece[1];

        switch (pieceType) {
            case 'r': // Rook
                // Must move either horizontally or vertically
                if (fromRank !== toRank && fromFile !== toFile) {
                    return false;
                }

                // Check if path is clear
                if (fromRank === toRank) {
                    // Horizontal movement
                    const start = Math.min(fromFile, toFile);
                    const end = Math.max(fromFile, toFile);
                    for (let file = start + 1; file < end; file++) {
                        if (position[fromRank][file] !== '') {
                            return false;
                        }
                    }
                } else {
                    // Vertical movement
                    const start = Math.min(fromRank, toRank);
                    const end = Math.max(fromRank, toRank);
                    for (let rank = start + 1; rank < end; rank++) {
                        if (position[rank][fromFile] !== '') {
                            return false;
                        }
                    }
                }
                return true;


            case 'p': // Pawn
                const direction = piece[0] === 'w' ? -1 : 1; // white moves up (-), black moves down (+)

                // Normal one square forward move
                if (fromFile === toFile && toRank === fromRank + direction && !targetSquare) {
                    return true;
                }

                // First move - can move two squares
                const startRank = piece[0] === 'w' ? 6 : 1; // white starts on rank 6, black on rank 1
                if (fromFile === toFile && fromRank === startRank &&
                    toRank === fromRank + (2 * direction) && !targetSquare &&
                    !position[fromRank + direction][fromFile]) { // checking if the square in between is empty
                    return true;
                }

                // Capture diagonally
                if (Math.abs(fromFile - toFile) === 1 && toRank === fromRank + direction &&
                    targetSquare && targetSquare[0] !== piece[0]) {
                    return true;
                }

                return false;
            default:
                return false;
        }
    }

    function handlePieceClick(rank: number, file: number) {
        const piece = position[rank][file];
        console.log('Clicked piece:', piece, 'at', rank, file);


        // If no piece is selected and clicked on a piece of current turn's color
        if (!selectedPiece && piece && piece[0] === turn) {
            setSelectedPiece({ rank, file });
            const moves = calculateValidMoves(rank, file);
            setValidMoves(moves);
            console.log('Valid moves:', moves);
            return;
        }

        // If a piece is selected and clicking on a different square
        if (selectedPiece) {
            console.log('Attempting move from', selectedPiece, 'to', rank, file);
            // Move the piece if valid
            if (isValidMove(selectedPiece.rank, selectedPiece.file, rank, file)) {
                console.log('Move is valid!');
                const newPosition = position.map(row => [...row]);
                newPosition[rank][file] = position[selectedPiece.rank][selectedPiece.file];
                newPosition[selectedPiece.rank][selectedPiece.file] = '';
                setPosition(newPosition);
                setTurn(turn === 'w' ? 'b' : 'w');
            } else {
                console.log('Move is invalid!');
            }
            setSelectedPiece(null);
            setValidMoves([]);
        }
    };


    return (
        <div className="pieces absolute top-0 left-[1.15rem]">
            {position.map((row, rank) => (
                row.map((piece, file) => (
                    <div
                        key={`${rank}-${file}`}
                        className={`absolute flex items-center justify-center cursor-pointer
                            ${selectedPiece?.rank === rank && selectedPiece?.file === file
                                ? 'bg-yellow-200 opacity-50'
                                : ''}
                            ${validMoves.some(move => move.rank === rank && move.file === file)
                                ? 'bg-green-200 opacity-50'
                                : ''}
                        `}
                        style={{
                            top: `${rank * 5}rem`,
                            left: `${file * 5}rem`,
                            width: '5rem',
                            height: '5rem',
                        }}
                        onClick={() => handlePieceClick(rank, file)}
                    >
                        {piece && (
                            <Image
                                src={`/pieces/${piece}.png`}
                                alt={piece}
                                width={75}
                                height={75}
                                className="object-contain"
                                priority
                            />
                        )}
                    </div>
                ))
            ))}
        </div>
    );
}