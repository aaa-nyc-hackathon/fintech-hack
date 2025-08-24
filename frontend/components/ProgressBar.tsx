"use client"

import React from "react";
import { CheckCircle, Clock, Play, AlertCircle } from "lucide-react";

interface ProgressBarProps {
  isVisible: boolean;
  progress: number; // 0-100
  status: 'uploading' | 'analyzing' | 'processing' | 'complete' | 'error';
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
}

export default function ProgressBar({
  isVisible,
  progress,
  status,
  currentStep,
  totalSteps,
  completedSteps
}: ProgressBarProps) {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'analyzing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Play className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading Video';
      case 'analyzing':
        return 'Analyzing Video';
      case 'processing':
        return 'Processing Items';
      case 'complete':
        return 'Analysis Complete';
      case 'error':
        return 'Error Occurred';
      default:
        return 'Processing';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'analyzing':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-orange-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed right-6 top-6 w-80 bg-white rounded-2xl border shadow-lg p-4 z-40">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{getStatusText()}</h3>
          <p className="text-sm text-gray-500">
            {progress.toFixed(0)}% Complete
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${getStatusColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Details */}
      {currentStep && totalSteps && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Current Step:</span>
            <span>{completedSteps || 0} / {totalSteps}</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{currentStep}</p>
        </div>
      )}

      {/* Progress Breakdown */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Video Upload:</span>
          <span>{progress >= 10 ? '✓' : '...'}</span>
        </div>
        <div className="flex justify-between">
          <span>Initial Analysis:</span>
          <span>{progress >= 50 ? '✓' : progress >= 10 ? '...' : '⏳'}</span>
        </div>
        <div className="flex justify-between">
          <span>Item Processing:</span>
          <span>{progress >= 50 ? '...' : '⏳'}</span>
        </div>
        <div className="flex justify-between">
          <span>Complete:</span>
          <span>{progress >= 100 ? '✓' : '⏳'}</span>
        </div>
      </div>
    </div>
  );
} 