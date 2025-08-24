"use client"

import React from "react";
import { X, Search } from "lucide-react";
import { TabularItem } from "@/types/dataStorage";

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: TabularItem[];
  searchQuery: string;
  onItemClick?: (item: TabularItem) => void;
}

export default function SearchPopup({
  isOpen,
  onClose,
  searchResults,
  searchQuery,
  onItemClick
}: SearchPopupProps) {
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatTooltipData = (item: TabularItem) => {
    const data = {
      name: item.name,
      category: item.category,
      price: item.marketPrice,
      timestamp: item.timestamp,
      videoId: item.videoId,
      source: item.source,
      gcsUri: item.gcsUri,
      publicUrl: item.publicUrl,
      id: item.id,
      isAnalyzing: item.isAnalyzing,
      confidence: item.confidence,
      createdAt: item.createdAt
    };
    
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-xl font-semibold">Search Results</h2>
              <p className="text-sm text-gray-500">
                Found {searchResults.length} item{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={item.publicUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            {item.timestamp} • {item.source === 'video_analysis' ? 'AI Analysis' : 'Manual Capture'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-semibold text-green-600">
                            {formatPrice(item.marketPrice)}
                          </div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </div>
                      </div>
                      
                      {/* JSON Data Preview */}
                      <div className="mt-3">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                            View JSON Data
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto font-mono">
                            {formatTooltipData(item)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Press ESC to close</span>
            <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 