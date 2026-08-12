import { useEffect, useState } from "react";
import OptimizedImage from "../OptimizedImage.jsx";

/** Lightweight photo widget — local optimized assets only (no Unsplash). */
const PHOTOS = [
  "/Wallpaper/optimized/GoldenGate_6k.webp",
  "/Wallpaper/optimized/macOS-Sonoma-light.webp",
  "/Wallpaper/optimized/Golden_Dark_6k.webp",
];

export default function PhotoWidget() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHOTOS.length), 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      <OptimizedImage
        src={PHOTOS[index]}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
