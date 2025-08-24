"use client"
import React, { useEffect, useMemo, useState } from "react";
import { normalizeGCSPath } from "@/utils/gcs";
import type { SegmentationFrame, SegmentationResponse } from "@/types/segmentation";

type ValuationSource = { title: string; url: string; snippet?: string };
type ValuationResult = {
  name: string;
  condition: string;
  marketvalue: number;
  image?: string;
  sources: ValuationSource[];
  query?: string;
  error?: string;
};

type ObjWithFrame = {
  // minimal shape rn
  gcs_path: string;
  category_name: string;
  object_id?: number;
  timestamp: number;
};

/** Helper to call server-side proxy at /api/valuation */
async function getValuation(gcsUri: string): Promise<ValuationResult> {
  const res = await fetch("/api/valuation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gcs_uri: gcsUri }),
  });
  const data = (await res.json()) as ValuationResult;
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

export default function SegmentGrid() {
  const [frames, setFrames] = useState<SegmentationFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-object valuation state keyed by the ORIGINAL (gs:// or https) path
  const [valState, setValState] = useState<
    Record<string, { loading: boolean; data?: ValuationResult; error?: string }>
  >({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/segment");
        if (!res.ok) throw new Error("Failed to fetch /api/segment");
        const data: SegmentationFrame[] = await res.json();
        setFrames(data || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const objects: ObjWithFrame[] = useMemo(() => {
    if (!Array.isArray(frames)) return [];
    return frames.flatMap((frame) =>
      Array.isArray(frame.objects)
        ? frame.objects.map((obj) => ({
            ...obj,
            timestamp: frame.timestamp_seconds,
          }))
        : []
    );
  }, [frames]);

  const handleValuation = async (gcsUri: string) => {
    setValState((s) => ({ ...s, [gcsUri]: { ...s[gcsUri], loading: true, error: undefined } }));
    try {
      const result = await getValuation(gcsUri);
      setValState((s) => ({ ...s, [gcsUri]: { loading: false, data: result } }));
    } catch (e: any) {
      setValState((s) => ({ ...s, [gcsUri]: { loading: false, error: e?.message || "Failed" } }));
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {objects.map((obj) => {
        // Use the ORIGINAL path for state key (what you pass to /api/valuation),
        // but normalize to https for <img src>
        const key = obj.gcs_path;
        const imgSrc = normalizeGCSPath(obj.gcs_path);
        const state = valState[key] || { loading: false };

        return (
          <div
            key={`${key}-${obj.object_id ?? ""}`}
            className="rounded-xl border bg-white p-3 flex flex-col"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={obj.category_name}
              className="w-full aspect-square object-cover mb-2 rounded"
              referrerPolicy="no-referrer"
            />
            <div className="font-semibold">{obj.category_name}</div>
            <div className="text-xs text-gray-500 mb-2">t={obj.timestamp.toFixed(2)}s</div>

            {/* Action */}
            <button
              onClick={() => handleValuation(key)}
              disabled={state.loading}
              className="self-start rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {state.loading ? "Getting valuation…" : "Get Valuation"}
            </button>

            {/* Result / error */}
            {state.error && (
              <div className="mt-2 text-xs text-red-600">Error: {state.error}</div>
            )}
            {state.data && (
              <div className="mt-3 text-sm space-y-1">
                <div className="font-medium">
                  {state.data.name} <span className="text-gray-500">({state.data.condition})</span>
                </div>
                <div className="text-gray-800">
                  Estimated value:{" "}
                  <span className="font-semibold">
                    {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                      state.data.marketvalue ?? 0
                    )}
                  </span>
                </div>
                {state.data.sources?.length > 0 && (
                  <div className="pt-1">
                    <div className="text-gray-500 text-xs mb-1">Sources</div>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                      {state.data.sources.map((s, i) => (
                        <li key={i}>
                          <a className="underline text-blue-600" target="_blank" href={s.url}>
                            {s.title}
                          </a>
                          {s.snippet ? <> — <span className="text-gray-600">{s.snippet}</span></> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
