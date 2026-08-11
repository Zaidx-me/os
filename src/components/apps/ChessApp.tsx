"use client";

import { Chess, DEFAULT_POSITION, type Color, type PieceSymbol, type Square } from "chess.js";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CPU_THINK_MS,
  getGameStatus,
  pickCpuMove,
  tryMove,
  type GameStatus,
} from "@/lib/chess/engine";

type GameMode = "hotseat" | "cpu";

type Captured = Record<Color, PieceSymbol[]>;

type GameState = {
  fen: string;
  history: string[];
  captured: Captured;
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

const GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

function emptyGame(): GameState {
  return { fen: DEFAULT_POSITION, history: [], captured: { w: [], b: [] } };
}

function pieceGlyph(color: Color, type: PieceSymbol): string {
  return GLYPHS[color][type];
}

function formatHistory(history: string[]): string {
  const pairs: string[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    const white = history[i];
    const black = history[i + 1];
    pairs.push(black ? `${num}. ${white} ${black}` : `${num}. ${white}`);
  }
  return pairs.join("  ");
}

function bannerMessage(status: GameStatus, thinking: boolean): string | null {
  if (thinking) return "Rookie CPU is thinking…";
  switch (status.kind) {
    case "checkmate":
      return `Checkmate — ${status.winner === "w" ? "White" : "Black"} wins`;
    case "stalemate":
      return "Stalemate — draw";
    case "draw":
      return "Draw";
    case "playing":
      return status.inCheck ? "Check!" : null;
  }
}

function applyMoveToState(prev: GameState, move: ReturnType<Chess["move"]>): GameState {
  if (!move) return prev;
  const captured: Captured = {
    w: [...prev.captured.w],
    b: [...prev.captured.b],
  };
  if (move.captured) {
    captured[move.color] = [...captured[move.color], move.captured];
  }
  return {
    fen: move.after,
    history: [...prev.history, move.san],
    captured,
  };
}

export function ChessApp() {
  const [mode, setMode] = useState<GameMode>("hotseat");
  const [flipped, setFlipped] = useState(false);
  const [game, setGame] = useState<GameState>(emptyGame);
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);

  const chess = useMemo(() => new Chess(game.fen), [game.fen]);
  const status = useMemo(() => getGameStatus(chess), [chess]);
  const gameOver = status.kind !== "playing";
  const turn = chess.turn();
  const thinking = mode === "cpu" && !gameOver && turn === "b";
  const banner = bannerMessage(status, thinking);

  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = flipped ? [...FILES].reverse() : FILES;

  const clearSelection = useCallback(() => {
    setSelected(null);
    setLegalTargets([]);
  }, []);

  const startNewGame = useCallback(() => {
    setGame(emptyGame());
    clearSelection();
  }, [clearSelection]);

  const selectSquare = useCallback(
    (square: Square) => {
      const board = new Chess(game.fen);
      const piece = board.get(square);
      if (!piece || piece.color !== board.turn()) {
        clearSelection();
        return;
      }
      if (mode === "cpu" && piece.color !== "w") {
        clearSelection();
        return;
      }
      const moves = board.moves({ square, verbose: true });
      setSelected(square);
      setLegalTargets(moves.map((m) => m.to));
    },
    [clearSelection, game.fen, mode],
  );

  const playMove = useCallback(
    (from: Square, to: Square) => {
      setGame((prev) => {
        const board = new Chess(prev.fen);
        const move = tryMove(board, from, to);
        if (!move) return prev;
        return applyMoveToState(prev, move);
      });
      clearSelection();
    },
    [clearSelection],
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (gameOver || thinking) return;
      if (mode === "cpu" && turn !== "w") return;

      if (selected) {
        if (legalTargets.includes(square)) {
          playMove(selected, square);
          return;
        }
        if (square === selected) {
          clearSelection();
          return;
        }
      }

      selectSquare(square);
    },
    [
      clearSelection,
      gameOver,
      legalTargets,
      mode,
      playMove,
      selectSquare,
      selected,
      thinking,
      turn,
    ],
  );

  useEffect(() => {
    if (mode !== "cpu" || gameOver) return;
    const board = new Chess(game.fen);
    if (board.turn() !== "b") return;

    const fenSnapshot = game.fen;
    const timer = window.setTimeout(() => {
      setGame((prev) => {
        if (prev.fen !== fenSnapshot) return prev;
        const cpuBoard = new Chess(prev.fen);
        const move = pickCpuMove(cpuBoard);
        if (!move) return prev;
        return applyMoveToState(prev, move);
      });
    }, CPU_THINK_MS);

    return () => window.clearTimeout(timer);
  }, [game.fen, gameOver, mode]);

  return (
    <div
      data-testid="app-content-chess"
      className="h-full w-full overflow-y-auto bg-zaid-surface"
    >
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-sans text-lg font-semibold text-zaid-text">Chess</h1>
              <p className="font-mono text-xs text-zaid-muted">
                {mode === "cpu" ? "vs Rookie CPU" : "Hot-seat"} ·{" "}
                {turn === "w" ? "White" : "Black"} to move
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="chess-mode-hotseat"
                onClick={() => {
                  setMode("hotseat");
                  startNewGame();
                }}
                className={`hairline rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                  mode === "hotseat"
                    ? "border-zaid-accent text-zaid-accent"
                    : "text-zaid-text hover:border-zaid-accent hover:text-zaid-accent"
                }`}
              >
                Hot-seat
              </button>
              <button
                type="button"
                data-testid="chess-mode-cpu"
                onClick={() => {
                  setMode("cpu");
                  startNewGame();
                }}
                className={`hairline rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                  mode === "cpu"
                    ? "border-zaid-accent text-zaid-accent"
                    : "text-zaid-text hover:border-zaid-accent hover:text-zaid-accent"
                }`}
              >
                vs Rookie CPU
              </button>
              <button
                type="button"
                data-testid="chess-new-game"
                onClick={startNewGame}
                className="hairline rounded-lg px-3 py-1.5 font-mono text-xs text-zaid-text transition-colors hover:border-zaid-accent hover:text-zaid-accent"
              >
                New game
              </button>
              <button
                type="button"
                data-testid="chess-flip-board"
                onClick={() => setFlipped((f) => !f)}
                className="hairline rounded-lg px-3 py-1.5 font-mono text-xs text-zaid-text transition-colors hover:border-zaid-accent hover:text-zaid-accent"
              >
                Flip board
              </button>
            </div>
          </header>

          {banner ? (
            <div
              data-testid="chess-banner"
              className={`hairline rounded-lg px-3 py-2 font-mono text-xs ${
                status.kind === "checkmate"
                  ? "border-zaid-accent text-zaid-accent"
                  : status.kind === "playing" && status.inCheck
                    ? "border-zaid-accent2 text-zaid-accent2"
                    : "text-zaid-text"
              }`}
            >
              {banner}
            </div>
          ) : null}

          <div
            data-testid="chess-board"
            className="mx-auto grid aspect-square w-full max-w-md grid-cols-8 grid-rows-8 hairline overflow-hidden rounded-lg"
          >
            {displayRanks.map((rank) =>
              displayFiles.map((file) => {
                const square = `${file}${rank}` as Square;
                const fileIdx = FILES.indexOf(file);
                const rankIdx = Number(rank);
                const isLight = (fileIdx + rankIdx) % 2 === 0;
                const piece = chess.get(square);
                const isSelected = selected === square;
                const isTarget = legalTargets.includes(square);

                return (
                  <button
                    key={square}
                    type="button"
                    data-testid={`chess-square-${square}`}
                    aria-label={piece ? `${piece.color} ${piece.type} on ${square}` : square}
                    disabled={gameOver || thinking || (mode === "cpu" && turn !== "w")}
                    onClick={() => handleSquareClick(square)}
                    className={`relative flex items-center justify-center font-mono text-2xl sm:text-3xl transition-colors disabled:cursor-default ${
                      isLight ? "bg-zaid-surface2" : "bg-zaid-border/50"
                    } ${isSelected ? "ring-2 ring-inset ring-zaid-accent" : ""} ${
                      !gameOver && !thinking ? "hover:brightness-110" : ""
                    }`}
                  >
                    {piece ? (
                      <span
                        className={
                          piece.color === "w" ? "text-zaid-text" : "text-zaid-muted"
                        }
                      >
                        {pieceGlyph(piece.color, piece.type)}
                      </span>
                    ) : null}
                    {isTarget ? (
                      <span
                        data-testid={`chess-target-${square}`}
                        className={`absolute rounded-full bg-zaid-accent/70 ${
                          piece ? "h-3 w-3" : "h-3.5 w-3.5"
                        }`}
                      />
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-56">
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
              Captured
            </h2>
            <div className="hairline flex min-h-10 flex-wrap items-center gap-1 rounded-lg p-2 font-mono text-lg">
              {[...game.captured.w, ...game.captured.b].length === 0 ? (
                <span className="font-mono text-xs text-zaid-muted">—</span>
              ) : (
                <>
                  {game.captured.w.map((type, i) => (
                    <span key={`cw-${type}-${i}`} className="text-zaid-muted">
                      {pieceGlyph("b", type)}
                    </span>
                  ))}
                  {game.captured.b.map((type, i) => (
                    <span key={`cb-${type}-${i}`} className="text-zaid-text">
                      {pieceGlyph("w", type)}
                    </span>
                  ))}
                </>
              )}
            </div>
            <p className="font-mono text-[10px] text-zaid-muted">
              Left: taken by White · Right tone: taken by Black
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
              Moves
            </h2>
            <div
              data-testid="chess-move-history"
              className="hairline max-h-48 overflow-y-auto rounded-lg p-3 font-mono text-xs leading-relaxed text-zaid-text"
            >
              {game.history.length === 0 ? (
                <span className="text-zaid-muted">No moves yet</span>
              ) : (
                formatHistory(game.history)
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ChessApp;
