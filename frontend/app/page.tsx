// import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Dialog } from "@radix-ui/react-dialog";
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Search, Upload, Video, ChevronDown, LogOut, User2, Trash2 } from "lucide-react";
import { mockVideos, mockItems, VideoMeta, Item } from "@/data/mockData";
import ProfileModal from "@/components/ProfileModal";
import { ModeToggle } from "@/components/ModeToggle";
import StatCard from "@/components/StatCard";
import ItemCard from "@/components/ItemCard";
import { classNames, toCurrency, toCSV, download } from "@/utils/helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { SideNav } from "@/components/side-nav";
import VideoAnnotator from "@/components/VideoAnnotator";
import SegmentGrid from "@/components/SegmentGrid";
// import { uploadImageFile } from "@/utils/gcs";

import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


// ------------------------------------------------------------
// Page Component
// ------------------------------------------------------------

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Profile mock
  const [profile] = useState({ name: "Chaira Harder", email: "chaira@example.com" });
  const [profileOpen, setProfileOpen] = useState(false);

  const filtered = useMemo(() => {
    const byVid = items.filter((i) => i.videoId === currentVideoId);
    if (!search.trim()) return byVid;
    const q = search.toLowerCase();
    return byVid.filter((i) =>
      [i.name, i.timestamp, i.category, ...i.sources.map((s) => s.label)].some((s) => s.toLowerCase().includes(q))
    );
  }, [items, currentVideoId, search]);

  const groups = useMemo(() => ({
    "$": filtered.filter((i) => i.category === "$"),
    "$$": filtered.filter((i) => i.category === "$$"),
    "$$$": filtered.filter((i) => i.category === "$$$"),
  }), [filtered]);

  const stats = useMemo(() => {
    const byVid = items.filter((i) => i.videoId === currentVideoId);
    const total = byVid.reduce((acc, i) => acc + i.marketPrice, 0);
    const avg = byVid.length ? total / byVid.length : 0;
    return {
      itemsProcessed: items.length,
      totalEstimated: items.reduce((a, i) => a + i.marketPrice, 0),
      videosUploaded: videos.length,
      averageItemValue: avg,
    };
  }, [items, videos, currentVideoId]);

  const onExportCSV = () => {
    download(`items_${currentVideoId || "all"}.csv`, toCSV(filtered), "text/csv");
  };

  const onExportGoogleSheets = () => {
    // Simple approach: download CSV then open Sheets new doc (user can import)
    onExportCSV();
    window.open("https://docs.google.com/spreadsheets/create", "_blank");
  };

  // Upload handling (client-side only demo)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      addVideo(file);
    },
    []
  );

  const addVideo = useCallback((file: File) => {
    console.log('🚀 Adding video to frontend:', file.name);
    
    // Create video meta for frontend storage only
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    const BUCKET_ID = "finteck-hackathon";
    // uploadImageFile(file, `${BUCKET_ID}/image.png`);
    const meta: VideoMeta = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      createdAt: new Date().toISOString(),
      url,
    };
    
    // Simple state updates
    setVideos(prev => [...prev, meta]);
    setCurrentVideoId(id);
    setVideoUrl(url);
    setShowUpload(false);
    
    console.log('✅ Video added successfully:', meta);
  }, []);

  React.useEffect(() => {
    const v = videos.find((x) => x.id === currentVideoId);
    setVideoUrl(v?.url ?? null);
  }, [currentVideoId]);

  const clearAllData = () => {
    if (!confirm("This will clear ALL items and videos. Continue?")) return;
    setItems([]);
    setVideos([]);
    setCurrentVideoId("");
  };

  return (
  <div className="min-h-screen bg-gray-50 text-gray-900 flex font-sans p-6">
      {/* SideNav: always fixed width, always visible, full height */}
      <div className={`fixed left-0 top-0 h-screen ${collapsed ? 'w-[72px]' : 'w-[260px]'} transition-all duration-300 bg-white border-r border-gray-200 flex-shrink-0 z-30`}>
        <SideNav
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onExportCSV={onExportCSV}
          onExportGoogleSheets={onExportGoogleSheets}
          onClearAllData={clearAllData}
        />
      </div>
      {/* Main dashboard content: scrollable, with left margin for nav */}
  <main className={`flex-1 p-4 md:p-8 ml-[72px] ${!collapsed ? 'md:ml-[260px]' : ''}`}>
          {/* Top bar */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <p className="text-neutral-400 text-sm tracking-wide">Upload a video, review detected items, and manage exports.</p>
            </div>

            {/* Profile dropdown and mode toggle */}
            <div className="flex items-center gap-2">
              {/* <ModeToggle /> */}
              <div className="relative">
                <Button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 hover:bg-gray-50"
                  variant="outline"
                >
                  <User2 size={18} /> Profile <ChevronDown size={16} />
                </Button>
                {profileOpen && (
                  <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/10" onClick={() => setProfileOpen(false)}>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <ProfileModal
                        profile={profile}
                        stats={stats}
                        onLogout={() => setProfileOpen(false)}
                        onClearAllData={() => {
                          setProfileOpen(false);
                          clearAllData();
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-black font-bold">Video:</label>
              <Select value={currentVideoId} onValueChange={(v) => setCurrentVideoId(v)}>
                <SelectTrigger className="w-[300px] rounded-xl shadow-[0_2px_8px_0_rgba(128,128,128,0.12)] bg-white">
                  <SelectValue placeholder="Select a video" />
                </SelectTrigger>
                <SelectContent>
                  {/* Do not render SelectItem with empty value, as it causes a runtime error */}
                  {videos.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-neutral-400">No videos have been uploaded yet.</div>
                  ) : (
                    videos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-2 hover:bg-gray-100 border shadow-[0_2px_8px_0_rgba(128,128,128,0.12)] bg-white"
                title="Add new video"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full p-2 hover:bg-gray-100 border shadow-[0_2px_8px_0_rgba(128,128,128,0.12)] bg-white">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowUpload((s) => !s)}>
                    {showUpload ? "Hide upload section" : "Show upload section"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative w-full md:max-w-sm md:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items…"
                className="w-full pl-10 pr-3 py-2 rounded-2xl border bg-white shadow-[0_2px_8px_0_rgba(128,128,128,0.12)] focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </div>
          </div>

          {/* Persistent file input for uploads */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                addVideo(file);
                e.currentTarget.value = ''; // Clear input to allow same file re-select
              }
            }}
          />


          {/* Main content sections */}
          <div className={`flex gap-6 w-full h-full`}>
            {/* Left: Upload/VideoAnnotator & Capture Items */}
            <div className={`transition-all duration-700 ease-in-out ${!showUpload ? 'w-[36px] min-w-[36px]' : 'w-2/3'}`}> 
              <div className={`relative bg-white rounded-3xl border p-6 shadow-sm h-full flex-1 transition-all duration-700 ease-in-out ${!showUpload ? 'w-[36px] p-6 flex flex-col items-center justify-center' : 'w-full'}`}>
                <button
                  className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white border rounded-full shadow-md p-1 flex items-center justify-center z-10"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setShowUpload((s) => !s)}
                  aria-label={showUpload ? 'Collapse' : 'Expand'}
                >
                  <span className={`transition-transform duration-300 ${showUpload ? '' : 'rotate-180'}`}> 
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(90deg)' }}>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <div className={`transition-opacity duration-700 ${!showUpload ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}> 
                  {showUpload ? (
                    videoUrl ? (
                      <VideoAnnotator
                        key={currentVideoId}
                        src={videoUrl}
                        onCapture={(a) => {
                          // Send to backend (example)
                          fetch("/api/items", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(a),
                          });
                          // Or convert to your Item type and insert into $, $$, $$$ lists
                        }}
                        className="mt-4"
                      />
                    ) : (
                      <div className="mb-6">
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={onDrop}
                          className="rounded-3xl border-2 border-dashed p-8 text-center bg-white hover:bg-gray-50 transition"
                        >
                          <div className="mx-auto h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                            <Upload />
                          </div>
                          <div className="text-lg font-medium">Drop a video here</div>
                          <div className="text-neutral-400 text-sm mb-4 tracking-wide">or click to choose a file</div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 bg-white hover:bg-gray-50"
                          >
                            <Video size={18} /> Select video
                          </button>
                        </div>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            </div>
            {/* Right: Vertical List Items */}
            <div className={`transition-all duration-700 ease-in-out flex-1 ${!showUpload ? 'w-full' : 'w-1/3'}`}> 
              <div className="bg-white rounded-3xl border p-6 shadow-sm h-full flex flex-col">
                <div className="grid grid-cols-1 gap-6 flex-1">
                  {(["$", "$$", "$$$"] as const).map((bucket) => (
                    <div key={bucket} className="bg-white rounded-2xl border p-6 shadow-[0_4px_16px_0_rgba(128,128,128,0.16)]">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">{bucket}</h2>
                        <span className="text-xs text-neutral-400 tracking-wide">{groups[bucket].length} items</span>
                      </div>
                      <div className="space-y-3">
                        {groups[bucket].map((item) => (
                          <ItemCard key={item.id} item={item} />
                        ))}
                        {groups[bucket].length === 0 && (
                          <div className="text-sm text-neutral-400 italic tracking-wide">No items here yet.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SegmentGrid -- TODO: DELETE AFTER, THIS IS JUST TO TEST*/}
          {/* <SegmentGrid /> */}
          {/* <img src="https://storage.googleapis.com/finteck-hackathon/0c803398-processed-images/chair/frame_000000_object_000.png" alt="description" /> */}

        </main>
    </div>
  );
}

