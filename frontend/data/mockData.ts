export type Source = { label: string; url: string };
export type Item = {
  id: string;
  name: string;
  thumbnail: string;
  marketPrice: number;
  timestamp: string;
  sources: Source[];
  category: "$" | "$$" | "$$$";
  videoId: string;
  isAnalyzing?: boolean; // Optional flag to track analysis status
};
export type VideoMeta = {
  id: string;
  name: string;
  fileName?: string;
  createdAt: string;
  url?: string;
  gcsUri?: string; // GCS bucket URI (gs://bucket/path)
  gcsUrl?: string; // Public HTTP URL for the video
};

export const mockVideos: VideoMeta[] = [
  { id: "v1", name: "Living Room Walkthrough", fileName: "living-room.mp4", createdAt: new Date().toISOString() },
  { id: "v2", name: "Bedroom Tour", fileName: "bedroom.mov", createdAt: new Date().toISOString() },
];

export const mockItems: Item[] = [
  {
    id: "i1",
    name: "IKEA Lack Coffee Table",
    thumbnail: "https://images.unsplash.com/photo-1594125674956-61a9b49c8ecc?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    marketPrice: 39.99,
    timestamp: "00:01:12",
    sources: [
      { label: "IKEA", url: "https://www.ikea.com/" },
      { label: "Amazon", url: "https://www.amazon.com/" },
    ],
    category: "$",
    videoId: "v1",
  },
  {
    id: "i2",
    name: "West Elm Andes Sofa",
    thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop",
    marketPrice: 1299,
    timestamp: "00:03:05",
    sources: [{ label: "West Elm", url: "https://www.westelm.com/" }],
    category: "$$$",
    videoId: "v1",
  },
  {
    id: "i3",
    name: "Bedside Lamp",
    thumbnail: "https://images.unsplash.com/photo-1455792244736-3ed96c3d7f7e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    marketPrice: 79.5,
    timestamp: "00:00:58",
    sources: [{ label: "Target", url: "https://www.target.com/" }],
    category: "$$",
    videoId: "v2",
  },
];
