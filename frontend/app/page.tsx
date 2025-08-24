// import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Dialog } from "@radix-ui/react-dialog";
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Search, Upload, Video, ChevronDown, LogOut, User2, Trash2 } from "lucide-react";
import { VideoMeta, Item } from "@/data/mockData";
import ProfileModal from "@/components/ProfileModal";
import { ModeToggle } from "@/components/ModeToggle";
import StatCard from "@/components/StatCard";
import ItemCard from "@/components/ItemCard";
import { classNames, toCurrency, toCSV, download } from "@/utils/helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { SideNav } from "@/components/side-nav";
import VideoAnnotator, { Annotation } from "@/components/VideoAnnotator";
import SegmentGrid from "@/components/SegmentGrid";
import { uploadFileToGCS } from "@/utils/upload";
import { upsertItem, upsertVideo, downloadCSV, getStorageStats } from "@/utils/dataStorage";

// GCS upload integration


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
  const [items, setItems] = useState<Item[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [forceUpdate, setForceUpdate] = useState(0); // Force re-render trigger
  
  // Debug effect to track items changes
  useEffect(() => {
    console.log('🔄 Items state changed:', {
      totalItems: items.length,
      items: items.map(i => ({ id: i.id, name: i.name, category: i.category, videoId: i.videoId, isAnalyzing: i.isAnalyzing }))
    });
  }, [items]);
  
  // Profile mock
  const [profile] = useState({ name: "Chaira Harder", email: "chaira@example.com" });
  const [profileOpen, setProfileOpen] = useState(false);

  const filtered = useMemo(() => {
    const byVid = items.filter((i) => i.videoId === currentVideoId);
    console.log('🔍 Filtering items:', {
      totalItems: items.length,
      currentVideoId: currentVideoId,
      byVideoId: byVid.length,
      allItems: items.map(i => ({ id: i.id, name: i.name, videoId: i.videoId, category: i.category }))
    });
    if (!search.trim()) return byVid;
    const q = search.toLowerCase();
    return byVid.filter((i) =>
      [i.name, i.timestamp, i.category, ...i.sources.map((s) => s.label)].some((s) => s.toLowerCase().includes(q))
    );
  }, [items, currentVideoId, search, forceUpdate]);

  const groups = useMemo(() => {
    // Use ALL items, not just filtered ones, to ensure we show everything
    const allItems = items;
    const result = {
      "$": allItems.filter((i) => i.category === "$"),
      "$$": allItems.filter((i) => i.category === "$$"),
      "$$$": allItems.filter((i) => i.category === "$$$"),
    };
    console.log('📦 Groups calculated:', {
      totalItems: allItems.length,
      totalFiltered: filtered.length,
      dollar: result["$"].length,
      dollarDollar: result["$$"].length,
      dollarDollarDollar: result["$$$"].length,
      allItems: allItems.map(i => ({ id: i.id, name: i.name, category: i.category, videoId: i.videoId }))
    });
    return result;
  }, [items, forceUpdate]); // Direct dependency on items, not filtered

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
    const filename = `items_${currentVideoId || "all"}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filename, {
      filter: currentVideoId ? { videoId: [currentVideoId] } : undefined,
      includeHeaders: true,
      dateFormat: "readable"
    });
    console.log('📊 Exported CSV with data storage system');
  };

  const onExportGoogleSheets = () => {
    // Simple approach: download CSV then open Sheets new doc (user can import)
    onExportCSV();
    window.open("https://docs.google.com/spreadsheets/create", "_blank");
  };

  // Upload handling (client-side only demo)
  const fileInputRef = useRef<HTMLInputElement>(null);

// Example handler for video upload
async function handleVideoUpload(file: File) {
  try {
    const result = await uploadFileToGCS(file);
    console.log('GCS URI:', result.gcsUri);
    
    // Now call the video analysis API with the GCS URI
    await callVideoAnalysisAPI(result.gcsUri);
    
  } catch (error) {
    console.error('Video upload failed:', error);
  }
}

// Function to extract GCS URIs from the video analysis response
function extractGCSUris(data: any): string[] {
  const gcsUris: string[] = [];
  
  if (data.frame_data && Array.isArray(data.frame_data)) {
    data.frame_data.forEach((frame: any) => {
      if (frame.objects && Array.isArray(frame.objects)) {
        frame.objects.forEach((obj: any) => {
          if (obj.gcs_path) {
            gcsUris.push(obj.gcs_path);
          }
        });
      }
    });
  }
  
  return gcsUris;
}

// Function to handle annotations save all - process captured images through valuation pipeline
async function handleAnnotationsSaveAll(annotations: Annotation[]) {
  try {
    console.log('🚀 Processing', annotations.length, 'annotations through valuation pipeline');
    
    // Create placeholder items for each annotation
    const placeholderItems: Item[] = [];
    
    annotations.forEach((annotation, index) => {
      if (!annotation.gcsUri) {
        console.warn('⚠️ Annotation missing GCS URI:', annotation.id);
        return;
      }
      
      const publicUrl = annotation.gcsUri.replace('gs://', 'https://storage.googleapis.com/');
      
      placeholderItems.push({
        id: `annotation_${Date.now()}_${index}`,
        name: "Analyzing...",
        thumbnail: publicUrl,
        marketPrice: 0,
        timestamp: `${annotation.time.toFixed(1)}s`,
        sources: [
          { label: "Manual Capture", url: "#" },
          { label: "GCS Storage", url: publicUrl }
        ],
        category: "$" as const, // Temporary category, will be updated
        videoId: currentVideoId || "manual_capture",
        isAnalyzing: true
      });
    });
    
    if (placeholderItems.length === 0) {
      console.log('⚠️ No valid annotations to process');
      return;
    }
    
    // Add placeholder items to state immediately
    setItems(prev => {
      const newItems = [...prev, ...placeholderItems];
      console.log('🎉 Added', placeholderItems.length, 'annotation items to the layout. Total items now:', newItems.length);
      return newItems;
    });
    
    // Force re-render to show new items immediately
    setForceUpdate(prev => prev + 1);
    
    // Start individual API calls for each annotation
    placeholderItems.forEach((item, index) => {
      const annotation = annotations[index];
      if (annotation?.gcsUri) {
        // Save annotation item to data storage
        upsertItem({
          id: item.id,
          name: item.name,
          category: item.category,
          marketPrice: item.marketPrice,
          timestamp: item.timestamp,
          videoId: item.videoId,
          source: "manual_capture" as const,
          gcsUri: annotation.gcsUri,
          publicUrl: annotation.gcsUri.replace('gs://', 'https://storage.googleapis.com/'),
          bbox: annotation.bbox,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isAnalyzing: item.isAnalyzing || false
        });
        
        processIndividualItem(annotation.gcsUri, item.id);
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing annotations:', error);
  }
}

// Function to call valuation API for a single GCS URI
async function callValuationAPI(gcsUri: string): Promise<any> {
  try {
    const API_URL = "https://us-central1-ai-fintech-hackathon.cloudfunctions.net/valuation-research-function";
    const API_KEY = process.env.NEXT_PUBLIC_VALUATION_API_KEY || "gsafd854fasdfasdf8848674fjf74bfgr0wnfnd";
    
    console.log('💰 Calling valuation API for:', gcsUri);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gcs_uri: gcsUri,
        api_key: API_KEY
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Valuation API response for', gcsUri, ':', data);
      return data;
    } else {
      const errorText = await response.text();
      console.error('❌ Valuation API failed for', gcsUri, ':', response.status, errorText);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error calling valuation API for', gcsUri, ':', error);
    return null;
  }
}

// Function to create placeholder items and start individual API calls
function createPlaceholderItems(gcsUris: string[]) {
  console.log('🚀 Creating placeholder items for', gcsUris.length, 'GCS URIs...');
  
  const placeholderItems: Item[] = [];
  
  gcsUris.forEach((gcsUri, index) => {
    // Convert GCS URI to public URL for thumbnail
    const publicUrl = gcsUri.replace('gs://', 'https://storage.googleapis.com/');
    
          // Create placeholder item with temporary category
      const placeholderItem: Item = {
        id: `placeholder_${Date.now()}_${index}`,
        name: "Analyzing...",
        thumbnail: publicUrl,
        marketPrice: 0,
        timestamp: "0:00",
        sources: [
          { label: "AI Analysis", url: "#" },
          { label: "GCS Storage", url: publicUrl }
        ],
        category: "$", // Temporary category, will be updated
        videoId: currentVideoId || "default", // Use a consistent videoId
        isAnalyzing: true // Add this flag to track analysis status
      };
    
    placeholderItems.push(placeholderItem);
    
          // Save placeholder item to data storage
      upsertItem({
        id: placeholderItem.id,
        name: placeholderItem.name,
        category: placeholderItem.category,
        marketPrice: placeholderItem.marketPrice,
        timestamp: placeholderItem.timestamp,
        videoId: placeholderItem.videoId,
        source: "video_analysis" as const,
        gcsUri: gcsUri,
        publicUrl: publicUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAnalyzing: placeholderItem.isAnalyzing || false
      });
  });
  
        // Add placeholder items to state immediately
      setItems(prev => {
        const newItems = [...prev, ...placeholderItems];
        console.log('🎉 Added', placeholderItems.length, 'placeholder items to the layout. Total items now:', newItems.length);
        return newItems;
      });
      
      // Force re-render to show new items immediately
      setForceUpdate(prev => prev + 1);
      
      // Start individual API calls for each item
      placeholderItems.forEach((item, index) => {
        processIndividualItem(gcsUris[index], item.id);
      });
  
  return placeholderItems;
}

// Function to process a single item and update it in real-time
async function processIndividualItem(gcsUri: string, itemId: string) {
  try {
    console.log('💰 Processing individual item:', gcsUri);
    
    const valuationData = await callValuationAPI(gcsUri);
    
    if (valuationData && valuationData.marketvalue) {
      // Determine category based on market value
      let category: "$" | "$$" | "$$$";
      if (valuationData.marketvalue < 100) {
        category = "$";
      } else if (valuationData.marketvalue < 500) {
        category = "$$";
      } else {
        category = "$$$";
      }
      
      // Update the existing item with real data
      setItems(prev => {
        const updated = prev.map(item => 
          item.id === itemId 
            ? {
                ...item,
                name: valuationData.name || "Unknown Item",
                marketPrice: valuationData.marketvalue,
                category: category,
                isAnalyzing: false
              }
            : item
        );
        console.log('🔄 Items state updated:', {
          totalItems: updated.length,
          updatedItem: updated.find(i => i.id === itemId),
          allItems: updated.map(i => ({ id: i.id, name: i.name, videoId: i.videoId, category: i.category }))
        });
        return updated;
      });
      
      // Force re-render to show updated item
      setForceUpdate(prev => prev + 1);
      
      // Save updated item to data storage
      upsertItem({
        id: itemId,
        name: valuationData.name || "Unknown Item",
        category: category,
        marketPrice: valuationData.marketvalue,
        confidence: valuationData.confidence,
        timestamp: "0:00", // This will be updated from the item state
        videoId: currentVideoId || "default",
        source: "video_analysis" as const,
        gcsUri: gcsUri,
        publicUrl: gcsUri.replace('gs://', 'https://storage.googleapis.com/'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAnalyzing: false
      });
      
      console.log('✅ Updated item:', valuationData.name, 'Category:', category, 'Price:', valuationData.marketvalue);
    } else {
      // Handle case where valuation failed
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? {
              ...item,
              name: "Analysis Failed",
              marketPrice: 0,
              category: "$",
              isAnalyzing: false
            }
          : item
      ));
      // Force re-render to show failed item
      setForceUpdate(prev => prev + 1);
      console.log('❌ Valuation failed for item:', itemId);
    }
    
  } catch (error) {
    console.error('❌ Error processing item:', itemId, error);
    
    // Update item to show error state
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? {
            ...item,
            name: "Error",
            marketPrice: 0,
            category: "$",
            isAnalyzing: false
          }
        : item
    ));
    // Force re-render to show error item
    setForceUpdate(prev => prev + 1);
  }
}

// Function to call the video analysis API
async function callVideoAnalysisAPI(gcsUri: string) {
  try {
    const API_URL = "https://video-service-video-length-2kweszdj5a-uc.a.run.app/analyze_video";
    const API_KEY = process.env.NEXT_PUBLIC_VIDEO_ANALYSIS_API_KEY || "gsafd854fasdfasdf8848674fjf74bfgr0wnfnd";
    
    console.log('🚀 Calling video analysis API...');
    console.log('🌐 API URL:', API_URL);
    console.log('🔑 API Key:', API_KEY ? 'Present' : 'Missing');
    console.log('📹 Video URI:', gcsUri);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_uri: gcsUri,
        frame_interval: 10
      }),
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Video analysis API response received:', data);
      console.log('📊 Full response data:', JSON.stringify(data, null, 2));
      
      // Parse the response and extract GCS URIs
      const gcsUris = extractGCSUris(data);
      console.log('🔗 Extracted GCS URIs:', gcsUris);
      console.log('📊 Total objects found:', gcsUris.length);
      
      // Process all GCS URIs and create items for the layout
      if (gcsUris.length > 0) {
        createPlaceholderItems(gcsUris);
      }
      
    } else {
      const errorText = await response.text();
      console.error('❌ Video analysis API call failed:', response.status);
      console.error('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error calling video analysis API:', error);
    console.error('❌ Full error details:', error);
  }
}
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
    const id = `v_${Date.now()}`;
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
    setVideos((prev) => [...prev, meta]);
    setCurrentVideoId(id);
    setVideoUrl(url);
    setShowUpload(false);
    
    // Save video to data storage
    upsertVideo(meta);
    
    // Upload video to GCS and log URI
    handleVideoUpload(file);
  };

  React.useEffect(() => {
    const v = videos.find((x) => x.id === currentVideoId);
    setVideoUrl(v?.url ?? null);
  }, [currentVideoId, videos]);

  const clearAllData = () => {
    if (!confirm("This will clear ALL items and videos. Continue?")) return;
    setItems([]);
    setVideos([]);
    setCurrentVideoId("");
    setVideoUrl(null);
    setForceUpdate(0);
    
    // Clear data storage
    import('@/utils/dataStorage').then(({ clearDataStorage }) => {
      clearDataStorage();
    });
  };
  
  const onExportAllData = () => {
    const filename = `all_data_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filename, {
      includeHeaders: true,
      dateFormat: "readable"
    });
    console.log('📊 Exported all data to CSV');
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
              if (file) addVideo(file);
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
                          console.log('📸 Captured annotation:', a);
                        }}
                        onSaveAll={handleAnnotationsSaveAll}
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
                {(() => {
                  console.log('🎯 RENDERING GROUPS:', {
                    totalItems: items.length,
                    forceUpdate,
                    groups: {
                      dollar: groups["$"].length,
                      dollarDollar: groups["$$"].length,
                      dollarDollarDollar: groups["$$$"].length
                    },
                    allItems: items.map(i => ({ id: i.id, name: i.name, category: i.category, isAnalyzing: i.isAnalyzing }))
                  });
                  return (
                    <div className="grid grid-cols-1 gap-6 flex-1" key={`groups-${items.length}-${forceUpdate}`}>
                      {(["$", "$$", "$$$"] as const).map((bucket) => (
                    <div key={`${bucket}-${groups[bucket].length}`} className="bg-white rounded-2xl border p-6 shadow-[0_4px_16px_0_rgba(128,128,128,0.16)]">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">{bucket}</h2>
                        <span className="text-xs text-neutral-400 tracking-wide">{groups[bucket].length} items</span>
                      </div>
                      <div className="space-y-3">
                        {groups[bucket].map((item) => (
                          <ItemCard key={`${item.id}-${item.category}-${item.isAnalyzing}`} item={item} />
                        ))}
                        {groups[bucket].length === 0 && (
                          <div className="text-sm text-neutral-400 italic tracking-wide">No items here yet.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                  );
                })()}
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

