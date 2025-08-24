// Data storage types for tabular data persistence

export interface TabularItem {
  id: string;
  name: string;
  category: "$" | "$$" | "$$$";
  marketPrice: number;
  confidence?: number;
  timestamp: string;
  videoId: string;
  source: "video_analysis" | "manual_capture";
  gcsUri: string;
  publicUrl: string;
  bbox?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  frameNumber?: number;
  objectId?: string;
  createdAt: string;
  updatedAt: string;
  isAnalyzing: boolean;
  valuationData?: {
    name: string;
    condition: string;
    marketvalue: number;
    image: string;
    sources: {
      title: string;
      url: string;
      snippet: string;
    }[];
    query: string;
    reasoning?: string;
  };
}

export interface DataStorage {
  items: TabularItem[];
  videos: {
    id: string;
    name: string;
    fileName: string;
    createdAt: string;
    url: string;
    gcsUri?: string;
    duration?: string;
    totalFrames?: number;
    totalObjects?: number;
  }[];
  metadata: {
    lastUpdated: string;
    totalItems: number;
    totalValue: number;
    averageValue: number;
    categories: {
      "$": number;
      "$$": number;
      "$$$": number;
    };
  };
}

export interface CSVExportOptions {
  includeHeaders?: boolean;
  dateFormat?: "iso" | "readable" | "timestamp";
  columns?: (keyof TabularItem)[];
  filter?: {
    category?: ("$" | "$$" | "$$$")[];
    videoId?: string[];
    source?: ("video_analysis" | "manual_capture")[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
} 