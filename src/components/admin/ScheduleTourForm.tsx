"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ScheduleTourFormProps {
  properties: { id: string; name: string }[];
  agents: { id: string; name: string; propertyIds: string[] }[];
  prospects: { id: string; firstName: string; lastName: string; email: string; phone: string | null }[];
}

interface AvailableSlot {
  time: string;
  endTime: string;
  availableAgents: { agentId: string; agentName: string }[];
}

export function ScheduleTourForm({ properties, agents, prospects }: ScheduleTourFormProps) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [prospectMode, setProspectMode] = useState<"existing" | "new">("new");
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [prospectEmail, setProspectEmail] = useState("");
  const [prospectPhone, setProspectPhone] = useState("");
  const [tourType, setTourType] = useState("IN_PERSON");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch availability when property + date change
  useEffect(() => {
    if (!propertyId || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    setSelectedAgentId("");

    fetch(`/api/admin/availability?propertyId=${propertyId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.availableSlots || []);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [propertyId, date]);

  // Auto-fill prospect data when selecting existing prospect
  useEffect(() => {
    if (prospectMode === "existing" && selectedProspectId) {
      const p = prospects.find((pr) => pr.id === selectedProspectId);
      if (p) {
        setProspectName(`${p.firstName} ${p.lastName}`);
        setProspectEmail(p.email);
        setProspectPhone(p.phone || "");
      }
    }
  }, [selectedProspectId, prospectMode, prospects]);

  // Filter agents by selected property
  const availableAgentsForProperty = agents.filter((a) =>
    a.propertyIds.includes(propertyId)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/admin/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        agentId: selectedAgentId || undefined,
        prospectId: prospectMode === "existing" ? selectedProspectId : undefined,
        prospectName,
        prospectEmail,
        prospectPhone: prospectPhone || undefined,
        scheduledDate: date,
        scheduledTime: selectedSlot?.time,
        tourType,
        notes: notes || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to schedule tour");
      setSubmitting(false);
      return;
    }

    router.push("/admin/tours");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="material-icons text-[16px] mr-2 align-text-bottom">error</span>
          {error}
        </div>
      )}

      {/* Property & Date */}
      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold text-secondary dark:text-white">Property & Date</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Select property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Time Slot Selection */}
      {propertyId && date && (
        <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5">
          <h2 className="mb-3 font-semibold text-secondary dark:text-white">
            Available Times
            {loadingSlots && (
              <span className="ml-2 text-sm text-muted font-normal">Loading...</span>
            )}
          </h2>

          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-muted py-4 text-center">
              <span className="material-icons text-[24px] block mb-1 text-muted/30">event_busy</span>
              No available time slots for this date. Try another date.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => {
                  setSelectedSlot(slot);
                  // Auto-select first available agent
                  if (slot.availableAgents.length === 1) {
                    setSelectedAgentId(slot.availableAgents[0].agentId);
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  selectedSlot?.time === slot.time
                    ? "border-primary bg-primary text-white"
                    : "border-border hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                {formatTime(slot.time)}
                <p className={`text-xs mt-0.5 ${
                  selectedSlot?.time === slot.time ? "text-white/70" : "text-muted"
                }`}>
                  {slot.availableAgents.length} agent{slot.availableAgents.length !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>

          {/* Agent Selection */}
          {selectedSlot && selectedSlot.availableAgents.length > 1 && (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium">Assign Agent</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Auto-assign</option>
                {selectedSlot.availableAgents.map((a) => (
                  <option key={a.agentId} value={a.agentId}>{a.agentName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Prospect Info */}
      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold text-secondary dark:text-white">Prospect Information</h2>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setProspectMode("new")}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              prospectMode === "new" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted"
            }`}
          >
            New Prospect
          </button>
          <button
            type="button"
            onClick={() => setProspectMode("existing")}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              prospectMode === "existing" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted"
            }`}
          >
            Existing Prospect
          </button>
        </div>

        {prospectMode === "existing" && (
          <select
            value={selectedProspectId}
            onChange={(e) => setSelectedProspectId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Select prospect...</option>
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.email})
              </option>
            ))}
          </select>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={prospectEmail}
              onChange={(e) => setProspectEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={prospectPhone}
              onChange={(e) => setProspectPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="(215) 555-0000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tour Type</label>
            <select
              value={tourType}
              onChange={(e) => setTourType(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="IN_PERSON">In Person</option>
              <option value="VIDEO">Video Call</option>
              <option value="SELF_GUIDED">Self-Guided</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary resize-none"
            placeholder="Special requests, unit preferences, etc."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !selectedSlot || !prospectName || !prospectEmail}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {submitting ? (
            <span className="material-icons animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-icons text-[18px]">event_available</span>
          )}
          Schedule Tour
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}
