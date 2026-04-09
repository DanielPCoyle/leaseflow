"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApplicationActionsProps {
  applicationId: string;
  currentStatus: string;
  screeningStatus: string;
}

export function ApplicationActions({
  applicationId,
  currentStatus,
  screeningStatus,
}: ApplicationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");

  async function updateApplication(data: Record<string, unknown>) {
    setLoading(true);
    await fetch(`/api/admin/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
    setLoading(false);
    setShowDecision(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentStatus === "SUBMITTED" && (
          <button
            onClick={() => updateApplication({ status: "UNDER_REVIEW" })}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            <span className="material-icons text-[16px]">visibility</span>
            Begin Review
          </button>
        )}

        {(currentStatus === "UNDER_REVIEW" || currentStatus === "SUBMITTED") && (
          <button
            onClick={() => updateApplication({ status: "SCREENING", screeningStatus: "IN_PROGRESS" })}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-accent/30 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/5 disabled:opacity-50"
          >
            <span className="material-icons text-[16px]">fact_check</span>
            Run Screening
          </button>
        )}

        {currentStatus === "SCREENING" && screeningStatus !== "COMPLETED" && (
          <button
            onClick={() => updateApplication({ screeningStatus: "COMPLETED", screeningResult: { creditScore: 720, backgroundCheck: "clear", evictionHistory: "none" } })}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-success/30 px-3 py-2 text-sm font-medium text-success hover:bg-success/5 disabled:opacity-50"
          >
            <span className="material-icons text-[16px]">check</span>
            Complete Screening
          </button>
        )}

        {(currentStatus === "SCREENING" || currentStatus === "UNDER_REVIEW") && (
          <>
            <button
              onClick={() => setShowDecision(true)}
              className="flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50"
            >
              <span className="material-icons text-[16px]">check_circle</span>
              Approve
            </button>
            <button
              onClick={() => updateApplication({ status: "DENIED", decisionNote: "Application denied." })}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-50"
            >
              <span className="material-icons text-[16px]">cancel</span>
              Deny
            </button>
          </>
        )}
      </div>

      {/* Decision Note Modal */}
      {showDecision && (
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-4 space-y-3">
          <p className="text-sm font-medium">Approve with note:</p>
          <textarea
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            placeholder="Optional approval notes..."
          />
          <div className="flex gap-2">
            <button
              onClick={() => updateApplication({ status: "APPROVED", decisionNote: decisionNote || null })}
              disabled={loading}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50"
            >
              Confirm Approval
            </button>
            <button
              onClick={() => setShowDecision(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
