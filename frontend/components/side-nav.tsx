"use client"

import * as React from "react";
import { Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SideNavProps = {
  onExportCSV: () => void;
  onExportGoogleSheets: () => void;
  onClearAllData: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
};

export function SideNav({
  onExportCSV,
  onExportGoogleSheets,
  onClearAllData,
  collapsed = false,
  onToggle,
  className,
}: SideNavProps) {
  return (
    <aside
      className={cn(
        "w-full transition-all duration-350 font-sans",
        collapsed ? "min-w-[72px]" : "min-w-[260px]",
        "md:h-screen md:sticky md:top-0 border-r bg-white p-3 md:p-4 flex flex-col"
      )}
      aria-label="Sidebar"
    >
      {/* Header / brand + collapse button */}
      <div className={cn("flex items-center mb-6", collapsed ? "justify-center" : "justify-between")}> 
        {!collapsed && (
          <div className="pt-1 text-2xl font-bold leading-tight">ValueSpotter</div>
        )}
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl transition-transform duration-350"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("transform transition-transform duration-300", collapsed ? "rotate-180" : "rotate-0")}
          >
            {/* ChevronLeft: expanded, ChevronRight: collapsed (rotated) */}
            <path d="M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>

      {/* Nav section */}
      <nav className="space-y-1 flex-1">
        <SideNavItem
          icon={<Download className="h-4 w-4" />}
          label="Export to CSV"
          onClick={onExportCSV}
          collapsed={collapsed}
        />
        <SideNavItem
          icon={<FileSpreadsheet className="h-4 w-4" />} 
          label="Export to Google Sheets"
          onClick={onExportGoogleSheets}
          collapsed={collapsed}
        />
      </nav>

      {/* Footer / management section */}
      <div className={collapsed ? "mt-2" : "mt-8"}>
        {!collapsed && (
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
            Data Management
          </div>
        )}
        <SideNavItem
          icon={<Trash2 className="h-4 w-4" />}
          label="Clear all data"
          intent="danger"
          onClick={onClearAllData}
          collapsed={collapsed}
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
  collapsed?: boolean;
};

function SideNavItem({
  icon,
  label,
  onClick,
  href,
  intent = "default",
  collapsed = false,
}: SideNavItemProps) {
  const base = collapsed
    ? "w-full flex items-center justify-center rounded-xl p-2 text-sm transition outline-none"
    : "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition outline-none";
  const tones =
    intent === "danger"
      ? "text-red-700 hover:bg-red-50 border border-transparent focus:ring-2 focus:ring-red-100"
      : "text-gray-700 hover:bg-gray-50 border border-transparent focus:ring-2 focus:ring-black/5";
  const content = icon ? (
    <span className={collapsed ? "flex items-center justify-center" : "inline-flex items-center gap-3"}>
      <span className={intent === "danger" ? "text-red-600" : "text-gray-600"}>{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && <span className="sr-only">{label}</span>}
    </span>
  ) : (
    !collapsed && label ? <span className="truncate text-left w-full">{label}</span> : null
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
