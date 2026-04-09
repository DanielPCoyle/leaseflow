"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LeaseActionsProps {
  leaseId: string;
  currentStatus: string;
}

const transitions: Record<string, { label: string; next: string; icon: string; color?: string }[]> = {
  DRAFT: [
    { label: "Send for Signature", next: "PENDING_SIGNATURE", icon: "send" },
  ],
  PENDING_SIGNATURE: [
    { label: "Mark as Signed", next: "ACTIVE", icon: "check_circle" },
  ],
  ACTIVE: [
    { label: "Convert to Month-to-Month", next: "MONTH_TO_MONTH", icon: "autorenew" },
    { label: "Terminate Lease", next: "TERMINATED", icon: "cancel", color: "danger" },
  ],
  MONTH_TO_MONTH: [
    { label: "Terminate Lease", next: "TERMINATED", icon: "cancel", color: "danger" },
  ],
  EXPIRING_SOON: [
    { label: "Renew Lease", next: "ACTIVE", icon: "autorenew" },
    { label: "Convert to Month-to-Month", next: "MONTH_TO_MONTH", icon: "autorenew" },
    { label: "Terminate", next: "TERMINATED", icon: "cancel", color: "danger" },
  ],
};

export function LeaseActions({ leaseId, currentStatus }: LeaseActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const actions = transitions[currentStatus] || [];

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/admin/leases/${leaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a.next}
          onClick={() => updateStatus(a.next)}
          disabled={loading}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            a.color === "danger"
              ? "border-danger/30 text-danger hover:bg-danger/5"
              : "border-primary/30 text-primary hover:bg-primary/5"
          }`}
        >
          <span className="material-icons text-[16px]">{a.icon}</span>
          {a.label}
        </button>
      ))}
    </div>
  );
}
