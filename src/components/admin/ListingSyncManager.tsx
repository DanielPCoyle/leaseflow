"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ListingSyncManagerProps {
  propertyId: string;
  platform: string;
  listing: {
    id: string;
    status: string;
    lastSyncAt: string | null;
    syncError: string | null;
  } | null;
}

export function ListingSyncManager({ propertyId, platform, listing }: ListingSyncManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);
    await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, platform }),
    });
    router.refresh();
    setLoading(false);
  }

  async function toggle() {
    if (!listing) return;
    setLoading(true);
    await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: listing.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
        lastSyncAt: new Date().toISOString(),
      }),
    });
    router.refresh();
    setLoading(false);
  }

  if (!listing) {
    return (
      <button
        onClick={activate}
        disabled={loading}
        className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Activate"}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
          listing.status === "ACTIVE"
            ? "bg-success/10 text-success hover:bg-success/20"
            : listing.status === "ERROR"
              ? "bg-danger/10 text-danger"
              : "bg-muted/10 text-muted hover:bg-muted/20"
        }`}
      >
        <span className="material-icons text-[10px]">
          {listing.status === "ACTIVE" ? "check_circle" :
           listing.status === "ERROR" ? "error" : "pause_circle"}
        </span>
        {listing.status}
      </button>
      {listing.lastSyncAt && (
        <span className="text-[10px] text-muted">
          {new Date(listing.lastSyncAt).toLocaleDateString()}
        </span>
      )}
      {listing.syncError && (
        <span className="text-[10px] text-danger" title={listing.syncError}>
          Error
        </span>
      )}
    </div>
  );
}
