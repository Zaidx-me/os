import { Chess, DEFAULT_POSITION } from "chess.js";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Standard Staunton Unicode pieces — consistent across platforms, fixed size in CSS. */
const GLYPHS = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

const PUZZLES = [
  {
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    title: "Back-rank mate",
    hint: "Find the back-rank checkmate in one.",
    solution: "Re8#",
  },
  {
    fen: "6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
    title: "Queen delivery",
    hint: "Deliver mate with the queen.",
    solution: "Qe8#",
  },
];

const MODES = [
  { id: "cpu", label: "vs CPU" },
  { id: "hotseat", label: "2-player" },
  { id: "puzzle", label: "Puzzle" },
];

function dailyPuzzle() {
  const day = Math.floor(Date.now() / 86_400_000);
  return PUZZLES[day % PUZZLES.length];
}

function evalBoard(chess) {
  const vals = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let s = 0;
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      s += (cell.color === "w" ? 1 : -1) * vals[cell.type];
    }
  }
  return s;
}

function pickCpuMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestScore = chess.turn() === "w" ? -Infinity : Infinity;
  for (const m of moves) {
    chess.move(m);
    const score = evalBoard(chess);
    chess.undo();
    if (chess.turn() === "b") {
      if (score < bestScore) {
        bestScore = score;
        best = m;
      }
    } else if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

function emptyState() {
  return { fen: DEFAULT_POSITION, history: [], captured: { w: [], b: [] }, lastMove: null };
}

function applyMove(prev, move) {
  if (!move) return prev;
  const captured = { w: [...prev.captured.w], b: [...prev.captured.b] };
  if (move.captured) captured[move.color] = [...captured[move.color], move.captured];
  return {
    fen: move.after,
    history: [...prev.history, move.san],
    captured,
    lastMove: { from: move.from, to: move.to },
  };
}

function MoveHistory({ history }) {
  if (history.length === 0) {
    return <span className="text-gray-500">No moves yet</span>;
  }

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    const whiteIdx = i;
    const blackIdx = i + 1;
    const isLastWhite = whiteIdx === history.length - 1;
    const isLastBlack = blackIdx === history.length - 1;

    rows.push(
      <span key={num} className="mr-2 inline whitespace-nowrap">
        <span className="text-gray-500">{num}.</span>{" "}
        <span className={isLastWhite ? "chess-move-recent font-semibold text-amber-300" : "text-gray-300"}>
          {history[whiteIdx]}
        </span>
        {history[blackIdx] ? (
          <>
            {" "}
            <span className={isLastBlack ? "chess-move-recent font-semibold text-amber-300" : "text-gray-300"}>
              {history[blackIdx]}
            </span>
          </>
        ) : null}
      </span>,
    );
  }

  return <span data-testid="chess-move-history">{rows}</span>;
}

export default function ChessApp() {
  const puzzle = useMemo(() => dailyPuzzle(), []);
  const [mode, setMode] = useState("cpu");
  const [flipped, setFlipped] = useState(false);
  const [game, setGame] = useState(emptyState);
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [thinkPiece, setThinkPiece] = useState(null);

  const chess = useMemo(() => new Chess(game.fen), [game.fen]);
  const turn = chess.turn();
  const gameOver = mode === "puzzle" ? puzzleSolved : chess.isGameOver();

  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = flipped ? [...FILES].reverse() : FILES;

  const banner = puzzleSolved
    ? "Puzzle solved — nice work!"
    : chess.isCheckmate()
      ? `Checkmate — ${turn === "w" ? "Black" : "White"} wins`
      : chess.isStalemate()
        ? "Stalemate — draw"
        : chess.isCheck()
          ? "Check!"
          : null;

  const clearSelection = useCallback(() => {
    setSelected(null);
    setLegalTargets([]);
  }, []);

  const startNewGame = useCallback(
    (nextMode = mode) => {
      if (nextMode === "puzzle") {
        setGame({ fen: puzzle.fen, history: [], captured: { w: [], b: [] }, lastMove: null });
        setPuzzleSolved(false);
      } else {
        setGame(emptyState());
      }
      setCpuThinking(false);
      setThinkPiece(null);
      clearSelection();
    },
    [clearSelection, mode, puzzle.fen],
  );

  const selectSquare = useCallback(
    (sq) => {
      const board = new Chess(game.fen);
      const piece = board.get(sq);
      if (!piece || piece.color !== board.turn()) {
        clearSelection();
        return;
      }
      if (mode === "cpu" && piece.color !== "w") {
        clearSelection();
        return;
      }
      const moves = board.moves({ square: sq, verbose: true });
      setSelected(sq);
      setLegalTargets(moves.map((m) => m.to));
    },
    [clearSelection, game.fen, mode],
  );

  const playMove = useCallback(
    (from, to) => {
      setGame((prev) => {
        const board = new Chess(prev.fen);
        const move = board.move({ from, to, promotion: "q" });
        if (!move) return prev;
        if (mode === "puzzle" && move.san !== puzzle.solution) return prev;
        if (mode === "puzzle" && move.san === puzzle.solution) setPuzzleSolved(true);
        return applyMove(prev, move);
      });
      clearSelection();
    },
    [clearSelection, mode, puzzle.solution],
  );

  const onSquare = useCallback(
    (sq) => {
      if (gameOver || cpuThinking) return;
      if (mode === "cpu" && turn !== "w") return;

      if (selected) {
        if (legalTargets.includes(sq)) {
          playMove(selected, sq);
          return;
        }
        if (sq === selected) {
          clearSelection();
          return;
        }
      }
      selectSquare(sq);
    },
    [clearSelection, cpuThinking, gameOver, legalTargets, mode, playMove, selectSquare, selected, turn],
  );

  useEffect(() => {
    if (mode !== "cpu" || gameOver) {
      setCpuThinking(false);
      setThinkPiece(null);
      return;
    }

    const board = new Chess(game.fen);
    if (board.turn() !== "b") {
      setCpuThinking(false);
      setThinkPiece(null);
      return;
    }

    const fenSnapshot = game.fen;
    const candidate = pickCpuMove(board);
    setCpuThinking(true);
    setThinkPiece(candidate?.from ?? null);

    const t = window.setTimeout(() => {
      setGame((prev) => {
        if (prev.fen !== fenSnapshot) return prev;
        const cpuBoard = new Chess(prev.fen);
        const m = pickCpuMove(cpuBoard);
        if (!m) return prev;
        const move = cpuBoard.move(m);
        return applyMove(prev, move);
      });
      setCpuThinking(false);
      setThinkPiece(null);
    }, 650);

    return () => window.clearTimeout(t);
  }, [game.fen, gameOver, mode]);

  return (
    <div data-testid="app-content-chess" className="mobile-app-scroll chess-app h-full overflow-y-auto bg-[#1c1c1e] text-white">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 p-3 pb-6 sm:p-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400">
            {mode === "puzzle" ? puzzle.title : `${turn === "w" ? "White" : "Black"} to move`}
          </p>
          <div className="mobile-segmented flex gap-1 overflow-x-auto pb-0.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                data-testid={`chess-mode-${m.id}`}
                onClick={() => {
                  setMode(m.id);
                  startNewGame(m.id);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  mode === m.id ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300"
                }`}
              >
                {m.label}
              </button>
            ))}
            <button
              type="button"
              data-testid="chess-new-game"
              onClick={() => startNewGame()}
              className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300"
            >
              New
            </button>
            <button
              type="button"
              data-testid="chess-flip-board"
              onClick={() => setFlipped((f) => !f)}
              className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300"
            >
              Flip
            </button>
          </div>
        </div>

        {mode === "puzzle" && !puzzleSolved && (
          <p data-testid="chess-puzzle-hint" className="rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400">
            {puzzle.hint}
          </p>
        )}

        <div className="chess-board-shell mx-auto w-full max-w-[min(100vw-2rem,420px)]">
          <div className="min-h-[2rem]">
            {banner && (
              <p data-testid="chess-banner" className="mb-2 rounded-lg bg-blue-600/20 px-3 py-2 text-center text-xs font-medium text-blue-200">
                {banner}
              </p>
            )}
          </div>

          <div
            data-testid="chess-board"
            className={`chess-board grid w-full grid-cols-8 overflow-hidden rounded-lg shadow-xl ring-1 ring-white/10 ${
              cpuThinking ? "chess-board--thinking" : ""
            }`}
          >
          {displayRanks.map((rank) =>
            displayFiles.map((file) => {
              const sq = `${file}${rank}`;
              const fileIdx = FILES.indexOf(file);
              const rankIdx = Number(rank);
              const light = (fileIdx + rankIdx) % 2 === 0;
              const piece = chess.get(sq);
              const isSel = selected === sq;
              const isTarget = legalTargets.includes(sq);
              const isLastFrom = game.lastMove?.from === sq;
              const isLastTo = game.lastMove?.to === sq;
              const isThinkingPiece = cpuThinking && thinkPiece === sq && piece?.color === "b";

              return (
                <button
                  key={sq}
                  type="button"
                  data-testid={`chess-square-${sq}`}
                  disabled={gameOver || cpuThinking || (mode === "cpu" && turn !== "w")}
                  onClick={() => onSquare(sq)}
                  className={`chess-square relative flex aspect-square items-center justify-center p-0 leading-none ${
                    light ? "chess-square-light" : "chess-square-dark"
                  } ${isSel ? "chess-square--selected" : ""} ${
                    isLastFrom ? "chess-square-last-from" : ""
                  } ${isLastTo ? "chess-square-last-to" : ""}`}
                >
                  {piece ? (
                    <span
                      className={`chess-glyph ${piece.color === "w" ? "chess-glyph--white" : "chess-glyph--black"} ${
                        isThinkingPiece ? "chess-glyph--thinking" : ""
                      } ${isLastTo && !cpuThinking ? "chess-glyph--recent" : ""}`}
                    >
                      {GLYPHS[piece.color][piece.type]}
                    </span>
                  ) : null}
                  {isTarget && (
                    <span
                      data-testid={`chess-target-${sq}`}
                      className={`absolute rounded-full bg-blue-500/75 ${piece ? "h-3 w-3" : "h-3.5 w-3.5"}`}
                    />
                  )}
                </button>
              );
            }),
          )}
        </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="mb-1 font-semibold uppercase tracking-wide text-gray-500">Captured</p>
            <p className="flex flex-wrap items-center gap-0.5 text-lg leading-none">
              {game.captured.w.length === 0 && game.captured.b.length === 0 ? (
                "—"
              ) : (
                <>
                  {game.captured.w.map((t, i) => (
                    <span key={`w-${t}-${i}`} className="chess-glyph chess-glyph--sm chess-glyph--black">
                      {GLYPHS.b[t]}
                    </span>
                  ))}
                  {game.captured.b.map((t, i) => (
                    <span key={`b-${t}-${i}`} className="chess-glyph chess-glyph--sm chess-glyph--white">
                      {GLYPHS.w[t]}
                    </span>
                  ))}
                </>
              )}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="mb-1 font-semibold uppercase tracking-wide text-gray-500">Moves</p>
            <p className="line-clamp-3 font-mono text-[11px]">
              <MoveHistory history={game.history} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
