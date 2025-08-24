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
  <div className="absolute right-0 mt-2 w-[480px] min-h-[420px] rounded-2xl border bg-white shadow-lg p-6 z-10">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{profile.name}</div>
          <div className="text-gray-500 text-sm">{profile.email}</div>
        </div>
        <button className="text-gray-400 hover:text-gray-600" title="Sign out" onClick={onLogout}>
          <LogOut size={18} /> Log out
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="# Items processed" value={String(stats.itemsProcessed)} />
        <StatCard label="Total est. value" value={stats.totalEstimated.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} />
        <StatCard label="# Videos uploaded" value={String(stats.videosUploaded)} />
        <StatCard label="Avg item value" value={stats.averageItemValue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} />
      </div>
      <div className="mt-4">
        <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Data Management</div>
        <p className="text-left text-gray-500 text-sm mb-3">Clear all processed items and start fresh. This action cannot be undone.</p>
        <div className="flex justify-center">
          <button
            onClick={onClearAllData}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 text-red-600 w-64 px-4 py-1 hover:bg-red-50 justify-center"
          >
            Clear all data
          </button>
        </div>
      </div>
    </div>
  );
}
