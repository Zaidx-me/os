import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

import { getGameStatus, pickCpuMove, tryMove } from "./engine";

describe("chess engine", () => {
  it("allows a legal move", () => {
    const chess = new Chess();
    const move = tryMove(chess, "e2", "e4");
    expect(move).not.toBeNull();
    expect(move?.san).toBe("e4");
    expect(chess.fen()).toMatch(/^rnbqkbnr\/pppppppp\/8\/8\/4P3\//);
  });

  it("rejects an illegal move", () => {
    const chess = new Chess();
    const before = chess.fen();
    const move = tryMove(chess, "e2", "e5");
    expect(move).toBeNull();
    expect(chess.fen()).toBe(before);
  });

  it("detects checkmate and ends the game", () => {
    const chess = new Chess(
      "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
    );
    expect(chess.isCheckmate()).toBe(true);
    expect(getGameStatus(chess).kind).toBe("checkmate");
    expect(tryMove(chess, "e1", "e2")).toBeNull();
  });

  it("pickCpuMove returns a legal move", () => {
    const chess = new Chess();
    chess.move("e4");
    const cpuMove = pickCpuMove(chess);
    expect(cpuMove).not.toBeNull();
    expect(chess.moves({ verbose: true }).some((m) => m.san === cpuMove?.san)).toBe(
      true,
    );
  });
});
