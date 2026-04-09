"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PropertyFormProps {
  regions: { id: string; name: string }[];
  initialData?: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    regionId: string | null;
    phone: string | null;
    email: string | null;
    description: string | null;
    propertyType: string;
    yearBuilt: number | null;
    totalUnits: number | null;
    stories: number | null;
  };
}

export function PropertyForm({ regions, initialData }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialData?.name || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [state, setState] = useState(initialData?.state || "");
  const [zip, setZip] = useState(initialData?.zip || "");
  const [regionId, setRegionId] = useState(initialData?.regionId || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [propertyType, setPropertyType] = useState(initialData?.propertyType || "APARTMENT");
  const [yearBuilt, setYearBuilt] = useState(initialData?.yearBuilt?.toString() || "");
  const [totalUnits, setTotalUnits] = useState(initialData?.totalUnits?.toString() || "");
  const [stories, setStories] = useState(initialData?.stories?.toString() || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = isEdit
      ? `/api/admin/properties/${initialData.id}`
      : "/api/admin/properties";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        city,
        state,
        zip,
        regionId: regionId || null,
        phone: phone || null,
        email: email || null,
        description: description || null,
        propertyType,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        totalUnits: totalUnits ? parseInt(totalUnits) : null,
        stories: stories ? parseInt(stories) : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    const property = await res.json();
    router.push(`/admin/properties/${property.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="material-icons text-[16px] mr-1 align-text-bottom">error</span>
          {error}
        </div>
      )}

      <Section title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Property Name *" value={name} onChange={setName} required />
          <Select label="Region" value={regionId} onChange={setRegionId}
            options={[{ value: "", label: "None" }, ...regions.map((r) => ({ value: r.id, label: r.name }))]}
          />
          <Input label="Address *" value={address} onChange={setAddress} required className="sm:col-span-2" />
          <Input label="City *" value={city} onChange={setCity} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="State *" value={state} onChange={setState} required />
            <Input label="ZIP *" value={zip} onChange={setZip} required />
          </div>
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone" value={phone} onChange={setPhone} type="tel" />
          <Input label="Email" value={email} onChange={setEmail} type="email" />
        </div>
      </Section>

      <Section title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Property Type" value={propertyType} onChange={setPropertyType}
            options={[
              { value: "APARTMENT", label: "Apartment" },
              { value: "CONDO", label: "Condo" },
              { value: "TOWNHOUSE", label: "Townhouse" },
              { value: "MIXED_USE", label: "Mixed Use" },
              { value: "STUDENT", label: "Student" },
            ]}
          />
          <Input label="Year Built" value={yearBuilt} onChange={setYearBuilt} type="number" />
          <Input label="Total Units" value={totalUnits} onChange={setTotalUnits} type="number" />
          <Input label="Stories" value={stories} onChange={setStories} type="number" />
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary resize-none"
          />
        </div>
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
          {saving ? <span className="material-icons animate-spin text-[18px]">progress_activity</span>
            : <span className="material-icons text-[18px]">save</span>}
          {isEdit ? "Save Changes" : "Create Property"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-surface">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-secondary p-5 space-y-4">
      <h2 className="font-semibold text-secondary dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false, className = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
