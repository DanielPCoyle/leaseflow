"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AgentEditFormProps {
  agent: {
    id: string;
    name: string;
    phone: string;
    title: string;
    transportMode: string;
    bufferMinutes: number;
    propertyIds: string[];
  };
  properties: { id: string; name: string }[];
}

export function AgentEditForm({ agent, properties }: AgentEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(agent.name);
  const [phone, setPhone] = useState(agent.phone);
  const [title, setTitle] = useState(agent.title);
  const [transportMode, setTransportMode] = useState(agent.transportMode);
  const [bufferMinutes, setBufferMinutes] = useState(agent.bufferMinutes.toString());
  const [selectedProperties, setSelectedProperties] = useState<string[]>(agent.propertyIds);

  function toggleProperty(id: string) {
    setSelectedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: name, userPhone: phone || null,
        title: title || null, transportMode,
        bufferMinutes: parseInt(bufferMinutes),
        propertyIds: selectedProperties,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    router.push(`/admin/agents/${agent.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>{error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
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
              <span className="material-icons text-[20px]">{opt.icon}</span>{opt.label}
            </button>
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Buffer Minutes</label>
          <input type="number" value={bufferMinutes} onChange={(e) => setBufferMinutes(e.target.value)} min="0" max="60"
            className="w-32 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
        <h2 className="font-semibold">Assigned Properties</h2>
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
            : <span className="material-icons text-[18px]">save</span>}
          Save Changes
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">Cancel</button>
      </div>
    </form>
  );
}
