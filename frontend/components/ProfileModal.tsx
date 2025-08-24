import React from "react";
import { LogOut, Trash2 } from "lucide-react";
import StatCard from "./StatCard";

interface ProfileModalProps {
  profile: { name: string; email: string };
  stats: {
    itemsProcessed: number;
    totalEstimated: number;
    videosUploaded: number;
    averageItemValue: number;
  };
  onLogout: () => void;
  onClearAllData: () => void;
}

export default function ProfileModal({ profile, stats, onLogout, onClearAllData }: ProfileModalProps) {
  return (
  <div className="absolute right-0 mt-2 w-[480px] min-h-[420px] rounded-2xl border bg-white shadow-lg p-6 z-10 font-sans">
  <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="font-semibold">{profile.name}</div>
          <div className="text-gray-500 text-sm">{profile.email}</div>
        </div>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-xl border bg-white shadow-[0_2px_8px_0_rgba(128,128,128,0.10)] text-gray-500 hover:text-gray-700 text-xs"
          title="Sign out"
          onClick={onLogout}
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
  <div className="mt-6 mb-6 grid grid-cols-2 gap-3 pb-4 border-b border-gray-100">
        <StatCard label="# Items processed" value={String(stats.itemsProcessed)} />
        <StatCard label="Total est. value" value={stats.totalEstimated.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} />
        <StatCard label="# Videos uploaded" value={String(stats.videosUploaded)} />
        <StatCard label="Avg item value" value={stats.averageItemValue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} />
      </div>
      <div className="mt-4">
  <div className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">DATA MANAGEMENT</div>
  <p className="text-left text-neutral-400 text-xs mb-3 italic leading-relaxed">Clear all processed items and start fresh. This action cannot be undone.</p>
        <div className="flex justify-center">
          <button
            onClick={onClearAllData}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 text-red-600 w-full px-4 py-0.5 justify-center transition-colors hover:bg-red-600 hover:text-white"
          >
            Clear all data
          </button>
        </div>
      </div>
    </div>
  );
}
