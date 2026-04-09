"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AgentFormProps {
  properties: { id: string; name: string }[];
}

export function AgentForm({ properties }: AgentFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("AGENT");
  const [title, setTitle] = useState("");
  const [transportMode, setTransportMode] = useState("CAR");
  const [bufferMinutes, setBufferMinutes] = useState("15");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  function toggleProperty(id: string) {
    setSelectedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, password, role, title: title || null,
        transportMode, bufferMinutes: parseInt(bufferMinutes),
        propertyIds: selectedProperties,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create agent");
      setSaving(false);
      return;
    }

    router.push("/admin/agents");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>{error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
              <option value="AGENT">Leasing Agent</option>
              <option value="PROPERTY_MANAGER">Property Manager</option>
              <option value="REGIONAL_MANAGER">Regional Manager</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leasing Agent"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Transportation</h2>
        <div className="grid grid-cols-4 gap-2">
          {([
            { value: "CAR", icon: "directions_car", label: "Car" },
            { value: "TRANSIT", icon: "directions_transit", label: "Transit" },
            { value: "BIKE", icon: "directions_bike", label: "Bike" },
            { value: "WALK", icon: "directions_walk", label: "Walk" },
          ] as const).map((opt) => (
            <button key={opt.value} type="button" onClick={() => setTransportMode(opt.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border py-3 text-xs font-medium transition-colors ${
                transportMode === opt.value ? "border-primary bg-primary/5 text-primary" : "border-border text-muted"
              }`}>
              <span className="material-icons text-[20px]">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Buffer Minutes Between Properties</label>
          <input type="number" value={bufferMinutes} onChange={(e) => setBufferMinutes(e.target.value)} min="0" max="60"
            className="w-32 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Assign Properties</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {properties.map((p) => (
            <label key={p.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                selectedProperties.includes(p.id) ? "border-primary bg-primary/5" : "border-border"
              }`}>
              <input type="checkbox" checked={selectedProperties.includes(p.id)}
                onChange={() => toggleProperty(p.id)} className="accent-primary" />
              <span className="text-sm">{p.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
          {saving ? <span className="material-icons animate-spin text-[18px]">progress_activity</span>
            : <span className="material-icons text-[18px]">person_add</span>}
          Create Agent
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">Cancel</button>
      </div>
    </form>
  );
}
