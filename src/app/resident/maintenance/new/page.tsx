"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const categories = [
  { value: "PLUMBING", label: "Plumbing", icon: "water_drop" },
  { value: "ELECTRICAL", label: "Electrical", icon: "bolt" },
  { value: "APPLIANCE", label: "Appliance", icon: "kitchen" },
  { value: "HVAC", label: "HVAC", icon: "thermostat" },
  { value: "PEST", label: "Pest Control", icon: "pest_control" },
  { value: "LOCK_KEY", label: "Lock / Key", icon: "key" },
  { value: "STRUCTURAL", label: "Structural", icon: "foundation" },
  { value: "OTHER", label: "Other", icon: "more_horiz" },
];

const priorities = [
  { value: "LOW", label: "Low", desc: "Minor issue, no rush" },
  { value: "NORMAL", label: "Normal", desc: "Standard request" },
  { value: "HIGH", label: "High", desc: "Significant inconvenience" },
  { value: "EMERGENCY", label: "Emergency", desc: "Safety hazard or no water/heat" },
];

export default function NewMaintenancePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/resident/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, priority }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit request");
      setSubmitting(false);
      return;
    }

    router.push("/resident/maintenance");
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-secondary dark:text-white">
        New Maintenance Request
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-1 rounded-lg border py-3 text-xs font-medium transition-colors ${
                  category === cat.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted hover:border-primary/30"
                }`}
              >
                <span className="material-icons text-[20px]">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Summary</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Brief description of the issue"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            placeholder="Please describe the issue in detail, including location within your unit"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="mb-2 block text-sm font-medium">Priority</label>
          <div className="space-y-2">
            {priorities.map((p) => (
              <label
                key={p.value}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  priority === p.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={priority === p.value}
                  onChange={(e) => setPriority(e.target.value)}
                  className="accent-primary"
                />
                <div>
                  <p className={`text-sm font-medium ${p.value === "EMERGENCY" ? "text-danger" : ""}`}>
                    {p.label}
                  </p>
                  <p className="text-xs text-muted">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !title || !description || !category}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? (
              <span className="material-icons animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-icons text-[18px]">send</span>
            )}
            Submit Request
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
