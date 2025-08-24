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
import StatCard from "@/components/StatCard";
import ItemCard from "@/components/ItemCard";
import { classNames, toCurrency, toCSV, download } from "@/utils/helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { SideNav } from "@/components/side-nav";
import VideoAnnotator from "@/components/VideoAnnotator";
import SegmentGrid from "@/components/SegmentGrid";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const addVideo = useCallback(async (file: File) => {
    console.log('🚀 Adding video to frontend:', file.name);
    
    // Create video meta for frontend storage only
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
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
    
    // Now upload to GCS
    try {
      console.log('📤 Starting GCS upload...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const uploadResult = await response.json();
        console.log('✅ GCS upload successful:', uploadResult);
        
        // Update the video meta with GCS info
        setVideos(prev => prev.map(v => 
          v.id === id 
            ? { ...v, gcsUri: uploadResult.gcsUri, gcsUrl: uploadResult.publicUrl }
            : v
        ));
        
        console.log('🔗 GCS URI stored:', uploadResult.gcsUri);
        console.log('🌐 Public URL:', uploadResult.publicUrl);
        
      } else {
        const errorData = await response.json();
        console.error('❌ GCS upload failed:', errorData);
      }
      
    } catch (error) {
      console.error('❌ Error during GCS upload:', error);
    }
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

  const populateRandomItems = async () => {
    setIsAnalyzing(true);
    try {
      console.log('🚀 Calling Cloud Run API directly...');
      
      const API_URL = "https://us-central1-ai-fintech-hackathon.cloudfunctions.net/valuation-research-function";
      const API_KEY = "gsafd854fasdfasdf8848674fjf74bfgr0wnfnd";
      
      // Use the current video's GCS URI if available, otherwise fallback to test URI
      const currentVideo = videos.find(v => v.id === currentVideoId);
      const VIDEO_URI = currentVideo?.gcsUri || "gs://finteck-hackathon/14f40801-processed-images/chair/frame_000000_object_000.png";
      
      console.log('🌐 API URL:', API_URL);
      console.log('🔑 API Key:', API_KEY ? 'Present' : 'Missing');
      console.log('📹 Video URI:', VIDEO_URI);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gcs_uri: VIDEO_URI,
          api_key: API_KEY
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API response received:', data);
        console.log('📊 Full response data:', JSON.stringify(data, null, 2));
        
        // For now, just log the data and add mock items
        const mockItems: Item[] = [
          {
            id: `mock_chair_1`,
            name: "Vintage Chair",
            thumbnail: "https://storage.googleapis.com/finteck-hackathon/processed-images/chair/frame_000000_object_000.png",
            marketPrice: 150,
            timestamp: "0:15",
            sources: [
              { label: "GCS Storage", url: "https://storage.googleapis.com/finteck-hackathon/processed-images/chair/frame_000000_object_000.png" },
              { label: "AI Detection", url: "#" }
            ],
            category: "$$",
            videoId: currentVideoId || "mock"
          },
          {
            id: `mock_person_1`,
            name: "Person",
            thumbnail: "https://storage.googleapis.com/finteck-hackathon/processed-images/person/frame_000002_object_000.png",
            marketPrice: 25,
            timestamp: "0:40",
            sources: [
              { label: "GCS Storage", url: "https://storage.googleapis.com/finteck-hackathon/processed-images/person/frame_000002_object_000.png" },
              { label: "AI Detection", url: "#" }
            ],
            category: "$",
            videoId: currentVideoId || "mock"
          }
        ];
        
        setItems(prev => [...prev, ...mockItems]);
        console.log(`✅ Added ${mockItems.length} mock items`);
        
      } else {
        const errorText = await response.text();
        console.error('❌ API call failed:', response.status);
        console.error('❌ Error response:', errorText);
        
        // Add mock items on error too
        const mockItems: Item[] = [
          {
            id: `error_fallback_1`,
            name: "Error Fallback Item",
            thumbnail: "https://storage.googleapis.com/finteck-hackathon/processed-images/error/fallback.png",
            marketPrice: 100,
            timestamp: "0:00",
            sources: [
              { label: "GCS Storage", url: "https://storage.googleapis.com/finteck-hackathon/processed-images/error/fallback.png" },
              { label: "API Error", url: `#${response.status}` }
            ],
            category: "$$",
            videoId: currentVideoId || "error"
          }
        ];
        
        setItems(prev => [...prev, ...mockItems]);
        console.log(`✅ Added ${mockItems.length} fallback items due to API error`);
      }
      
    } catch (error) {
      console.error('❌ Error calling video analysis API:', error);
      console.error('❌ Full error details:', error);
      
      // Add mock items on exception too
      const mockItems: Item[] = [
        {
          id: `exception_fallback_1`,
          name: "Exception Fallback Item",
          thumbnail: "https://storage.googleapis.com/fintech-hackathon/processed-images/exception/fallback.png",
          marketPrice: 75,
          timestamp: "0:00",
          sources: [
            { label: "GCS Storage", url: "https://storage.googleapis.com/fintech-hackathon/processed-images/exception/fallback.png" },
            { label: "Exception", url: "#" }
          ],
          category: "$",
          videoId: currentVideoId || "exception"
        }
      ];
      
      setItems(prev => [...prev, ...mockItems]);
      console.log(`✅ Added ${mockItems.length} fallback items due to exception`);
      
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearRandomItems = () => {
    setItems(prev => prev.filter(item => !item.id.startsWith('random_')));
    console.log('🗑️ Cleared all random items');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
  <div className={`grid grid-cols-1 ${collapsed ? "md:grid-cols-[72px_1fr]" : "md:grid-cols-[260px_1fr]"} min-h-screen`}>
        <SideNav
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onExportCSV={onExportCSV}
          onExportGoogleSheets={onExportGoogleSheets}
          onClearAllData={clearAllData}
        />
        <main className="p-4 md:p-8">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-500 text-sm">Upload a video, review detected items, and manage exports.</p>
            </div>

            {/* Profile dropdown */}
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

          {/* Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-5">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-bold">Video:</label>
              <Select value={currentVideoId} onValueChange={(v) => setCurrentVideoId(v)}>
                <SelectTrigger className="w-[300px] rounded-xl shadow-[0_2px_8px_0_rgba(128,128,128,0.12)] bg-white">
                  <SelectValue placeholder="Select a video" />
                </SelectTrigger>
                <SelectContent>
                  {/* Do not render SelectItem with empty value, as it causes a runtime error */}
                  {videos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex items-center gap-2">
                        <span>{v.name}</span>
                        {v.gcsUri && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            ☁️ GCS
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* GCS Status Indicator */}
              {currentVideoId && videos.find(v => v.id === currentVideoId)?.gcsUri && (
                <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                  ☁️ Uploaded to GCS: {videos.find(v => v.id === currentVideoId)?.gcsUri}
                </div>
              )}
              
              <Button
                onClick={populateRandomItems}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                variant="default"
              >
                {isAnalyzing ? '⏳ Calling API...' : '🚀 Call Cloud Run API'}
              </Button>
              
              <Button
                onClick={clearRandomItems}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
                variant="default"
              >
                🗑️ Clear Random Items
              </Button>
              

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Upload/VideoAnnotator & Capture Items */}
            <div className="col-span-1 md:col-span-2">
              <div className="bg-white rounded-3xl border p-6 shadow-sm">
                {videoUrl ? (
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
                  showUpload && (
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
                        <div className="text-gray-500 text-sm mb-4">or click to choose a file</div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 bg-white hover:bg-gray-50"
                        >
                          <Video size={18} /> Select video
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            {/* Right: Vertical List Items */}
            <div className="col-span-1">
              <div className="bg-white rounded-3xl border p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-5">
                  {(["$", "$$", "$$$"] as const).map((bucket) => (
                    <div key={bucket} className="bg-white rounded-2xl border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">{bucket}</h2>
                        <span className="text-xs text-gray-500">{groups[bucket].length} items</span>
                      </div>
                      <div className="space-y-3">
                        {groups[bucket].map((item) => (
                          <ItemCard key={item.id} item={item} />
                        ))}
                        {groups[bucket].length === 0 && (
                          <div className="text-sm text-gray-500 italic">No items here yet.</div>
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
    </div>
  );
}

