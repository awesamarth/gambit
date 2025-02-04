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

    function isValidMove(
        fromRank: number, fromFile: number, toRank: number, toFile: number, boardPosition = position): boolean {
        const piece = boardPosition[fromRank][fromFile];
        const targetSquare = boardPosition[toRank][toFile];

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
                        if (boardPosition[fromRank][file] !== '') {
                            return false;
                        }
                    }
                } else {
                    // Vertical movement
                    const start = Math.min(fromRank, toRank);
                    const end = Math.max(fromRank, toRank);
                    for (let rank = start + 1; rank < end; rank++) {
                        if (boardPosition[rank][fromFile] !== '') {
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
                    !boardPosition[fromRank + direction][fromFile]) { // checking if the square in between is empty
                    return true;
                }

                // Capture diagonally
                if (Math.abs(fromFile - toFile) === 1 && toRank === fromRank + direction &&
                    targetSquare && targetSquare[0] !== piece[0]) {
                    return true;
                }

                return false;

            case 'h': // Knight 
                // Knights move in L-shape: 2 squares in one direction and 1 square perpendicular
                const knightMoves = [
                    { rankDiff: 2, fileDiff: 1 },
                    { rankDiff: 2, fileDiff: -1 },
                    { rankDiff: -2, fileDiff: 1 },
                    { rankDiff: -2, fileDiff: -1 },
                    { rankDiff: 1, fileDiff: 2 },
                    { rankDiff: 1, fileDiff: -2 },
                    { rankDiff: -1, fileDiff: 2 },
                    { rankDiff: -1, fileDiff: -2 }
                ];
                return knightMoves.some(move =>
                    toRank === fromRank + move.rankDiff &&
                    toFile === fromFile + move.fileDiff
                );

            case 'b': // Bishop
                // Must move diagonally
                if (Math.abs(toRank - fromRank) !== Math.abs(toFile - fromFile)) {
                    return false;
                }

                // Check if path is clear
                const rankDir = toRank > fromRank ? 1 : -1;
                const fileDir = toFile > fromFile ? 1 : -1;
                for (let i = 1; i < Math.abs(toRank - fromRank); i++) {
                    if (boardPosition[fromRank + (i * rankDir)][fromFile + (i * fileDir)] !== '') {
                        return false;
                    }
                }
                return true;

            case 'q': // Queen
                // Queen combines rook and bishop movements
                if (fromRank === toRank || fromFile === toFile) {
                    // Horizontal/vertical movement (like rook)
                    if (fromRank === toRank) {
                        const start = Math.min(fromFile, toFile);
                        const end = Math.max(fromFile, toFile);
                        for (let file = start + 1; file < end; file++) {
                            if (boardPosition[fromRank][file] !== '') {
                                return false;
                            }
                        }
                    } else {
                        const start = Math.min(fromRank, toRank);
                        const end = Math.max(fromRank, toRank);
                        for (let rank = start + 1; rank < end; rank++) {
                            if (boardPosition[rank][fromFile] !== '') {
                                return false;
                            }
                        }
                    }
                    return true;
                } else if (Math.abs(toRank - fromRank) === Math.abs(toFile - fromFile)) {
                    // Diagonal movement (like bishop)
                    const rankDir = toRank > fromRank ? 1 : -1;
                    const fileDir = toFile > fromFile ? 1 : -1;
                    for (let i = 1; i < Math.abs(toRank - fromRank); i++) {
                        if (boardPosition[fromRank + (i * rankDir)][fromFile + (i * fileDir)] !== '') {
                            return false;
                        }
                    }
                    return true;
                }
                return false;

            case 'k': // King
                // King moves one square in any direction
                const rankDiff = Math.abs(toRank - fromRank);
                const fileDiff = Math.abs(toFile - fromFile);
                return rankDiff <= 1 && fileDiff <= 1;

            default:
                return false;
        }
    }


    function calculateValidMoves(rank: number, file: number) {
        const validSquares = [];
        const piece = position[rank][file];


        if (piece[1] === 'r') { // Rook moves
            // Check horizontal and vertical directions
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            directions.forEach(([rankDir, fileDir]) => {
                let r = rank + rankDir;
                let f = file + fileDir;
                while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    if (isValidMove(rank, file, r, f)) {
                        validSquares.push({ rank: r, file: f });
                        if (position[r][f] !== '') break; // Stop if we hit a piece
                    }
                    r += rankDir;
                    f += fileDir;
                }
            });
        }

        else if (piece[1] === 'q') { // Queen moves (combining straight and diagonal)
            // Straight moves
            const straightDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            // Diagonal moves
            const diagonalDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

            // Combine both direction sets for queen
            const allDirections = [...straightDirections, ...diagonalDirections];

            allDirections.forEach(([rankDir, fileDir]) => {
                let r = rank + rankDir;
                let f = file + fileDir;
                while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    if (isValidMove(rank, file, r, f)) {
                        validSquares.push({ rank: r, file: f });
                        if (position[r][f] !== '') break; // Stop if we hit a piece
                    }
                    r += rankDir;
                    f += fileDir;
                }
            });
        }

        else if (piece[1] === 'b') { // Bishop moves
            const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
            directions.forEach(([rankDir, fileDir]) => {
                let r = rank + rankDir;
                let f = file + fileDir;
                while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    if (isValidMove(rank, file, r, f)) {
                        validSquares.push({ rank: r, file: f });
                        if (position[r][f] !== '') break; // Stop if we hit a piece
                    }
                    r += rankDir;
                    f += fileDir;
                }
            });
        }

        else if (piece[1] === 'k') { // King
            for (let r = -1; r <= 1; r++) {
                for (let f = -1; f <= 1; f++) {
                    if (r === 0 && f === 0) continue;
                    const newRank = rank + r;
                    const newFile = file + f;
                    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8 &&
                        isValidMove(rank, file, newRank, newFile)) {
                        validSquares.push({ rank: newRank, file: newFile });
                    }
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

        else if (piece[1] === 'h') { // Knight
            const knightMoves = [
                { rank: rank + 2, file: file + 1 },
                { rank: rank + 2, file: file - 1 },
                { rank: rank - 2, file: file + 1 },
                { rank: rank - 2, file: file - 1 },
                { rank: rank + 1, file: file + 2 },
                { rank: rank + 1, file: file - 2 },
                { rank: rank - 1, file: file + 2 },
                { rank: rank - 1, file: file - 2 }
            ];

            knightMoves.forEach(move => {
                if (move.rank >= 0 && move.rank < 8 && move.file >= 0 && move.file < 8 &&
                    isValidMove(rank, file, move.rank, move.file)) {
                    validSquares.push(move);
                }
            });
        }



        return validSquares.filter(move => {
            const testPosition = position.map(row => [...row]);
            testPosition[move.rank][move.file] = testPosition[rank][file];
            testPosition[rank][file] = '';
            return !isKingInCheck(turn, testPosition);
        });
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
            // Move the piece if valid
            if (isValidMove(selectedPiece.rank, selectedPiece.file, rank, file)) {
                // Create a test position to check if move would put/leave king in check
                const testPosition = position.map(row => [...row]);
                testPosition[rank][file] = testPosition[selectedPiece.rank][selectedPiece.file];
                testPosition[selectedPiece.rank][selectedPiece.file] = '';
    
                // Check if the move would put/leave own king in check
                if (!isKingInCheck(turn, testPosition)) {
                    // Execute the move
                    const newPosition = position.map(row => [...row]);
                    newPosition[rank][file] = position[selectedPiece.rank][selectedPiece.file];
                    newPosition[selectedPiece.rank][selectedPiece.file] = '';
                    setPosition(newPosition);
    
                    // Check if opponent's king is in check after the move
                    const nextTurn = turn === 'w' ? 'b' : 'w';
                    const isCheck = isKingInCheck(nextTurn, newPosition);
                    if (isCheck) {
                        console.log('Check!');
                    }
    
                    setTurn(nextTurn);
                } else {
                    console.log('Invalid move: Would put/leave king in check');
                }
            }
            setSelectedPiece(null);
            setValidMoves([]);
        }
    };

    function findKing(color: 'w' | 'b',  boardPosition = position): { rank: number, file: number } | null {
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const piece = boardPosition[rank][file];
                if (piece && piece[0] === color && piece[1] === 'k') {
                    return { rank, file };
                }
            }
        }
        return null;
    }

    function isKingInCheck(color: 'w' | 'b', boardPosition = position): boolean {
        const king = findKing(color, boardPosition);
        if (!king) return false;

        // Check if any opponent piece can capture the king
        const opponentColor = color === 'w' ? 'b' : 'w';

        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const piece = boardPosition[rank][file];
                if (piece && piece[0] === opponentColor) {
                    if (isValidMove(rank, file, king.rank, king.file, boardPosition)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }


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