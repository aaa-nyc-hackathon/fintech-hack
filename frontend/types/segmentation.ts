// // types/segmentation.ts
// export type DetectedObject = {
//   bbox: { x1: number; y1: number; x2: number; y2: number; width: number; height: number };
//   category_name: string;
//   confidence: number;
//   gcs_path: string;    // may be gs:// or already https
//   object_id: number;
// };

// export type FrameRow = {
//   frame_number: number;
//   timestamp_seconds: number;
//   objects: DetectedObject[];
// };

// export type SegmentationResponse = {
//   duration: string;
//   frame_interval: number;
//   frame_data: FrameRow[];
//   processed_images_bucket: string;
//   total_frames_processed: number;
//   total_objects_detected: number;
//   video_uri: string;   // gs:// original video
// };

// ______
// types/segmentation.ts
// export type SegmentationObject = {
//   category_name: string;
//   confidence: number;
//   gcs_path: string;
//   object_id: number;
// };

// export type SegmentationFrame = {
//   frame_number: number;
//   timestamp_seconds: number;
//   objects: SegmentationObject[];
// };

// ______

// types/segmentation.ts

// Per-object bbox in video pixels
export type SegmentationBBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
};

export type SegmentationObject = {
  category_name: string;
  confidence: number;
  gcs_path: string;      // may be gs:// or https://
  object_id: number;
  bbox?: SegmentationBBox; // optional: present in sample JSON
};

export type SegmentationFrame = {
  frame_number: number;
  timestamp_seconds: number;
  objects: SegmentationObject[];
};

// Full response wrapper (matches JSON pasted)
export type SegmentationResponse = {
  duration: string;                  // "3.76 seconds"
  frame_interval: number;            // 20
  frame_data: SegmentationFrame[];   // <-- the frames live here
  processed_images_bucket: string;   // "gs://finteck-hackathon/0c803398-processed-images"
  total_frames_processed: number;    // 6
  total_objects_detected: number;    // 17
  video_uri: string;                 // "gs://finteck-hackathon/IMG_0748.mp4"
  object_categories?: Record<string, { confidence: number; frame_number: number; gcs_path: string }[]>;
};
