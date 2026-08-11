import {
  Chess,
  DEFAULT_POSITION,
  type Color,
  type Move,
  type PieceSymbol,
  type Square,
} from "chess.js";

/** Material values for minimax leaf evaluation (centipawn-ish scale). */
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const CPU_DEPTH = 2;
export const CPU_THINK_MS = 500;

const MATE_SCORE = 10_000;

/** Eval from White's perspective (positive = White ahead). */
export function evaluateMaterial(chess: Chess): number {
  let score = 0;
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      const value = PIECE_VALUES[cell.type];
      score += cell.color === "w" ? value : -value;
    }
  }
  return score;
}

function terminalEval(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === "w" ? -MATE_SCORE : MATE_SCORE;
  }
  return evaluateMaterial(chess);
}

/** Minimax with fixed depth; `maximizing` = maximizing White's eval. */
function minimax(chess: Chess, depth: number, maximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) {
    return terminalEval(chess);
  }

  const moves = chess.moves();
  if (moves.length === 0) return terminalEval(chess);

  if (maximizing) {
    let best = -Infinity;
    for (const san of moves) {
      chess.move(san);
      best = Math.max(best, minimax(chess, depth - 1, false));
      chess.undo();
    }
    return best;
  }

  let best = Infinity;
  for (const san of moves) {
    chess.move(san);
    best = Math.min(best, minimax(chess, depth - 1, true));
    chess.undo();
  }
  return best;
}

/** Pick a move for the side to move; random tie-break among equal evals. */
export function pickCpuMove(chess: Chess): Move | null {
  const candidates = chess.moves({ verbose: true });
  if (candidates.length === 0) return null;

  const maximizing = chess.turn() === "w";
  let bestEval = maximizing ? -Infinity : Infinity;
  let bestMoves: Move[] = [];

  for (const move of candidates) {
    chess.move(move);
    const score = minimax(chess, CPU_DEPTH - 1, !maximizing);
    chess.undo();

    const better = maximizing ? score > bestEval : score < bestEval;
    const equal = score === bestEval;

    if (better) {
      bestEval = score;
      bestMoves = [move];
    } else if (equal) {
      bestMoves.push(move);
    }
  }

  if (bestMoves.length === 0) return null;
  return bestMoves[Math.floor(Math.random() * bestMoves.length)]!;
}

/** Apply a move if legal; auto-queen on promotion. Returns null when rejected. */
export function tryMove(
  chess: Chess,
  from: Square,
  to: Square,
  promotion: PieceSymbol = "q",
): Move | null {
  const legal = chess.moves({ square: from, verbose: true });
  if (!legal.some((m) => m.to === to)) return null;

  try {
    return chess.move({ from, to, promotion });
  } catch {
    return null;
  }
}

export type GameStatus =
  | { kind: "playing"; inCheck: boolean }
  | { kind: "checkmate"; winner: Color }
  | { kind: "stalemate" }
  | { kind: "draw" };

export function getGameStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    return { kind: "checkmate", winner: chess.turn() === "w" ? "b" : "w" };
  }
  if (chess.isStalemate()) return { kind: "stalemate" };
  if (chess.isDraw()) return { kind: "draw" };
  return { kind: "playing", inCheck: chess.inCheck() };
}

export function createGame(fen: string = DEFAULT_POSITION): Chess {
  return new Chess(fen);
}
