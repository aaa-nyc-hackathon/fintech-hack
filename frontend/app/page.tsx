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
  const [videos, setVideos] = useState<VideoMeta[]>(mockVideos);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [currentVideoId, setCurrentVideoId] = useState<string>(videos[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videos]
  );

  const addVideo = (file: File) => {
    const id = `v${Date.now()}`;
    const meta: VideoMeta = { id, name: file.name.replace(/\.[^/.]+$/, ""), fileName: file.name, createdAt: new Date().toISOString() };
    setVideos((v) => [...v, meta]);
    setCurrentVideoId(id);
    // In your real pipeline, kick off frame extraction+pricing here and set items accordingly.
  };

  const clearAllData = () => {
    if (!confirm("This will clear ALL items and videos. Continue?")) return;
    setItems([]);
    setVideos([]);
    setCurrentVideoId("");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Layout grid */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
       
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
          <SideNav
            onExportCSV={onExportCSV}
            onExportGoogleSheets={onExportGoogleSheets}
            onClearAllData={clearAllData}
          />
          
        </div>


        {/* Main */}
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
            {/* <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Video:</label>
              <select
                value={currentVideoId}
                onChange={(e) => setCurrentVideoId(e.target.value)}
                className="rounded-xl border bg-white px-3 py-2"
              >
                {videos.length === 0 && <option value="">No videos</option>}
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div> */}

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Video:</label>
              <Select value={currentVideoId} onValueChange={(v) => setCurrentVideoId(v)}>
                <SelectTrigger className="w-[300px] rounded-xl">
                  <SelectValue placeholder="Select a video" />
                </SelectTrigger>
                <SelectContent>
                  {videos.length === 0 && (
                    <SelectItem value="">No videos</SelectItem>
                  )}
                  {videos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-2 hover:bg-gray-100 border">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowUpload((s) => !s)}>
                  {showUpload ? "Hide upload section" : "Show upload section"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative w-full md:max-w-sm md:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items…"
                className="w-full pl-10 pr-3 py-2 rounded-2xl border bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              />
            </div>
          </div>

          {/* Upload section */}
          {showUpload && (
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
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) addVideo(file);
                  }}
                />
              </div>
            </div>
          )}

          {/* Lists */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(["$", "$$", "$$$"] as const).map((bucket) => (
              <div key={bucket} className="bg-white rounded-3xl border p-4">
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
        </main>
      </div>
    </div>
  );
}

