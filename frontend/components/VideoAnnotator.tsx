"use client"

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, Scissors, Check, Trash, Upload, CheckCircle } from "lucide-react";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type BBox = { x: number; y: number; w: number; h: number };

export type Annotation = {
  id: string;
  time: number; // seconds
  bbox: BBox;
  previewDataUrl: string; // cropped image preview of the box at that frame
  gcsUri?: string; // GCS URI after upload
  isUploading?: boolean; // Upload status
};

// ------------------------------------------------------------
// Helper utils
// ------------------------------------------------------------

const formatTime = (s: number) => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
};

// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

// Convert data URL to File object and upload to GCS
async function uploadCroppedImage(dataUrl: string, annotationId: string): Promise<string | null> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create a File object
    const file = new File([blob], `annotation_${annotationId}.png`, { type: 'image/png' });
    
    // Upload to GCS using the existing upload endpoint
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await fetch('/api/upload-video', {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    const result = await uploadResponse.json();
    console.log('✅ Cropped image uploaded to GCS:', result.gcsUri);
    
    return result.gcsUri;
    
  } catch (error) {
    console.error('❌ Failed to upload cropped image:', error);
    return null;
  }
}

// ------------------------------------------------------------
// VideoAnnotator
// ------------------------------------------------------------

/**
 * A lightweight video + annotation overlay. Users can drag a rectangle over the video to
 * capture an item at the current frame. We crop the frame to that rectangle and return a preview.
 *
 * No external dependencies; plug-and-play for Next.js Client Components.
 */
export default function VideoAnnotator({
  src,
  onCapture,
  onSaveAll,
  className,
}: {
  src: string; // blob url or remote url
  onCapture?: (a: Annotation) => void; // callback so you can POST to your backend
  onSaveAll?: (annotations: Annotation[]) => void; // callback when save all is pressed
  className?: string;
}) {
  // Selection state for captured items
  const [selected, setSelected] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // dragging state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [annots, setAnnots] = useState<Annotation[]>([]);

  // keep time in sync while playing
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = () => setTime(v.currentTime);
    const m = () => setDuration(v.duration || 0);
    v.addEventListener("timeupdate", t);
    v.addEventListener("loadedmetadata", m);
    return () => {
      v.removeEventListener("timeupdate", t);
      v.removeEventListener("loadedmetadata", m);
    };
  }, []);

  const togglePlay = React.useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      await v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = React.useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setTime(t);
  }, []);
  // Keyboard shortcuts: space (play/pause), left/right (seek)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      const v = videoRef.current;
      if (!v) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(Math.max(0, v.currentTime - 0.5));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(Math.min(v.duration || 0, v.currentTime + 0.5));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlay, seek]);

  // Mouse-based box drawing
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setBbox({ x, y, w: 0, h: 0 });
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current || !dragStart) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = x - dragStart.x;
    const h = y - dragStart.y;
    setBbox({
      x: w < 0 ? x : dragStart.x,
      y: h < 0 ? y : dragStart.y,
      w: Math.abs(w),
      h: Math.abs(h),
    });
  };

  const onMouseUp = async () => {
    if (!bbox || !overlayRef.current || !videoRef.current) {
      setDragStart(null);
      return;
    }

    // Capture current video frame and crop to bbox
    const video = videoRef.current;
    const overlayRect = overlayRef.current.getBoundingClientRect();
    const scaleX = video.videoWidth / overlayRect.width;
    const scaleY = video.videoHeight / overlayRect.height;

    const sx = Math.max(0, Math.floor(bbox.x * scaleX));
    const sy = Math.max(0, Math.floor(bbox.y * scaleY));
    const sw = Math.max(1, Math.floor(bbox.w * scaleX));
    const sh = Math.max(1, Math.floor(bbox.h * scaleY));

    // Draw full frame to an offscreen canvas
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = video.videoWidth;
    frameCanvas.height = video.videoHeight;
    const fctx = frameCanvas.getContext("2d");
    if (!fctx) return;
    fctx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);

    // Crop the selection
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = sw;
    cropCanvas.height = sh;
    const cctx = cropCanvas.getContext("2d");
    if (!cctx) return;
    cctx.drawImage(frameCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

    const dataUrl = cropCanvas.toDataURL("image/png");
    const annotation: Annotation = {
      id: `a_${Date.now()}`,
      time: video.currentTime,
      bbox: { ...bbox },
      previewDataUrl: dataUrl,
      isUploading: true,
    };

    setAnnots((a) => [annotation, ...a]);
    
    // Upload the cropped image immediately to GCS
    uploadCroppedImage(dataUrl, annotation.id).then((gcsUri) => {
      if (gcsUri) {
        setAnnots((prev) => prev.map((a) => 
          a.id === annotation.id 
            ? { ...a, gcsUri, isUploading: false }
            : a
        ));
      } else {
        setAnnots((prev) => prev.map((a) => 
          a.id === annotation.id 
            ? { ...a, isUploading: false }
            : a
        ));
      }
    });
    
    onCapture?.(annotation); // Let the parent send to backend

    // reset drag state (keep bbox rendered for a moment if you want)
    setDragStart(null);
    setBbox(null);
  };

  const canCapture = useMemo(() => !!bbox && bbox.w > 6 && bbox.h > 6, [bbox]);

  const handleSaveAll = async () => {
    if (annots.length === 0) return;
    
    // Filter annotations that have been successfully uploaded to GCS
    const uploadedAnnotations = annots.filter(a => a.gcsUri && !a.isUploading);
    
    if (uploadedAnnotations.length === 0) {
      console.log('⚠️ No annotations ready for processing. Some may still be uploading...');
      return;
    }
    
    console.log('🚀 Processing', uploadedAnnotations.length, 'annotations through valuation pipeline');
    
    // Call the parent's onSaveAll callback with the uploaded annotations
    if (onSaveAll) {
      onSaveAll(uploadedAnnotations);
    }
    
    // Clear all annotations from the temporary view after processing
    setAnnots([]);
    setSelected([]);
    
    console.log('🧹 Cleared temporary annotation view');
  };

  const handleClear = () => setAnnots([]);

  return (
    <div className={className}>
      {/* Video + overlay */}
      <div className="relative rounded-2xl overflow-hidden border bg-black shadow-lg shadow-gray-200/60">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-auto block"
          onClick={togglePlay}
          playsInline
        />

        {/* Mouse overlay for drawing */}
        <div
          ref={overlayRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        />

        {/* Draw the bbox */}
        {bbox && (
          <div
            className="absolute border-2 border-emerald-400 bg-emerald-400/10"
            style={{ left: bbox.x, top: bbox.y, width: bbox.w, height: bbox.h }}
          />
        )}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="inline-flex items-center justify-center rounded-lg bg-white/90 px-3 py-2 text-sm"
            >
              {isPlaying ? (
                <span className="inline-flex items-center gap-1"><Pause className="h-4 w-4"/> Pause</span>
              ) : (
                <span className="inline-flex items-center gap-1"><Play className="h-4 w-4"/> Play</span>
              )}
            </button>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={time}
              onChange={(e) => seek(Number(e.target.value))}
              className="flex-1"
            />

            <div className="text-white text-xs tabular-nums">{formatTime(time)} / {formatTime(duration)}</div>
          </div>
        </div>
      </div>

  {/* Actions */}
  <div className="mt-6">
    <div className="mb-2 text-sm text-gray-500">Drag to select an item. Release to capture.</div>
    <div className="flex items-center gap-2 pb-6">
      <Button variant="outline" onClick={handleSaveAll} className="gap-2">
  <Check className="h-4 w-4" /> Save all
      </Button>
      <Button variant="outline" onClick={handleClear} className="gap-2">
  <Trash className="h-4 w-4" /> Clear all
      </Button>
      {selected.length > 0 && (
        <Button
          variant="destructive"
          onClick={() => {
            setAnnots((ann: Annotation[]) => ann.filter((a: Annotation) => !selected.includes(a.id)));
            setSelected([]);
          }}
          className="gap-2"
        >
          Clear selected
        </Button>
      )}
    </div>
  </div>

      {/* Thumbnails list */}
      {annots.length > 0 && (
        <div className="mt-4 pb-8">
          <div className="text-sm text-gray-600 mb-2">Captured items ({annots.length})</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {annots.map((a) => {
              const isSelected = selected.includes(a.id);
              return (
                <div key={a.id} className="relative rounded-xl border overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.previewDataUrl} alt="capture" className="w-full aspect-square object-cover" />
                  <div className="p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600">t={formatTime(a.time)}</span>
                      <button
                        type="button"
                        className={`ml-auto rounded-full border-2 w-5 h-5 flex items-center justify-center transition ${isSelected ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"}`}
                        title={isSelected ? "Deselect" : "Select"}
                        onClick={() => {
                          setSelected((sel: string[]) =>
                            isSelected ? sel.filter((id: string) => id !== a.id) : [...sel, a.id]
                          );
                        }}
                      >
                        {isSelected ? (
                          <span className="block w-2 h-2 rounded-full bg-white" />
                        ) : null}
                      </button>
                    </div>
                    
                    {/* Upload status */}
                    <div className="flex items-center gap-1 text-xs">
                      {a.isUploading ? (
                        <>
                          <Upload className="h-3 w-3 animate-pulse text-blue-500" />
                          <span className="text-blue-500">Uploading...</span>
                        </>
                      ) : a.gcsUri ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">Ready</span>
                        </>
                      ) : (
                        <>
                          <span className="text-red-500">Failed</span>
                        </>
                      )}
                    </div>
                    
                    {/* GCS URI (truncated) */}
                    {a.gcsUri && (
                      <div className="text-xs text-gray-400 truncate mt-1" title={a.gcsUri}>
                        {a.gcsUri.replace('gs://', '').split('/').slice(-2).join('/')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Usage:
// ------------------------------------------------------------

/**
 * In app/page.tsx, after you have a File from the uploader, create an object URL and
 * pass it to <VideoAnnotator src={blobUrl} onCapture={...} />.
 *
 * Example (snippet):
 *
 * const [videoUrl, setVideoUrl] = useState<string | null>(null);
 *
 * function addVideo(file: File) {
 *   const url = URL.createObjectURL(file);
 *   setVideoUrl(url);
 *   // also keep your existing VideoMeta state updates
 * }
 *
 * {videoUrl ? (
 *   <VideoAnnotator
 *     src={videoUrl}
 *     onCapture={(a) => {
 *       // send to backend or convert to your Item type to display in columns later
 *       fetch("/api/items", { method: "POST", body: JSON.stringify(a) });
 *     }}
 *   />
 * ) : (
 *   // existing upload UI
 * )}
 */
