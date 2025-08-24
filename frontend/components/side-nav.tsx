"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SideNavProps = {
  onExportCSV: () => void;
  onExportGoogleSheets: () => void;
  onClearAllData: () => void;
  className?: string;
};

export function SideNav({
  onExportCSV,
  onExportGoogleSheets,
  onClearAllData,
  className,
}: SideNavProps) {
  return (
    <aside
      className={cn(
        "md:h-screen md:sticky md:top-0 border-r bg-white p-4 md:p-6 flex flex-col",
        className
      )}
      aria-label="Sidebar"
    >
      {/* Brand / Title */}
      <div className="pt-2 text-3xl font-bold mb-8 leading-tight text-center">
        ValueSpotter
      </div>

      {/* Nav section */}
      <nav className="space-y-1 flex-1">
        <SideNavItem
          icon={<Download className="h-4 w-4" />}
          label="Export to CSV"
          onClick={onExportCSV}
        />
        <SideNavItem
          icon={<FileSpreadsheet className="h-4 w-4" />}
          label="Export to Google Sheets"
          onClick={onExportGoogleSheets}
        />
      </nav>

      {/* Footer / management section */}
      <div className="mt-8">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
          Data Management
        </div>
        <SideNavItem
          label="Clear all data"
          intent="danger"
          onClick={onClearAllData}
        />
      </div>
    </aside>
  );
}

type SideNavItemProps = {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  intent?: "default" | "danger";
};

function SideNavItem({
  icon,
  label,
  onClick,
  href,
  intent = "default",
}: SideNavItemProps) {
  const base =
    "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition outline-none";
  const tones =
    intent === "danger"
      ? "text-red-700 hover:bg-red-50 border border-transparent focus:ring-2 focus:ring-red-100"
      : "text-gray-700 hover:bg-gray-50 border border-transparent focus:ring-2 focus:ring-black/5";
  const content = icon ? (
    <span className="inline-flex items-center gap-3">
      <span className={intent === "danger" ? "text-red-600" : "text-gray-600"}>{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  ) : (
    <span className="truncate text-left w-full">{label}</span>
  );

  if (href) {
    return (
      <a href={href} className={cn(base, tones)} role="menuitem">
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, tones)}
      role="menuitem"
    >
      {content}
    </button>
  );
}
