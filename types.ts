export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface SquareInfo {
  square: string;
  type: PieceType;
  color: PieceColor;
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
  san?: string; // Standard Algebraic Notation
}

export interface SavedGame {
  id: string;
  name: string;
  date: number;
  pgn: string; // Portable Game Notation (Stores moves & history)
  whiteName: string;
  blackName: string;
  whiteTime: number;
  blackTime: number;
  initialTime: number;
}

export type BoardState = (SquareInfo | null)[][];