/** Photos in ~/Pictures — served from /pictures/optimized/*.webp */
export interface PictureAsset {
  id: string;
  title: string;
  src: string;
  location?: string;
}

export const PICTURES: PictureAsset[] = [
  { id: "coast", title: "Coastline", src: "/pictures/optimized/coast.webp", location: "Big Sur" },
  { id: "forest", title: "Forest Path", src: "/pictures/optimized/forest.webp", location: "Pacific NW" },
  { id: "mountains", title: "Alpine Ridge", src: "/pictures/optimized/mountains.webp", location: "Swiss Alps" },
  { id: "portrait", title: "Golden Hour", src: "/pictures/optimized/portrait.webp", location: "Studio" },
  { id: "river", title: "River Valley", src: "/pictures/optimized/river.webp", location: "Norway" },
  { id: "puppy", title: "Best Friend", src: "/pictures/optimized/puppy.webp", location: "Home" },
];
