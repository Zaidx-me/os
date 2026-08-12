/** Photos in ~/Pictures — served from /pictures/*.jpg */
export interface PictureAsset {
  id: string;
  title: string;
  src: string;
  location?: string;
}

export const PICTURES: PictureAsset[] = [
  { id: "coast", title: "Coastline", src: "/pictures/coast.jpg", location: "Big Sur" },
  { id: "forest", title: "Forest Path", src: "/pictures/forest.jpg", location: "Pacific NW" },
  { id: "mountains", title: "Alpine Ridge", src: "/pictures/mountains.jpg", location: "Swiss Alps" },
  { id: "portrait", title: "Golden Hour", src: "/pictures/portrait.jpg", location: "Studio" },
  { id: "river", title: "River Valley", src: "/pictures/river.jpg", location: "Norway" },
  { id: "puppy", title: "Best Friend", src: "/pictures/puppy.jpg", location: "Home" },
];
