"use client"

import React, { useState, useEffect } from "react";
import { Trash2, Image, X } from "lucide-react";
import { Item } from "@/data/mockData";

interface ItemCardProps {
  item: Item;
  onDelete?: (itemId: string) => void;
}

export default function ItemCard({ item, onDelete }: ItemCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPriceTooltip, setShowPriceTooltip] = useState(false);

  // Helper function to ensure URLs are absolute
  const ensureAbsoluteUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative URL or missing protocol, assume https
    return `https://${url}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatTooltipData = (item: Item) => {
    const data = {
      name: item.name,
      category: item.category,
      price: item.marketPrice,
      timestamp: item.timestamp,
      videoId: item.videoId,
      sources: item.sources,
      thumbnail: item.thumbnail,
      id: item.id,
      isAnalyzing: item.isAnalyzing
    };
    
    return JSON.stringify(data, null, 2);
  };

  const handlePriceAnalysisClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔍 Price Analysis clicked, toggling tooltip:', !showPriceTooltip);
    console.log('🔍 Current showPriceTooltip state:', showPriceTooltip);
    setShowPriceTooltip(!showPriceTooltip);
    console.log('🔍 New showPriceTooltip state will be:', !showPriceTooltip);
  };

  // No longer need click-outside handling since we have an X button

  return (
    <div 
      className="flex gap-3 rounded-2xl border overflow-hidden relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Delete Button */}
      {onDelete && !item.isAnalyzing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
          title="Delete item"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      {/* Thumbnail */}
      <div className="w-24 h-24 shrink-0 bg-gray-100 flex items-stretch">
        <img
          src={item.thumbnail}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold leading-tight line-clamp-2">{item.name}</div>
            <div className="text-sm text-gray-500">{item.timestamp}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg">{formatPrice(item.marketPrice)}</div>
            <div className="text-xs text-gray-400">avg</div>
            <div className="text-sm text-gray-500">{item.category}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {/* Manual Capture Pill - Show for manual capture items */}
          {item.sources.some(s => s.label === "Manual Capture") && (
            <div className="text-xs inline-flex items-center rounded-full border px-2 py-1 bg-purple-50 border-purple-200 text-purple-700">
              Manual Capture
            </div>
          )}
          
          {/* Price Analysis Button - Show for all items */}
          <button
            onClick={handlePriceAnalysisClick}
            className="text-xs inline-flex items-center rounded-full border px-2 py-1 hover:bg-gray-50 cursor-pointer bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            Price Analysis
          </button>
          
          {/* GCS Storage Link - Show for all items */}
          {item.sources.find(s => s.label === "GCS Storage") && (
            <a
              href={item.sources.find(s => s.label === "GCS Storage")?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs inline-flex items-center rounded-full border px-2 py-1 hover:bg-gray-50"
              title="View image"
            >
              <Image className="h-3 w-3 mr-1" />
            </a>
          )}
        </div>
      </div>

      {/* Price Analysis Popup */}
      {showPriceTooltip && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm w-full mx-4">
            {/* Header with X button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Price Analysis Details</h3>
              <button
                onClick={() => setShowPriceTooltip(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Close"
              >
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Item:</span>
                <span className="text-gray-900">{item.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Category:</span>
                <span className="text-gray-900">{item.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Price:</span>
                <span className="text-gray-900 font-semibold">{formatPrice(item.marketPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                <span className={`font-medium ${item.isAnalyzing ? 'text-yellow-600' : 'text-green-600'}`}>
                  {item.isAnalyzing ? 'Analyzing...' : 'Complete'}
                </span>
              </div>
              
              {/* Valuation Data - Only show if available */}
              {item.valuationData ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Condition:</span>
                      <span className="text-gray-900 capitalize">{item.valuationData?.condition}</span>
                    </div>
                    
                    {/* AI Reasoning */}
                    {item.valuationData?.reasoning && (
                      <div className="space-y-2">
                        <div className="font-medium text-gray-600">AI Reasoning:</div>
                        <div className="bg-blue-50 p-3 rounded border-l-2 border-blue-300">
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {item.valuationData.reasoning}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Valuation Sources */}
                    {item.valuationData?.sources && item.valuationData.sources.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-medium text-gray-600">Sources ({item.valuationData.sources.length}):</div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {item.valuationData.sources.map((source, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                              <div className="font-medium text-blue-600 text-xs">
                                <a 
                                  href={ensureAbsoluteUrl(source.url)}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                  title={source.url}
                                  onClick={(e) => {
                                    console.log('🔗 Source URL clicked:', source.url);
                                    console.log('🔗 Final href:', ensureAbsoluteUrl(source.url));
                                  }}
                                >
                                  {source.title}
                                </a>
                              </div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {source.snippet}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-red-50 p-2 rounded border border-red-200 text-xs text-red-700">
                  <div className="font-medium">Debug: No Valuation Data</div>
                  <div>Item ID: {item.id}</div>
                  <div>Item Name: {item.name}</div>
                  <div>isAnalyzing: {item.isAnalyzing ? 'Yes' : 'No'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {showTooltip && !showPriceTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-40">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 max-w-xs whitespace-pre-wrap font-mono">
            {formatTooltipData(item)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
