import React from "react";
import { toCurrency } from "@/utils/helpers";

function formatTimestamp(ts: string) {
  // Handles timestamps in HH:MM:SS or MM:SS
  const parts = ts.split(":");
  if (parts.length === 3 && parts[0] === "00") {
    // Remove leading hour if zero
    return parts.slice(1).join(":");
  }
  return ts;
}

type Source = { label: string; url: string };

type Item = {
  id: string;
  name: string;
  thumbnail: string;
  marketPrice: number;
  timestamp: string;
  sources: Source[];
  category: "$" | "$$" | "$$$";
  videoId: string;
};

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <div className="flex gap-3 rounded-2xl border overflow-hidden">
      <div className="w-24 h-24 shrink-0 bg-gray-100 flex items-stretch">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold leading-tight line-clamp-2">{item.name}</div>
            <div className="text-sm text-gray-500">{formatTimestamp(item.timestamp)}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{toCurrency(item.marketPrice)}</div>
            <div className="text-xs text-gray-500">{item.category}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {item.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs inline-flex items-center rounded-full border px-2 py-1 hover:bg-gray-50"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
