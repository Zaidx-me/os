/** Filled chess piece SVGs (Cburnett / Wikimedia, viewBox 0 0 45 45). */
const PATHS = {
  p: "M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23.17c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.34-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z",
  r: "M9 39h27v-3H9v3zm3.5-7h20v-3h-20v3zm-.5-4.5l2.8-2.8c1.8-1.8 2.8-4.2 2.8-6.8 0-5.2-4.2-9.4-9.4-9.4S4.6 15.5 4.6 20.7c0 2.6 1 5 2.8 6.8l2.8 2.8H12z",
  n: "M22 10c10.5 1 16.5 8 16 29H15c0-9 10-15.5 9-17.5-1.5-1-3.5-1.5-2-5zM24 38.6h-3v3h3v-3z",
  b: "M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.07 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.354.47-3-.5 1.354-1.94 3-2 3-2zm6-4c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
  q: "M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z",
  k: {
    body: "M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-5 2-8 2s-4-1-9-1-5 3-9 3-4-3-8-2c-3 6 6 10.5 6 10.5v7z",
    crown: "M22.5 25c2.5-4.5 2.5-9.5 0-14.5-2.5 5-2.5 10 0 14.5z",
    cross: true,
  },
};

export default function ChessPiece({ type, color, className = "", thinking = false, recent = false }) {
  const fill = color === "w" ? "#ffffff" : "#1a1a1a";
  const stroke = color === "w" ? "#1a1a1a" : "#ffffff";
  const def = PATHS[type];
  if (!def) return null;

  const bodyPath = typeof def === "string" ? def : def.body;

  return (
    <svg
      viewBox="0 0 45 45"
      className={`chess-piece-svg ${className} ${thinking ? "chess-piece-svg--thinking" : ""} ${
        recent ? "chess-piece-svg--recent" : ""
      }`}
      aria-hidden
    >
      <path d={bodyPath} fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
      {typeof def !== "string" && def.crown ? (
        <path d={def.crown} fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
      ) : null}
      {typeof def !== "string" && def.cross ? (
        <>
          <path d="M22.5 11.63V6" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20 8h5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}
