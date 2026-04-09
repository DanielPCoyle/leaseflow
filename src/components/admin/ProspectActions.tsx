"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProspectActionsProps {
  prospectId: string;
  currentStatus: string;
}

const statusTransitions: Record<string, { label: string; next: string; icon: string }[]> = {
  INQUIRY: [
    { label: "Schedule Tour", next: "TOUR_SCHEDULED", icon: "event" },
    { label: "Mark Lost", next: "LOST", icon: "close" },
  ],
  TOUR_SCHEDULED: [
    { label: "Mark Toured", next: "TOURED", icon: "check_circle" },
    { label: "Mark No-Show", next: "LOST", icon: "person_off" },
  ],
  TOURED: [
    { label: "Application Received", next: "APPLIED", icon: "description" },
    { label: "Mark Lost", next: "LOST", icon: "close" },
  ],
  APPLIED: [
    { label: "Approve", next: "APPROVED", icon: "verified" },
    { label: "Deny", next: "LOST", icon: "close" },
  ],
  APPROVED: [
    { label: "Send Lease", next: "LEASE_SENT", icon: "send" },
  ],
  LEASE_SENT: [
    { label: "Lease Signed", next: "LEASE_SIGNED", icon: "handshake" },
  ],
  LEASE_SIGNED: [
    { label: "Moved In", next: "MOVED_IN", icon: "home" },
  ],
  LOST: [
    { label: "Reopen", next: "INQUIRY", icon: "refresh" },
  ],
};

export function ProspectActions({ prospectId, currentStatus }: ProspectActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const transitions = statusTransitions[currentStatus] || [];

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/admin/prospects/${prospectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  if (transitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((t) => (
        <button
          key={t.next}
          onClick={() => updateStatus(t.next)}
          disabled={loading}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            t.next === "LOST"
              ? "border-danger/30 text-danger hover:bg-danger/5"
              : "border-primary/30 text-primary hover:bg-primary/5"
          }`}
        >
          <span className="material-icons text-[16px]">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
