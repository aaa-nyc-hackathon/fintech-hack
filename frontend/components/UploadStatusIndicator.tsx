"use client"

import React from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

interface UploadStatusIndicatorProps {
  isVisible: boolean;
  status: 'uploading' | 'analyzing' | 'processing' | 'complete' | 'error';
  progress: number;
  onClick: () => void;
}

export default function UploadStatusIndicator({
  isVisible,
  status,
  progress,
  onClick
}: UploadStatusIndicatorProps) {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-white" />;
      case 'analyzing':
        return <Upload className="h-4 w-4 text-white" />;
      case 'processing':
        return <Upload className="h-4 w-4 text-white" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Upload className="h-4 w-4 text-white" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
      case 'analyzing':
      case 'processing':
        return 'bg-blue-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const isPulsing = status === 'uploading' || status === 'analyzing' || status === 'processing';

  return (
    <div className="fixed top-6 right-20 z-30">
      <button
        onClick={onClick}
        className={`
          relative w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110
          ${getStatusColor()}
          ${isPulsing ? 'animate-pulse' : ''}
        `}
        title={`Upload Status: ${progress.toFixed(0)}% - Click to view details`}
      >
        {getStatusIcon()}
        
        {/* Progress indicator ring */}
        {isPulsing && (
          <div className="absolute inset-0 rounded-full border-2 border-white/30">
            <div 
              className="absolute inset-0 rounded-full border-2 border-white border-t-transparent"
              style={{
                transform: `rotate(${progress * 3.6}deg)`,
                transition: 'transform 0.3s ease'
              }}
            />
          </div>
        )}
        
        {/* Status indicator dot */}
        <div className={`
          absolute -top-1 -right-1 w-3 h-3 rounded-full
          ${status === 'complete' ? 'bg-green-400' : 
            status === 'error' ? 'bg-red-400' : 'bg-white'}
          ${isPulsing ? 'animate-ping' : ''}
        `} />
      </button>
      
      {/* Progress text */}
      <div className="mt-2 text-center">
        <div className="text-xs font-medium text-gray-700 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
          {progress.toFixed(0)}%
        </div>
      </div>
    </div>
  );
} 